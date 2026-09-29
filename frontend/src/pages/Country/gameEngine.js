// src/pages/Country/gameEngine.js
//
// Motor genérico del juego "adivina la región" (port de js/game.js).
// Es imperativo a propósito (temporizador, D3, DOM del SVG): CountryGamePage lo
// monta UNA vez dentro de un useEffect, le pasa los elementos por refs y llama a
// destroy() al desmontar (limpia intervalos, timeouts y listeners).
//
// Todo lo específico del país viene de `country` (window.GEOTARIA_COUNTRY) y los
// textos ya traducidos de `texts` (ver lib/countryText.js). La geometría se
// carga de `geoUrl`; la vista inicial se calcula del bounding box real de las
// regiones y el zoom/pan queda acotado de forma simétrica.

import * as d3 from 'd3';
import { api } from '../../lib/api';
import { normalizeText, findLocalGuess, findExactLocalMatch } from '../../lib/textMatch';

export function createGame({ country, texts, els, geoUrl }) {
  // Nodos capturados UNA vez: en StrictMode React suelta los refs antes de ejecutar
  // el cleanup, así que destroy() no puede volver a leerlos de `els`.
  const svgEl = els.svg;
  const svg = d3.select(svgEl);
  const {
    guess: guessEl, count: countEl, total: totalEl, timer: timerEl, feedback: feedbackEl,
    pause: pauseBtn, toast: toastEl, loadingOverlay, loadingText, submit: submitBtn,
    foundDrawer: foundListWrap, foundList, foundScrim, foundDrawerClose,
    zoomIn: zoomInBtn, zoomOut: zoomOutBtn, resetView: resetViewBtn,
    missing: missingBtn, giveUp: giveUpBtn, reset: resetBtn, mapArea, hint: hintEl,
    slots: slotsEl,
  } = els;

  const QUIZ_SECONDS = country.quizSeconds || 8 * 60;
  const LOW_TIME_THRESHOLD = 30; // segundos restantes para el aviso "se acaba el tiempo"

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ZOOM_TRANSITION_MS = prefersReducedMotion ? 0 : 180;
  const RESET_TRANSITION_MS = prefersReducedMotion ? 0 : 220;

  // Copia de las regiones: loadRegions() les asigna region_id y no debe mutar los datos originales.
  const regions = (country.regions || []).map((r) => ({ ...r }));
  const featureByRegion = new Map();
  const solved = new Set();
  let localMode = false;
  let secondsLeft = QUIZ_SECONDS;
  let timerHandle = null;
  let paused = false;
  let quizEnded = false;
  let tooltipEl = null;
  let zoomBehavior = null;
  let previousBest = null;
  let toastTimeoutHandle = null;
  let resizeTimer = null;
  let disposed = false;
  let mapRendered = false;

  // Un color por región (se reparte en orden, así las vecinas casi nunca repiten):
  // lo usan el mapa y el recuadro de esa región al acertarla.
  const REGION_COLORS = [
    '#e2b657', '#e4877a', '#86c5a2', '#6fb4e0', '#c795d6',
    '#a9cf7c', '#8f9ee3', '#e9a36a', '#d98cab', '#67c6c0',
  ];
  const colorById = new Map(regions.map((r, i) => [r.id, REGION_COLORS[i % REGION_COLORS.length]]));
  const slotById = new Map();

  const cleanups = [];
  function on(target, type, handler) {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  }

  const normalizeSafe = normalizeText;

  // ---------------- TIME ----------------

  function fmtTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  // ---------------- FEEDBACK / TOAST ----------------

  function setFeedback(msg, type = '') {
    feedbackEl.textContent = msg;
    feedbackEl.className = 'feedback ' + type;
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimeoutHandle) clearTimeout(toastTimeoutHandle);
    toastTimeoutHandle = setTimeout(() => toastEl.classList.remove('show'), 1200);
  }

  // Variante más llamativa y duradera para celebrar un récord personal.
  function showRecordToast(msg) {
    toastEl.textContent = '🏆 ' + msg;
    toastEl.style.borderColor = '#e0bd7d';
    toastEl.style.boxShadow = '0 0 18px rgba(224,189,125,.55)';
    toastEl.classList.add('show');
    if (toastTimeoutHandle) clearTimeout(toastTimeoutHandle);
    toastTimeoutHandle = setTimeout(() => {
      toastEl.classList.remove('show');
      toastEl.style.borderColor = '';
      toastEl.style.boxShadow = '';
    }, 2600);
  }

  // ---------------- COUNTER ----------------

  function updateCount() {
    countEl.textContent = solved.size;
    totalEl.textContent = Number.isFinite(Number(country.total)) ? Number(country.total) : regions.length;

    if (solved.size === regions.length && regions.length) {
      endQuiz(texts.completeMessage, 'ok');
    }
  }

  // ---------------- SLOTS (recuadros de nombres) ----------------

  // Ordenados alfabéticamente y SIN texto: no se ve ningún nombre hasta acertarlo.
  function buildSlots() {
    slotById.clear();
    const sorted = [...regions].sort((a, b) =>
      (a.display || '').localeCompare(b.display || '', 'es')
    );
    slotsEl.replaceChildren(
      ...sorted.map((r) => {
        const slot = document.createElement('span');
        slot.setAttribute('role', 'listitem');
        slotById.set(r.id, slot);
        paintSlot(r, 'empty');
        return slot;
      })
    );
  }

  // state: 'empty' | 'solved' | 'missed' (los que faltaban al terminar)
  function paintSlot(region, state) {
    const slot = slotById.get(region.id);
    if (!slot) return;
    slot.className = 'slot' + (state === 'solved' ? ' filled' : state === 'missed' ? ' missed' : '');
    slot.textContent = state === 'empty' ? '' : region.display || '';
    slot.title = state === 'empty' ? '' : region.display || '';
    slot.setAttribute('aria-label', state === 'empty' ? texts.slotEmpty : region.display || '');
    if (state === 'solved') slot.style.setProperty('--slot-color', colorById.get(region.id));
    else slot.style.removeProperty('--slot-color');
  }

  // Animación breve al acertar (la clase se quita sola al terminar).
  function flash(node, cls) {
    if (!node || prefersReducedMotion) return;
    node.classList.add(cls);
    node.addEventListener('animationend', () => node.classList.remove(cls), { once: true });
  }

  // ---------------- REVEAL MISSING ----------------

  function revealMissingOnMap() {
    regions.forEach((r) => {
      const el = featureByRegion.get(r.id);
      if (el) el.classed('revealed-missing', !solved.has(r.id));
      if (!solved.has(r.id)) paintSlot(r, 'missed');
    });
    hintEl.textContent = texts.hintTextRevealed;
  }

  // ---------------- TIMER ----------------

  function startTimer() {
    if (timerHandle || quizEnded) return;

    timerHandle = setInterval(() => {
      if (paused) return;

      secondsLeft--;
      timerEl.textContent = fmtTime(secondsLeft);
      timerEl.classList.toggle('low', secondsLeft > 0 && secondsLeft <= LOW_TIME_THRESHOLD);

      if (secondsLeft <= 0) {
        secondsLeft = 0;
        timerEl.textContent = '00:00';
        endQuiz(texts.timeUpMessage, 'no');
      }
    }, 1000);
  }

  // ---------------- END OF QUIZ ----------------

  function endQuiz(message, type) {
    quizEnded = true;

    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;

    guessEl.disabled = true;
    submitBtn.disabled = true;

    setFeedback(message, type);
    revealMissingOnMap();
    maybeCelebrateRecord();
    saveGameSession();
  }

  // ---------------- PERSONAL RECORD ----------------
  // previousBest se carga ANTES de jugar, así nunca se compara contra sí mismo.

  async function loadPreviousBest() {
    previousBest = null;
    if (!api.isLoggedIn() || !country.id) return;

    try {
      const progressData = await api.getCountryProgress(country.id);
      previousBest = progressData.best_score || null;
    } catch (err) {
      console.warn('Could not load the previous best result for this country', err);
    }
  }

  // Solo si hay sesión y la partida cuenta para el backend (mismas condiciones que saveGameSession).
  function maybeCelebrateRecord() {
    if (!api.isLoggedIn() || !country.id || localMode || !regions.length || !solved.size) return;

    const total = regions.length;
    const pctNow = Math.round((solved.size / total) * 1000) / 10;
    const elapsedNow = QUIZ_SECONDS - secondsLeft;

    if (!previousBest) {
      showRecordToast(texts.firstCompletionMessage);
      return;
    }

    const prevPct = previousBest.percentage;
    const prevTime = previousBest.time_seconds;

    if (pctNow > prevPct) {
      const gain = Math.round((pctNow - prevPct) * 10) / 10;
      showRecordToast(texts.newBestScoreMessage.replace('{gain}', gain));
      return;
    }

    if (pctNow === prevPct && prevTime != null && elapsedNow < prevTime) {
      const saved = prevTime - elapsedNow;
      showRecordToast(texts.newBestTimeMessage.replace('{saved}', saved));
    }
  }

  // ---------------- SAVE SESSION ----------------

  function saveGameSession() {
    if (!api.isLoggedIn() || !country.id || localMode || !regions.length) return;

    const elapsed = QUIZ_SECONDS - secondsLeft;

    // Solo las regiones con region_id real del backend (loadRegions() lo asigna);
    // las que no casaron no tienen id válido y romperían el guardado.
    const answers = regions
      .filter((r) => r.region_id != null)
      .map((r) => ({ region_id: r.region_id, correct: solved.has(r.id) }));

    if (!answers.length) {
      console.warn('No regions have a backend region_id; the session was not saved');
      return;
    }

    api.saveGameSession(country.id, elapsed, answers).catch((err) => {
      console.error('Could not save the game session progress', err);
    });
  }

  // ---------------- RESET ----------------

  function resetQuiz() {
    solved.clear();

    secondsLeft = QUIZ_SECONDS;
    paused = false;
    quizEnded = false;

    timerEl.textContent = fmtTime(QUIZ_SECONDS);
    timerEl.classList.remove('paused', 'low');
    pauseBtn.textContent = texts.pauseLabel;

    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;

    guessEl.disabled = false;
    submitBtn.disabled = false;

    closeFoundDrawer();
    setFeedback('');

    svg.selectAll('.country')
      .classed('found', false)
      .classed('revealed-missing', false)
      .style('--region-fill', null);
    regions.forEach((r) => paintSlot(r, 'empty'));
    slotsEl.scrollTop = 0;
    hintEl.textContent = texts.hintText;

    hideMapTooltip();
    updateFoundList();
    updateCount();

    guessEl.value = '';
    guessEl.focus();

    resetMapView();
  }

  // ---------------- MATCHING REGIONS TO THE SVG ----------------

  function buildFeatureIndex() {
    featureByRegion.clear();

    const shapes = Array.from(svgEl.querySelectorAll('.regions .country'));
    const byId = new Map();
    const byName = new Map();

    shapes.forEach((el) => {
      if (el.id && !byId.has(normalizeSafe(el.id))) byId.set(normalizeSafe(el.id), el);

      const titleEl = el.querySelector('title');
      const label = el.getAttribute('title') || (titleEl ? titleEl.textContent : '');
      if (label && !byName.has(normalizeSafe(label))) byName.set(normalizeSafe(label), el);
    });

    regions.forEach((r) => {
      let el = document.getElementById('hex-' + r.id) || byId.get(normalizeSafe(r.id));

      if (!el) {
        const candidateNames = [r.id, r.display, ...(r.names || [])];
        for (const candidateName of candidateNames) {
          if (!candidateName) continue;
          const found = byName.get(normalizeSafe(candidateName));
          if (found) { el = found; break; }
        }
      }

      if (el) {
        featureByRegion.set(r.id, d3.select(el));
        el.setAttribute('data-region-id', r.id);
      } else {
        console.warn(`Could not find an SVG shape for "${r.display || r.id}"`);
      }
    });
  }

  function validateRegions() {
    const shapes = Array.from(svgEl.querySelectorAll('.regions .country'));
    const missingShapes = regions.filter((r) => !featureByRegion.has(r.id));
    const matchedElements = new Set(
      regions.map((r) => featureByRegion.get(r.id)?.node()).filter(Boolean)
    );
    const unmatchedShapes = shapes.filter((el) => !matchedElements.has(el));

    if (!missingShapes.length && !unmatchedShapes.length) {
      console.log(`✅ ${country.slug}: all ${regions.length} regions match the SVG perfectly.`);
      return;
    }
    if (missingShapes.length) {
      console.warn(
        `⚠️ ${country.slug}: ${missingShapes.length} region(s) have no matching shape in the SVG:`,
        missingShapes.map((r) => `${r.id} → "${r.display}"`)
      );
    }
    if (unmatchedShapes.length) {
      console.warn(
        `⚠️ ${country.slug}: ${unmatchedShapes.length} SVG shape(s) have no matching region:`,
        unmatchedShapes.map(
          (el) => `id="${el.id}" title="${el.getAttribute('title') || el.querySelector('title')?.textContent || ''}"`
        )
      );
    }
  }

  // ---------------- TOOLTIP ----------------

  function ensureMapTooltip() {
    if (tooltipEl) return;
    tooltipEl = document.createElement('div');
    tooltipEl.style.cssText =
      'position:absolute;pointer-events:none;display:none;z-index:20;background:#0e2233;color:var(--ink);border:1px solid var(--accent);padding:6px 9px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 5px 16px rgba(0,0,0,.2)';
    mapArea.appendChild(tooltipEl);
  }

  function moveMapTooltip(e) {
    ensureMapTooltip();
    const rect = mapArea.getBoundingClientRect();
    tooltipEl.style.left = e.clientX - rect.left + 12 + 'px';
    tooltipEl.style.top = e.clientY - rect.top - 12 + 'px';
  }

  function showMapTooltip(name, e) {
    ensureMapTooltip();
    tooltipEl.textContent = name || '';
    tooltipEl.style.display = 'block';
    moveMapTooltip(e);
  }

  function hideMapTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // ---------------- BOUNDING BOX / VIEWBOX ----------------

  function getRegionsBounds() {
    const nodes = Array.from(svgEl.querySelectorAll('.regions .country'));
    if (!nodes.length) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      try {
        const box = node.getBBox();
        if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y) ||
            !Number.isFinite(box.width) || !Number.isFinite(box.height)) return;
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      } catch (err) {
        console.warn('Could not get the bounding box of a region', err);
      }
    });

    if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;

    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return null;

    return { minX, minY, maxX, maxY, width, height, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
  }

  function calculateFittedViewBox(bounds, width, height) {
    if (!bounds) return null;

    const containerRatio = width / height;
    const padding = 0.08; // margen alrededor del territorio

    let targetWidth = bounds.width * (1 + padding * 2);
    let targetHeight = bounds.height * (1 + padding * 2);
    const countryRatio = targetWidth / targetHeight;

    // Misma proporción que el contenedor.
    if (countryRatio < containerRatio) targetWidth = targetHeight * containerRatio;
    else targetHeight = targetWidth / containerRatio;

    return {
      x: bounds.centerX - targetWidth / 2,
      y: bounds.centerY - targetHeight / 2,
      width: targetWidth,
      height: targetHeight,
    };
  }

  function setupMapView() {
    const width = mapArea.clientWidth || 960;
    const height = mapArea.clientHeight || 620;

    const bounds = getRegionsBounds();
    if (!bounds) {
      console.warn('Could not compute the actual bounding box of the country.');
      return;
    }

    const fitted = calculateFittedViewBox(bounds, width, height);
    if (!fitted) return;

    svg.attr('viewBox', [fitted.x, fitted.y, fitted.width, fitted.height].join(' '));
    svg.attr('preserveAspectRatio', 'xMidYMid meet');
    svg.attr('x', 0);
    svg.attr('y', 0);

    // extent y translateExtent deben compartir espacio de coordenadas (unidades
    // del viewBox, no píxeles CSS) para que el límite del arrastre sea simétrico.
    zoomBehavior = d3
      .zoom()
      .scaleExtent([1, 10])
      .extent([[fitted.x, fitted.y], [fitted.x + fitted.width, fitted.y + fitted.height]])
      .translateExtent([[fitted.x, fitted.y], [fitted.x + fitted.width, fitted.y + fitted.height]])
      .on('zoom', (e) => {
        svg.select('.regions').attr('transform', e.transform);
      });

    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, d3.zoomIdentity); // vista inicial
  }

  function resetMapView() {
    if (!zoomBehavior) return;
    svg.transition().duration(RESET_TRANSITION_MS).call(zoomBehavior.transform, d3.zoomIdentity);
  }

  function renderMap() {
    buildFeatureIndex();
    validateRegions();
    setupMapView();

    svg
      .selectAll('.country')
      .on('click', () => {})
      .on('mouseenter', function (e) {
        const id = this.getAttribute('data-region-id');
        if (!id) return;
        if (!quizEnded && !solved.has(id)) return;
        const r = regions.find((x) => x.id === id);
        if (r) showMapTooltip(r.display, e);
      })
      .on('mousemove', function (e) {
        const id = this.getAttribute('data-region-id');
        if (quizEnded || (id && solved.has(id))) moveMapTooltip(e);
      })
      .on('mouseleave', hideMapTooltip);
  }

  // ---------------- REGION SOLVED ----------------

  function addSolved(region) {
    if (!region || solved.has(region.id)) return;

    solved.add(region.id);

    const el = featureByRegion.get(region.id);
    if (el) {
      el.classed('found', true).classed('revealed-missing', false);
      el.node().style.setProperty('--region-fill', colorById.get(region.id));
      flash(el.node(), 'just-found');
    }

    paintSlot(region, 'solved');
    const slot = slotById.get(region.id);
    if (slot) {
      flash(slot, 'just');
      slot.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    updateFoundList();

    // Primero el feedback y luego updateCount(): si esta era la última región,
    // updateCount() termina la partida y su mensaje de "completado" no debe
    // quedar pisado por el "¡Correcto!" (en game.js original sí se pisaba).
    showToast('✓ ' + (region.display || ''));
    setFeedback(texts.correctPrefix + (region.display || ''), 'ok');
    updateCount();

    guessEl.value = '';
    guessEl.focus();
  }

  // ---------------- BACKEND: LOAD REGIONS ----------------

  async function loadRegions() {
    try {
      const data = await api.getRegionsNames(country.slug);
      if (disposed) return;

      let matchedCount = 0;
      data.forEach((backendRegion) => {
        const backendKeys = (backendRegion.names || []).map(normalizeSafe);
        const local = regions.find((r) =>
          (r.names || []).some((n) => backendKeys.includes(normalizeSafe(n)))
        );
        if (local) {
          local.region_id = backendRegion.region_id;
          matchedCount++;
        }
      });

      localMode = false;
      setFeedback(texts.connected(matchedCount));
    } catch (err) {
      if (disposed) return;
      console.warn('Backend unavailable or country not seeded, using local mode', err);
      localMode = true;
    }
  }

  // ---------------- CHECK A GUESS ----------------

  async function submitGuess() {
    if (quizEnded || paused) return;

    const raw = guessEl.value.trim();
    if (!raw) return;

    startTimer();

    // Siempre primero en local (instantáneo, sin red): los nombres válidos ya
    // están en `regions`. Al backend solo se pregunta si lo local no encuentra nada.
    let region = findLocalGuess(regions, raw);

    if (!region && !localMode) {
      try {
        const data = await api.checkRegionName(country.slug, raw);
        if (data.encontrado) {
          region = regions.find((r) => r.region_id === data.region_id) || null;
        }
      } catch {
        localMode = true;
      }
      if (disposed) return;
    }

    if (!region) {
      setFeedback(texts.notFoundMessage, 'no');
      guessEl.select();
      return;
    }

    if (solved.has(region.id)) {
      setFeedback(texts.alreadyFoundMessage);
      guessEl.select();
      return;
    }

    addSolved(region);
  }

  // ---------------- FOUND-REGIONS DRAWER ----------------

  function updateFoundList() {
    const found = regions
      .filter((r) => solved.has(r.id))
      .sort((a, b) => a.display.localeCompare(b.display, country.lang || 'es'));

    foundList.replaceChildren(
      ...found.map((r) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = r.display;
        return chip;
      })
    );
  }

  function openFoundDrawer() {
    foundListWrap.classList.add('open');
    foundScrim.classList.add('open');
  }

  function closeFoundDrawer() {
    foundListWrap.classList.remove('open');
    foundScrim.classList.remove('open');
  }

  function toggleFoundList() {
    if (!solved.size) {
      setFeedback(texts.noneFoundMessage);
      return;
    }
    updateFoundList();
    if (foundListWrap.classList.contains('open')) closeFoundDrawer();
    else openFoundDrawer();
  }

  // ---------------- CONTROLS ----------------

  on(pauseBtn, 'click', () => {
    if (quizEnded) return;

    paused = !paused;
    timerEl.classList.toggle('paused', paused);
    pauseBtn.textContent = paused ? texts.resumeLabel : texts.pauseLabel;
    setFeedback(paused ? texts.pausedMessage : '');

    if (paused) guessEl.blur();
    else guessEl.focus();
  });

  on(submitBtn, 'click', submitGuess);
  on(missingBtn, 'click', toggleFoundList);
  on(foundDrawerClose, 'click', closeFoundDrawer);
  on(foundScrim, 'click', closeFoundDrawer);

  on(giveUpBtn, 'click', () => {
    if (quizEnded) return;
    endQuiz(
      texts.giveUpMessage.replace('{count}', solved.size).replace('{total}', regions.length),
      'no'
    );
  });

  on(resetBtn, 'click', resetQuiz);

  // Zoom: los manejadores leen `zoomBehavior` en el momento del clic, así siguen
  // valiendo cuando el redimensionado recrea el comportamiento de zoom.
  on(zoomInBtn, 'click', () => {
    if (zoomBehavior) svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.scaleBy, 1.45);
  });
  on(zoomOutBtn, 'click', () => {
    if (zoomBehavior) svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.scaleBy, 1 / 1.45);
  });
  on(resetViewBtn, 'click', resetMapView);

  on(guessEl, 'keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess();
    }
  });

  // Comprobación instantánea al escribir: solo con el nombre COMPLETO exacto
  // (findLocalGuess aceptaría prefijos de 3+ letras y marcaría "Kabul" al teclear "kab").
  on(guessEl, 'input', () => {
    if (quizEnded || paused) return;

    const raw = guessEl.value.trim();
    if (!raw) return;

    const region = findExactLocalMatch(regions, raw);
    if (region && !solved.has(region.id)) {
      startTimer();
      addSolved(region);
    }
  });

  // ---------------- LOAD GEOMETRY ----------------

  async function loadGeometry() {
    // Sin { cache: "no-store" }: se usa la caché HTTP normal del navegador.
    const res = await fetch(geoUrl);
    if (!res.ok) throw new Error('Could not load the geometry: HTTP ' + res.status);

    const svgText = await res.text();
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('The geometry SVG is not valid');
    if (disposed) return;

    const regionsGroup = svgEl.querySelector('.regions');
    if (!regionsGroup) throw new Error('#map .regions does not exist');

    regionsGroup.replaceChildren();

    doc.documentElement
      .querySelectorAll('path, polygon, polyline, circle, ellipse')
      .forEach((shape) => {
        if (shape.closest('#points, #label_points')) return;
        const imported = document.importNode(shape, true);
        imported.classList.add('country');
        regionsGroup.appendChild(imported);
      });

    svg.attr('preserveAspectRatio', 'xMidYMid meet');
  }

  // ---------------- RESPONSIVE ----------------

  on(window, 'resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!disposed && mapRendered) renderMap();
    }, 150);
  });

  // ---------------- BOOTSTRAP ----------------

  async function bootstrap() {
    // Recuadros vacíos ya desde el principio (así el mapa se calcula con su tamaño final).
    buildSlots();

    // Textos iniciales de los elementos que el motor controla.
    totalEl.textContent = Number.isFinite(Number(country.total)) ? Number(country.total) : regions.length;
    pauseBtn.textContent = texts.pauseLabel;
    hintEl.textContent = texts.hintText;
    loadingText.textContent = texts.loadingMap;
    timerEl.textContent = fmtTime(QUIZ_SECONDS);

    try {
      // Solo se espera a la geometría SVG (lo único que renderMap necesita).
      // loadRegions() y loadPreviousBest() son llamadas al backend que solo hacen
      // falta al terminar la partida: van en paralelo y no retrasan el mapa.
      await loadGeometry();
      if (disposed) return;

      renderMap();
      mapRendered = true;
      updateCount();
      startTimer();

      timerEl.textContent = fmtTime(QUIZ_SECONDS);
      guessEl.disabled = false;
      submitBtn.disabled = false;
      loadingOverlay.classList.add('hidden');

      setFeedback(texts.readyMessage);
      guessEl.focus();

      Promise.all([loadRegions(), loadPreviousBest()]).then(() => {
        if (!disposed && localMode) showToast(texts.localModeToast);
      });
    } catch (err) {
      if (disposed) return;
      console.error(err);
      loadingOverlay.classList.add('error');
      loadingText.textContent = texts.loadErrorMessage;
      setFeedback(texts.loadErrorMessage, 'no');
    }
  }

  bootstrap();

  return {
    destroy() {
      disposed = true;
      if (timerHandle) clearInterval(timerHandle);
      timerHandle = null;
      clearTimeout(toastTimeoutHandle);
      clearTimeout(resizeTimer);
      cleanups.forEach((fn) => fn());
      svg.on('.zoom', null);
      svg.selectAll('.country').on('click mouseenter mousemove mouseleave', null);
      svg.interrupt();
      if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
      slotsEl.replaceChildren();
      const regionsGroup = svgEl.querySelector('.regions');
      if (regionsGroup) regionsGroup.replaceChildren();
    },
  };
}
