// src/pages/Country/gameEngine.js
//
// Motor genérico del juego "adivina la región" (port de js/game.js).
// Es imperativo a propósito (D3, DOM del SVG): CountryGamePage lo monta UNA vez
// dentro de un useEffect, le pasa los elementos por refs y llama a destroy() al
// desmontar (limpia timeouts y listeners).
//
// Fases de la partida: 'idle' (pantalla de inicio, esperando al botón Empezar) →
// 'playing' → 'ended' (pantalla de resultado). No hay cronómetro por ahora.
//
// Todo lo específico del país viene de `country` (window.GEOTARIA_COUNTRY) y los
// textos ya traducidos de `texts` (ver lib/countryText.js). La geometría se
// carga de `geoUrl`; la vista inicial se calcula del bounding box real de las
// regiones y el zoom/pan queda acotado de forma simétrica.

import * as d3 from 'd3';
import { api } from '../../lib/api';
import { normalizeText, findLocalGuess, findExactLocalMatch, longerCandidateWait } from '../../lib/textMatch';
import { matchBackendRegions } from './matchRegions';

// MODO ONLINE (partida 1 contra 1, ver pages/Match): si se pasa `online`, el motor no
// decide nada por su cuenta. Cada intento se manda al servidor (`online.guess`) y solo se
// pinta lo que el servidor confirma. No hay pantalla de inicio, ni rendirse, ni resultado:
// quien lo monta controla la fase con setPhase('waiting' | 'playing' | 'ended').
//   online = {
//     guess(text)   -> Promise<{ result: 'correct'|'already'|'wrong', region_id, name, score }>
//     loadAnswers() -> Promise<number[]>   region_id ya acertados (al recargar la página)
//     onScore(n)    se llama cada vez que cambia mi número de aciertos
//     onReady()     el mapa está pintado y listo para jugar
//     errorText(err) -> string   texto para un fallo de red / de la partida
//   }
// Opcional (solo online): si `els.rivalSvg` existe, el motor mantiene ahí un SEGUNDO mapa de solo
// lectura con lo que el rival lleva acertado (showRivalLive). Es una copia de las formas del mapa
// principal, sin ids ni títulos, así que nunca enseña nombres.
export function createGame({ country, texts, els, geoUrl, online }) {
  const isOnline = Boolean(online);
  // Nodos capturados UNA vez: en StrictMode React suelta los refs antes de ejecutar
  // el cleanup, así que destroy() no puede volver a leerlos de `els`.
  const svgEl = els.svg;
  const svg = d3.select(svgEl);
  const {
    guess: guessEl, count: countEl, total: totalEl, progressBar, feedback: feedbackEl,
    toast: toastEl, loadingOverlay, loadingText, submit: submitBtn,
    zoomIn: zoomInBtn, zoomOut: zoomOutBtn, resetView: resetViewBtn,
    giveUp: giveUpBtn, reset: resetBtn, mapArea, hint: hintEl,
    slots: slotsEl,
    intro: introEl, start: startBtn,
    result: resultEl, resultEyebrow, resultTitle, resultMessage, resultHits, resultMissing,
    resultPercent, resultBar, resultRecord, playAgain: playAgainBtn, viewMap: viewMapBtn,
    viewResult: viewResultBtn,
    rivalSvg: rivalSvgEl,
  } = els;

  // Total que se muestra (el del archivo del país; si no, el nº de regiones).
  const TOTAL = Number.isFinite(Number(country.total)) ? Number(country.total) : (country.regions || []).length;

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ZOOM_TRANSITION_MS = prefersReducedMotion ? 0 : 180;
  const RESET_TRANSITION_MS = prefersReducedMotion ? 0 : 220;

  // Copia de las regiones: loadRegions() les asigna region_id y no debe mutar los datos originales.
  // Varios archivos de país usan `name` en vez de `display`: se unifica aquí para que
  // los huecos, el tooltip y el orden nunca salgan vacíos.
  const regions = (country.regions || []).map((r) => ({
    ...r,
    display: r.display || r.name || (r.names || [])[0] || r.id,
  }));
  const featureByRegion = new Map();
  const solved = new Set();
  let localMode = false;
  let phase = 'idle'; // 'idle' | 'playing' | 'ended'
  let tooltipEl = null;
  let zoomBehavior = null;
  let previousBest = null;
  let toastTimeoutHandle = null;
  let resultRaf = null;
  let resizeTimer = null;
  let disposed = false;
  let mapRendered = false;

  const slotById = new Map();

  const cleanups = [];
  function on(target, type, handler) {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  }

  const normalizeSafe = normalizeText;

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

  // ---------------- COUNTER ----------------

  function updateCount() {
    countEl.textContent = solved.size;
    totalEl.textContent = TOTAL;
    progressBar.style.width = (TOTAL ? Math.min(100, (solved.size / TOTAL) * 100) : 0) + '%';

    if (isOnline) {
      if (online.onScore) online.onScore(solved.size);
      return; // aquí termina la partida el servidor, no el motor
    }

    if (phase === 'playing' && regions.length && solved.size === regions.length) {
      endQuiz('complete');
    }
  }

  // ---------------- SLOTS (recuadros de nombres) ----------------

  // Ordenados alfabéticamente y SIN texto: no se ve ningún nombre hasta acertarlo.
  function buildSlots() {
    slotById.clear();
    const sorted = [...regions].sort((a, b) =>
      (a.display || '').localeCompare(b.display || '', 'en')
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

  // state: 'empty' | 'solved' | 'missed' (los que faltaban al terminar) | 'rival' (online:
  // solo los acertó el rival)
  function paintSlot(region, state) {
    const slot = slotById.get(region.id);
    if (!slot) return;
    slot.className = 'slot' + (state === 'solved' ? ' filled' : state === 'missed' ? ' missed' : state === 'rival' ? ' rival' : '');
    slot.textContent = state === 'empty' ? '' : region.display || '';
    slot.title = state === 'empty' ? '' : region.display || '';
    slot.setAttribute('aria-label', state === 'empty' ? texts.slotEmpty : region.display || '');
  }

  // Desplaza SOLO la lista de recuadros hasta el acertado. scrollIntoView movería también
  // la página (con el teclado abierto en el móvil descolocaba toda la pantalla).
  function revealSlot(slot) {
    const s = slot.getBoundingClientRect();
    const c = slotsEl.getBoundingClientRect();
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';
    if (s.top < c.top) slotsEl.scrollBy({ top: s.top - c.top - 8, behavior });
    else if (s.bottom > c.bottom) slotsEl.scrollBy({ top: s.bottom - c.bottom + 8, behavior });
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
      const theirs = heldByRival(r);
      if (el) el.classed('revealed-missing', !solved.has(r.id) && !theirs);
      if (!solved.has(r.id)) paintSlot(r, theirs ? 'rival' : 'missed');
    });
    hintEl.textContent = texts.hintTextRevealed;
  }

  // ---------------- ONLINE: the rival's regions (shown once the match is over) ----------------

  let rivalSet = null; // Set de region_id que acertó el rival, o null si aún no se conocen

  function heldByRival(region) {
    return Boolean(rivalSet && region.region_id != null && rivalSet.has(region.region_id));
  }

  // Las que solo acertó el rival se pintan aparte; las que acertamos los dos siguen en mi color.
  function paintRival() {
    if (!rivalSet || !mapRendered) return;
    regions.forEach((r) => {
      if (solved.has(r.id) || !heldByRival(r)) return;
      const el = featureByRegion.get(r.id);
      if (el) el.classed('revealed-missing', false).classed('rival-found', true);
      paintSlot(r, 'rival');
    });
  }

  // ---------------- ONLINE: the rival's own map (live) ----------------
  // Segundo mapa, de solo lectura, con las regiones que el rival lleva acertadas. Se construye
  // clonando las formas del mapa principal (sin id ni título: no se cuela ningún nombre).

  let rivalMapBuilt = false;
  let rivalLiveSet = null; // Set de region_id que el rival lleva acertadas, o null si aún no se sabe
  const rivalShapeByRegion = new Map(); // id local de la región -> forma de la copia

  function buildRivalMap() {
    if (!rivalSvgEl || rivalMapBuilt) return;
    const group = rivalSvgEl.querySelector('.regions');
    if (!group) return;
    group.replaceChildren();
    rivalShapeByRegion.clear();

    svgEl.querySelectorAll('.regions .country').forEach((shape) => {
      const copy = shape.cloneNode(true);
      copy.removeAttribute('id');
      copy.removeAttribute('title');
      copy.querySelectorAll('title').forEach((t) => t.remove());
      copy.classList.remove('found', 'just-found', 'revealed-missing', 'rival-found');
      group.appendChild(copy);
      const regionId = copy.getAttribute('data-region-id');
      if (regionId) rivalShapeByRegion.set(regionId, copy);
    });
    rivalSvgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    rivalMapBuilt = true;
  }

  // Misma silueta que el mapa principal, pero encajada en el tamaño de SU contenedor.
  function setupRivalView() {
    if (!rivalSvgEl || !rivalMapBuilt) return;
    const width = rivalSvgEl.clientWidth;
    const height = rivalSvgEl.clientHeight;
    if (!width || !height) return;
    const fitted = calculateFittedViewBox(getRegionsBounds(), width, height);
    if (!fitted) return;
    rivalSvgEl.setAttribute('viewBox', [fitted.x, fitted.y, fitted.width, fitted.height].join(' '));
  }

  function paintRivalMap() {
    if (!rivalMapBuilt || !rivalLiveSet) return;
    // Uno o dos aciertos nuevos = el rival acaba de acertar (con destello). Muchos de golpe =
    // recarga a mitad de partida o resultado final: se pinta sin animar.
    const fresh = [];
    regions.forEach((r) => {
      const el = rivalShapeByRegion.get(r.id);
      if (!el) return;
      const on = r.region_id != null && rivalLiveSet.has(r.region_id);
      if (on && !el.classList.contains('rival-found')) fresh.push(el);
      if (!on) el.classList.remove('rival-found');
    });
    fresh.forEach((el) => {
      el.classList.add('rival-found');
      if (fresh.length <= 2) flash(el, 'just-found');
    });
  }

  // ---------------- START ----------------

  function showIntro() {
    introEl.classList.remove('hidden');
    startBtn.focus({ preventScroll: true });
  }

  function startGame() {
    if (phase !== 'idle') return;
    phase = 'playing';

    introEl.classList.add('hidden');
    guessEl.disabled = false;
    submitBtn.disabled = false;
    giveUpBtn.disabled = false;

    setFeedback('');
    guessEl.focus();
  }

  // ---------------- RESULT SCREEN ----------------

  function openResult(complete, count) {
    const pct = TOTAL ? Math.round((count / TOTAL) * 100) : 0;

    resultEl.classList.toggle('is-complete', complete);
    resultEyebrow.textContent = complete ? texts.resultEyebrowComplete : texts.resultEyebrowEnded;
    resultTitle.textContent = texts.resultTitle(pct, complete);
    resultMessage.textContent = texts.resultMessage(count, complete);
    resultHits.textContent = count;
    resultMissing.textContent = Math.max(0, TOTAL - count);
    resultPercent.textContent = pct + '%';

    resultBar.style.width = '0%';
    resultEl.classList.remove('hidden');
    viewResultBtn.classList.add('hidden');

    // La barra se rellena al abrirse (un frame después, para que se anime).
    cancelAnimationFrame(resultRaf);
    resultRaf = requestAnimationFrame(() => { resultBar.style.width = pct + '%'; });

    playAgainBtn.focus({ preventScroll: true });
  }

  function closeResult() {
    resultEl.classList.add('hidden');
    if (phase === 'ended') viewResultBtn.classList.remove('hidden');
  }

  // ---------------- END OF QUIZ ----------------

  function endQuiz(kind) {
    if (phase !== 'playing') return;
    phase = 'ended';
    const complete = kind === 'complete';

    guessEl.disabled = true;
    submitBtn.disabled = true;
    giveUpBtn.disabled = true;

    revealMissingOnMap();
    setFeedback(texts.endedFeedback(solved.size));

    openResult(complete, solved.size);
    showRecord(getRecordMessage());
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
  function getRecordMessage() {
    if (!api.isLoggedIn() || !country.id || localMode || !regions.length || !solved.size) return null;

    if (!previousBest) return texts.firstCompletionMessage;

    const pctNow = Math.round((solved.size / regions.length) * 1000) / 10;
    if (pctNow > previousBest.percentage) {
      const gain = Math.round((pctNow - previousBest.percentage) * 10) / 10;
      return texts.newBestScoreMessage.replace('{gain}', gain);
    }
    return null;
  }

  function showRecord(message) {
    resultRecord.textContent = message || '';
    resultRecord.classList.toggle('hidden', !message);
  }

  // ---------------- SAVE SESSION ----------------

  function saveGameSession() {
    if (!api.isLoggedIn() || !country.id || localMode || !regions.length) return;

    // Solo las regiones con region_id real del backend (loadRegions() lo asigna);
    // las que no casaron no tienen id válido y romperían el guardado.
    const answers = regions
      .filter((r) => r.region_id != null)
      .map((r) => ({ region_id: r.region_id, correct: solved.has(r.id) }));

    if (!answers.length) {
      console.warn('No regions have a backend region_id; the session was not saved');
      return;
    }

    // Sin cronómetro por ahora: el backend acepta time_seconds = null.
    api.saveGameSession(country.id, null, answers).catch((err) => {
      console.error('Could not save the game session progress', err);
    });
  }

  // ---------------- RESET ----------------
  // Deja el juego como al cargar: mapa limpio y pantalla de inicio.

  function resetQuiz() {
    solved.clear();
    phase = 'idle';

    guessEl.disabled = true;
    submitBtn.disabled = true;
    giveUpBtn.disabled = true;

    setFeedback('');
    showRecord(null);
    resultEl.classList.add('hidden');
    viewResultBtn.classList.add('hidden');

    svg.selectAll('.country')
      .classed('found', false)
      .classed('revealed-missing', false);
    regions.forEach((r) => paintSlot(r, 'empty'));
    slotsEl.scrollTop = 0;
    hintEl.textContent = texts.hintText;

    hideMapTooltip();
    updateCount();

    guessEl.value = '';
    resetMapView();
    showIntro();
  }

  // ---------------- MATCHING REGIONS TO THE SVG ----------------

  function buildFeatureIndex() {
    featureByRegion.clear();

    const shapes = Array.from(svgEl.querySelectorAll('.regions .country'));
    const byId = new Map();
    const byIdLoose = new Map(); // ids sin guiones ni símbolos: "HT-AR" == "HTAR"
    const byName = new Map();
    const looseId = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    shapes.forEach((el) => {
      if (el.id && !byId.has(normalizeSafe(el.id))) byId.set(normalizeSafe(el.id), el);
      if (el.id && !byIdLoose.has(looseId(el.id))) byIdLoose.set(looseId(el.id), el);

      const titleEl = el.querySelector('title');
      const label = el.getAttribute('title') || (titleEl ? titleEl.textContent : '');
      if (label && !byName.has(normalizeSafe(label))) byName.set(normalizeSafe(label), el);
    });

    regions.forEach((r) => {
      let el = document.getElementById('hex-' + r.id) || byId.get(normalizeSafe(r.id)) || byIdLoose.get(looseId(r.id));

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
    const w = tooltipEl.offsetWidth || 0;
    const h = tooltipEl.offsetHeight || 0;
    // Dentro del mapa en todo momento (en el móvil, junto al borde, se cortaba).
    const x = Math.max(8, Math.min(e.clientX - rect.left + 12, rect.width - w - 8));
    const y = Math.max(8, Math.min(e.clientY - rect.top - 12, rect.height - h - 8));
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = y + 'px';
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
    buildRivalMap();
    setupRivalView();

    svg
      .selectAll('.country')
      .on('click', () => {})
      .on('mouseenter', function (e) {
        const id = this.getAttribute('data-region-id');
        if (!id) return;
        if (phase !== 'ended' && !solved.has(id)) return;
        const r = regions.find((x) => x.id === id);
        if (r) showMapTooltip(r.display, e);
      })
      .on('mousemove', function (e) {
        const id = this.getAttribute('data-region-id');
        if (phase === 'ended' || (id && solved.has(id))) moveMapTooltip(e);
      })
      .on('mouseleave', hideMapTooltip);
  }

  // ---------------- REGION SOLVED ----------------

  // opts.quiet: pinta sin toast, feedback ni animación (al recuperar una partida).
  // opts.clear: false = no vacía el campo de texto (en online el jugador puede haber
  // empezado a escribir otra región mientras el servidor respondía).
  function addSolved(region, opts = {}) {
    if (!region || solved.has(region.id)) return;
    const quiet = Boolean(opts.quiet);
    const clear = opts.clear !== false;

    solved.add(region.id);

    const el = featureByRegion.get(region.id);
    if (el) {
      el.classed('found', true).classed('revealed-missing', false);
      if (!quiet) flash(el.node(), 'just-found');
    }

    paintSlot(region, 'solved');
    const slot = slotById.get(region.id);
    if (slot && !quiet) {
      flash(slot, 'just');
      revealSlot(slot);
    }

    if (quiet) {
      updateCount();
      return;
    }

    // Primero el feedback y luego updateCount(): si esta era la última región,
    // updateCount() termina la partida y su mensaje de "completado" no debe
    // quedar pisado por el "¡Correcto!" (en game.js original sí se pisaba).
    showToast('✓ ' + (region.display || ''));
    setFeedback(texts.correctPrefix + (region.display || ''), 'ok');
    updateCount();

    if (clear) guessEl.value = '';
    if (!guessEl.disabled) guessEl.focus();
  }

  // ---------------- BACKEND: LOAD REGIONS ----------------

  async function loadRegions() {
    try {
      const data = await api.getRegionsNames(country.slug);
      if (disposed) return;

      matchBackendRegions(regions, data, normalizeSafe);

      localMode = false;
    } catch (err) {
      if (disposed) return;
      console.warn('Backend unavailable or country not seeded, using local mode', err);
      localMode = true;
    }
  }

  // ---------------- CHECK A GUESS ----------------

  async function submitGuess() {
    if (phase !== 'playing') return;

    const raw = guessEl.value.trim();
    if (!raw) return;

    if (isOnline) {
      submitOnline(raw, false);
      return;
    }

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

  // ---------------- ONLINE: the server decides ----------------

  const inFlight = new Set(); // textos normalizados ya enviados y sin respuesta

  // La región local que corresponde a la respuesta del servidor. region_id solo está
  // en las regiones que loadRegions() pudo casar; si no, se busca por el nombre.
  function regionFromServer(data) {
    if (data.region_id != null) {
      const byId = regions.find((r) => r.region_id === data.region_id);
      if (byId) return byId;
    }
    const key = normalizeSafe(data.name);
    if (!key) return null;
    return regions.find((r) => (r.names || []).some((n) => normalizeSafe(n) === key)) || null;
  }

  // silent = intento automático al teclear: un fallo no molesta con mensajes.
  async function submitOnline(raw, silent) {
    const key = normalizeSafe(raw);
    if (!key || inFlight.has(key)) return;
    inFlight.add(key);
    try {
      const data = await online.guess(raw);
      if (disposed) return;
      // Aunque el tiempo acabe de terminar aquí, un acierto que el servidor ya contó se pinta.
      const stillTyping = guessEl.value.trim() !== raw.trim();

      if (data.result === 'wrong') {
        if (!silent && phase === 'playing') {
          setFeedback(texts.notFoundMessage, 'no');
          guessEl.select();
        }
        return;
      }

      const region = regionFromServer(data);
      if (data.result === 'correct') {
        if (region) addSolved(region, { clear: !stillTyping });
        else setFeedback(texts.correctPrefix + (data.name || ''), 'ok'); // sin hueco en el mapa
        return;
      }

      // 'already': normalmente ya la tengo pintada; si no (p. ej. falló la recuperación), se pinta.
      if (region && !solved.has(region.id)) {
        addSolved(region, { clear: !stillTyping });
      } else if (!silent) {
        setFeedback(texts.alreadyFoundMessage);
        guessEl.select();
      }
    } catch (err) {
      if (disposed) return;
      if (!silent || phase === 'playing') {
        setFeedback(online.errorText ? online.errorText(err) : texts.notFoundMessage, 'no');
      }
    } finally {
      inFlight.delete(key);
    }
  }

  // Fase que pide quien monta el juego. Se aplica en cuanto el mapa está listo.
  let desired = 'waiting';
  let ready = false;

  function applyDesired() {
    if (!isOnline || !ready || disposed) return;
    if (desired === 'playing' && phase === 'idle') {
      phase = 'playing';
      guessEl.disabled = false;
      submitBtn.disabled = false;
      setFeedback('');
      guessEl.focus();
    } else if (desired === 'ended' && phase !== 'ended') {
      phase = 'ended';
      guessEl.disabled = true;
      submitBtn.disabled = true;
      guessEl.blur();
      revealMissingOnMap(); // para que el jugador vea qué se le escapó
      paintRival();
    }
  }

  // ---------------- CONTROLS ----------------

  on(startBtn, 'click', startGame);
  on(submitBtn, 'click', submitGuess);

  on(giveUpBtn, 'click', () => endQuiz('giveup'));

  on(resetBtn, 'click', resetQuiz);
  on(playAgainBtn, 'click', resetQuiz);
  on(viewMapBtn, 'click', closeResult);
  on(viewResultBtn, 'click', () => openResult(solved.size === regions.length, solved.size));

  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && !resultEl.classList.contains('hidden')) closeResult();
  });

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
  // Si ese nombre es el comienzo de otro aún sin acertar ("Mato Grosso" / "Mato Grosso do Sul",
  // "Sudán" / "Sudán del Sur"), se espera un instante por si el jugador sigue escribiendo;
  // con Enter / Check se acepta al momento. La espera es larga si el otro nombre sigue con otra
  // palabra ("Sudán" / "Sudán del Sur") y corta si solo alarga la palabra ("Sur" / "Suroeste").
  let liveTimer = null;
  cleanups.push(() => clearTimeout(liveTimer));

  on(guessEl, 'input', () => {
    clearTimeout(liveTimer);
    if (phase !== 'playing') return;

    const raw = guessEl.value.trim();
    if (!raw) return;

    const region = findExactLocalMatch(regions, raw, solved);
    if (!region || solved.has(region.id)) return;

    // Online solo se usa lo local para saber CUÁNDO preguntar; el acierto lo confirma el servidor.
    const accept = () => (isOnline ? submitOnline(raw, true) : addSolved(region));

    const waitMs = longerCandidateWait(regions, region, raw, solved);
    if (waitMs > 0) {
      liveTimer = setTimeout(() => {
        if (disposed || phase !== 'playing') return;
        if (guessEl.value.trim() !== raw || solved.has(region.id)) return;
        accept();
      }, waitMs);
      return;
    }
    accept();
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
        // Algunos SVG (p. ej. usa.svg) traen style="fill:#f9f9f9;stroke-width:…" en cada forma.
        // Un estilo en línea gana a las reglas de .country, así que el mapa salía blanco y
        // nunca se pintaba de acertado/fallado. El color lo decide siempre el CSS del juego.
        imported.removeAttribute('style');
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

  // Online: casa las regiones con el backend, repinta lo ya acertado (recarga a mitad de
  // partida) y avisa de que se puede jugar.
  async function bootstrapOnline() {
    await loadRegions();
    if (disposed) return;

    try {
      const ids = await online.loadAnswers();
      if (disposed) return;
      (ids || []).forEach((id) => {
        const region = regions.find((r) => r.region_id === id);
        if (region) addSolved(region, { quiet: true });
      });
    } catch (err) {
      console.warn('Could not recover the answers of this match', err);
    }

    loadingOverlay.classList.add('hidden');
    ready = true;
    paintRivalMap(); // los ids del rival pueden haber llegado antes de saber el region_id de cada región
    if (online.onReady) online.onReady();
    applyDesired();
  }

  async function bootstrap() {
    // Recuadros vacíos ya desde el principio (así el mapa se calcula con su tamaño final).
    buildSlots();

    // Estado inicial: nada empieza hasta pulsar «Empezar».
    phase = 'idle';
    guessEl.disabled = true;
    submitBtn.disabled = true;
    giveUpBtn.disabled = true;
    resultEl.classList.add('hidden');
    viewResultBtn.classList.add('hidden');
    hintEl.textContent = texts.hintText;
    loadingText.textContent = texts.loadingMap;

    try {
      // Solo se espera a la geometría SVG (lo único que renderMap necesita).
      // loadRegions() y loadPreviousBest() son llamadas al backend que solo hacen
      // falta al terminar la partida: van en paralelo y no retrasan el mapa.
      await loadGeometry();
      if (disposed) return;

      renderMap();
      mapRendered = true;
      updateCount();

      if (isOnline) {
        await bootstrapOnline();
        return;
      }

      loadingOverlay.classList.add('hidden');
      showIntro();

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
    // Solo online: 'waiting' (cuenta atrás) | 'playing' | 'ended'.
    setPhase(next) {
      desired = next;
      applyDesired();
    },
    // Solo online, con la partida terminada: ids (region_id) que acertó el rival.
    showRivalAnswers(ids) {
      rivalSet = new Set(ids || []);
      if (phase === 'ended') revealMissingOnMap(); // recoloca "fallada" -> "del rival"
      paintRival();
      rivalLiveSet = new Set(ids || []); // y el mapa del rival queda con la lista completa
      paintRivalMap();
    },
    // Solo online, con la partida en marcha: ids (region_id) que el rival lleva acertados.
    // Solo pinta SU mapa (el de al lado); el mío no se toca hasta el final.
    showRivalLive(ids) {
      rivalLiveSet = new Set(ids || []);
      paintRivalMap();
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(resultRaf);
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
      const rivalGroup = rivalSvgEl && rivalSvgEl.querySelector('.regions');
      if (rivalGroup) rivalGroup.replaceChildren();
    },
  };
}
