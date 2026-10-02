import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as d3 from 'd3';
import { countrySlug } from '../../lib/worldMapSlugs';
import { findAvailableCountries } from '../../lib/availability';

// Mapa mundial dibujado en <canvas> (no en SVG) con D3 solo para zoom/paneo. Se monta UNA vez dentro de un useEffect y se
// limpia al desmontar (StrictMode monta/desmonta dos veces en dev).
//
// Por qué canvas: con SVG el navegador rasteriza el grupo y, durante un gesto de zoom,
// solo escala ese bitmap (el mapa se veía borroso hasta soltar). Aquí cada fotograma se
// vuelve a dibujar en vectores a la resolución REAL de la pantalla, así que el mapa
// está nítido al hacer zoom, al alejar y al moverlo.
//
// Rendimiento (importante en ordenador, donde el canvas es mucho más grande que en móvil):
//  - Todos los países comparten estilo: se unen en UN solo Path2D (fill + stroke).
//  - El hover (isPointInPath sobre paths enormes) NO se calcula mientras haces zoom o
//    arrastras, y se limita a ~20 veces por segundo; se recalcula al soltar.
//  - Resolución del canvas limitada por número de píxeles.
//
// Estilo plano, igual que el resto de mapas de la web: tierra de un solo color sobre el
// fondo de la página, sin océano pintado, cuadrícula, halos ni brillos.
//
// Props:
//   selected        país actualmente abierto en el panel (para pintarlo "active")
//   onSelect(f)     se llama al hacer clic en un país disponible; f = { id, properties:{name,slug}, d, main? }
//   ref             { zoomIn(), zoomOut(), reset() }

// El mapa está muy detallado (islas y microestados): se permite bastante zoom.
const MAX_ZOOM = 20;

// En pantallas altas y estrechas (móvil en vertical) el mapa entero cabe en una franja
// de ~180 px. La vista inicial hace zoom hasta llenar el alto disponible y se puede
// seguir alejando hasta ver el mundo entero (zoom 1).
const MAX_HOME_ZOOM = 4;

// Tope de píxeles del canvas: un monitor grande o un portátil retina llenan mucho más
// que un móvil, y redibujar millones de píxeles por fotograma es lo que hace ir lento.
// 4 M deja el móvil a resolución completa y un 1080p a 1x; pantallas mayores bajan un poco.
const MAX_CANVAS_PIXELS = 4e6;
// Duración del fundido del resalte (hover / país abierto).
const FADE_MS = 140;
// Mínimo entre dos cálculos de hover (ms).
const PICK_MIN_MS = 50;
// Tolerancia (px de pantalla) para acertar países diminutos (Malta, Singapur...).
const PICK_TOLERANCE_MOUSE = 8;
const PICK_TOLERANCE_TOUCH = 14;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function WorldMapCanvas({ selected, onSelect, ref }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const toastRef = useRef(null);
  const zoomApiRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const setSelectedRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomApiRef.current?.zoomIn(),
    zoomOut: () => zoomApiRef.current?.zoomOut(),
    reset: () => zoomApiRef.current?.reset(),
  }), []);

  // Resalta el país abierto en el panel (relleno + anillo).
  useEffect(() => {
    selectedRef.current = selected;
    setSelectedRef.current?.(selected);
  }, [selected]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    const toast = toastRef.current;
    const stage = wrap.closest('.stage');
    const headerEl = stage?.querySelector('header');
    const controlsEl = stage?.querySelector('.zoom-controls');
    const ctx = canvas.getContext('2d');
    // Contexto auxiliar solo para isPointInPath / isPointInStroke (hit-test en coords del mapa).
    const hitCtx = document.createElement('canvas').getContext('2d');
    const sel = d3.select(canvas);
    const touchOnly = window.matchMedia('(hover: none)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Colores del tema (variables CSS de la página).
    const rootStyles = getComputedStyle(wrap.closest('.worldmap-page') || document.documentElement);
    const cssVar = (name, fallback) => rootStyles.getPropertyValue(name).trim() || fallback;
    const LAND = cssVar('--land', '#2d5877');
    const LAND_HOVER = cssVar('--land-hover', '#3b6d90');
    const LAND_ACTIVE = cssVar('--land-active', '#c9a24b');
    const LAND_LINE = cssVar('--land-line', '#0b1a28');
    const OUTLINE = cssVar('--land-outline', '#f6f1e4');

    let cancelled = false;
    let frameId = 0;
    let toastTimer = 0;
    let gestureTimer = 0;
    let lastT = 0;
    let lastPickT = 0;
    let needPick = false;
    let pressed = false;
    let gesturing = false; // zoom/paneo en curso: no se calcula el hover

    // Geometría del visor y del mapa.
    let W = 0;
    let H = 0;
    let dpr = 1;
    let mapW = 0;
    let mapH = 0;
    let viewScale = 1;   // px de pantalla por unidad del mapa a zoom 1
    let vbX = 0;         // origen (en unidades del mapa) de la esquina superior izquierda del visor
    let vbY = 0;
    let view = d3.zoomIdentity; // zoom/paneo actual, en px de pantalla
    let home = d3.zoomIdentity; // vista inicial (la de "reset")
    let userMoved = false;      // si el usuario ya movió el mapa, un resize no lo recoloca
    let lastLandscape = null;

    // Datos dibujables (se rellenan al cargar world-map.json).
    let features = [];
    let allLand = null;
    let availableSlugs = null; // null = "aún sin comprobar": todos cuentan como disponibles

    let pointer = null; // posición del ratón relativa al canvas
    let hovered = null;
    const hoverFx = { f: null, a: 0, to: 0 };
    const activeFx = { f: null, a: 0, to: 0 };

    function isUnavailable(f) {
      if (availableSlugs === null) return false;
      return !availableSlugs.has(countrySlug(f));
    }

    // ---------- Dibujo ----------
    function drawLand(u) {
      ctx.fillStyle = LAND;
      ctx.fill(allLand);
      ctx.strokeStyle = LAND_LINE;
      ctx.lineWidth = 0.6 * u;
      ctx.stroke(allLand);

      // Relleno de resalte (hover y país abierto) con fundido.
      if (hoverFx.f && hoverFx.a > 0 && !isUnavailable(hoverFx.f)) {
        ctx.globalAlpha = hoverFx.a;
        ctx.fillStyle = LAND_HOVER;
        ctx.fill(hoverFx.f.path);
        ctx.globalAlpha = 1;
        ctx.stroke(hoverFx.f.path);
      }
      if (activeFx.f && activeFx.a > 0) {
        ctx.globalAlpha = activeFx.a;
        ctx.fillStyle = LAND_ACTIVE;
        ctx.fill(activeFx.f.path);
        ctx.globalAlpha = 1;
        ctx.stroke(activeFx.f.path);
      }

      // Contorno fino, de grosor constante en pantalla: ayuda a localizar países diminutos.
      function outline(fx) {
        if (!fx.f || fx.a <= 0) return;
        ctx.globalAlpha = fx.a;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.4 * u;
        ctx.stroke(fx.f.path);
        ctx.globalAlpha = 1;
      }
      // En táctil el "hover" se queda pegado tras tocar; y los países sin datos no se resaltan.
      if (!touchOnly.matches && hoverFx.f && !isUnavailable(hoverFx.f)) outline(hoverFx);
      outline(activeFx);
    }

    function draw() {
      if (!W || !H || !allLand) return;
      const k = view.k * viewScale; // px de pantalla por unidad del mapa
      const u = 1 / k;              // unidades del mapa por px de pantalla
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // pantalla = k·(p − vb) + t, a resolución real (× dpr).
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (view.x - k * vbX), dpr * (view.y - k * vbY));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawLand(u);
    }

    // ---------- Bucle de fotogramas ----------
    function stepFx(now) {
      const dt = lastT ? Math.min(50, now - lastT) : 16;
      lastT = now;
      let moving = false;
      [hoverFx, activeFx].forEach((fx) => {
        if (fx.a === fx.to) return;
        if (reduceMotion) fx.a = fx.to;
        else fx.a = clamp(fx.a + Math.sign(fx.to - fx.a) * (dt / FADE_MS), 0, 1);
        if (fx.a === fx.to) {
          if (fx.to === 0 && fx !== hoverFx) fx.f = null;
        } else {
          moving = true;
        }
      });
      if (!moving) lastT = 0;
      return moving;
    }

    function frame(now) {
      frameId = 0;
      if (cancelled) return;
      let again = false;
      if (needPick) {
        // El hover es lo más caro: nunca durante un gesto, y con un mínimo entre cálculos.
        if (!gesturing && now - lastPickT >= PICK_MIN_MS) {
          needPick = false;
          lastPickT = now;
          updateHover();
        } else if (!gesturing) {
          again = true;
        }
      }
      const animating = stepFx(now);
      draw();
      if (animating || again) schedule();
    }

    function schedule() {
      if (!frameId && !cancelled) frameId = requestAnimationFrame(frame);
    }

    // ---------- Hit-test ----------
    // Coordenadas de pantalla (relativas al canvas) → país bajo el cursor.
    function pick(x, y) {
      if (!features.length) return null;
      const k = view.k * viewScale;
      const px = (x - view.x) / k + vbX;
      const py = (y - view.y) / k + vbY;
      for (let i = features.length - 1; i >= 0; i -= 1) {
        const f = features[i];
        const b = f.bb;
        if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) continue;
        if (hitCtx.isPointInPath(f.path, px, py)) return f;
      }
      // Sin acierto exacto: se admite un margen para países diminutos (que a este zoom
      // miden unos pocos píxeles), pensado sobre todo para el dedo.
      const tol = touchOnly.matches ? PICK_TOLERANCE_TOUCH : PICK_TOLERANCE_MOUSE;
      const pad = tol / k;
      hitCtx.lineWidth = pad * 2;
      let best = null;
      let bestArea = Infinity;
      features.forEach((f) => {
        const b = f.bb;
        if (b.w * k > tol * 2.5 || b.h * k > tol * 2.5) return; // solo los diminutos
        if (px < b.x - pad || px > b.x + b.w + pad || py < b.y - pad || py > b.y + b.h + pad) return;
        const area = b.w * b.h;
        if (area < bestArea && hitCtx.isPointInStroke(f.path, px, py)) { best = f; bestArea = area; }
      });
      return best;
    }

    function showTooltip(d) {
      const name = d.properties.name || 'Country';
      const isDisabled = isUnavailable(d);
      tooltip.replaceChildren();
      // Bandera pequeña (flagcdn, la misma que usa el panel); si falla se quita.
      if (/^[A-Z]{2}$/.test(d.id || '')) {
        const flag = document.createElement('img');
        flag.className = 'tooltip-flag';
        flag.alt = '';
        flag.src = `https://flagcdn.com/w40/${d.id.toLowerCase()}.png`;
        flag.addEventListener('error', () => flag.remove());
        tooltip.appendChild(flag);
      }
      const textEl = document.createElement('span');
      textEl.className = 'tooltip-text';
      const nameEl = document.createElement('span');
      nameEl.className = 'tooltip-name';
      nameEl.textContent = name;
      textEl.appendChild(nameEl);
      if (isDisabled) {
        const noteEl = document.createElement('span');
        noteEl.className = 'tooltip-note';
        noteEl.textContent = 'Not available';
        textEl.appendChild(noteEl);
      }
      tooltip.appendChild(textEl);
      tooltip.classList.toggle('is-disabled', isDisabled);
      tooltip.classList.add('show');
    }

    function updateHover() {
      const f = pointer && !pressed ? pick(pointer.x, pointer.y) : null;
      if (f === hovered) return;
      hovered = f;
      if (f) {
        showTooltip(f);
        hoverFx.f = f;
        hoverFx.to = 1;
        if (reduceMotion) hoverFx.a = 1;
        canvas.style.cursor = isUnavailable(f) ? 'not-allowed' : 'pointer';
      } else {
        tooltip.classList.remove('show');
        hoverFx.to = 0;
        if (reduceMotion) hoverFx.a = 0;
        canvas.style.cursor = '';
      }
    }

    // ---------- Zoom / paneo ----------
    function endGesture() {
      gesturing = false;
      if (pointer) { needPick = true; schedule(); }
    }
    const zoom = d3.zoom()
      .scaleExtent([1, MAX_ZOOM])
      // Un toque en pantalla táctil nunca es tan quieto como un clic de ratón.
      .clickDistance(12)
      .on('zoom', (event) => {
        if (event.sourceEvent) userMoved = true; // gesto real (no una llamada del código)
        view = event.transform;
        // Mientras se mueve/zoomea no se calcula el hover; se recalcula al parar.
        gesturing = true;
        clearTimeout(gestureTimer);
        gestureTimer = setTimeout(endGesture, 90);
        schedule();
      });
    sel.call(zoom);

    zoomApiRef.current = {
      zoomIn: () => { userMoved = true; sel.transition().duration(300).call(zoom.scaleBy, 1.5); },
      zoomOut: () => { userMoved = true; sel.transition().duration(300).call(zoom.scaleBy, 0.67); },
      reset: () => { userMoved = false; sel.transition().duration(400).call(zoom.transform, home); },
    };

    // ---------- Eventos del canvas ----------
    function onPointerMove(e) {
      if (e.pointerType === 'touch') return;
      const r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      tooltip.style.left = e.clientX + 'px';
      tooltip.style.top = e.clientY + 'px';
      needPick = true;
      schedule();
    }
    function onPointerLeave() {
      pointer = null;
      needPick = true;
      schedule();
    }
    function onMouseDown(e) {
      if (e.button !== 0) return;
      pressed = true;
      canvas.classList.add('grabbing');
      needPick = true; // al agarrar el mapa se quita el resalte
      schedule();
    }
    function onMouseUp() {
      if (!pressed) return;
      pressed = false;
      canvas.classList.remove('grabbing');
      needPick = true;
      schedule();
    }

    // Toque en un país no disponible: en pantallas táctiles no hay tooltip, así que
    // se avisa con un mensaje breve para que no parezca que la app no responde.
    function showToast(name) {
      toast.replaceChildren();
      const nameEl = document.createElement('span');
      nameEl.className = 'toast-name';
      nameEl.textContent = name;
      const noteEl = document.createElement('span');
      noteEl.className = 'toast-note';
      noteEl.textContent = 'Not available yet';
      toast.append(nameEl, noteEl);
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    function onClick(e) {
      const r = canvas.getBoundingClientRect();
      const f = pick(e.clientX - r.left, e.clientY - r.top);
      if (!f) return;
      if (isUnavailable(f)) {
        if (touchOnly.matches) showToast(f.properties.name || 'Country');
        return;
      }
      onSelectRef.current?.(f);
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('click', onClick);
    window.addEventListener('mouseup', onMouseUp);

    setSelectedRef.current = (f) => {
      if (f) {
        activeFx.f = f;
        activeFx.to = 1;
        if (reduceMotion) activeFx.a = 1;
      } else {
        activeFx.to = 0;
        if (reduceMotion) { activeFx.a = 0; activeFx.f = null; }
      }
      schedule();
    };

    // ---------- Encaje en el visor ----------
    // Vista inicial: escala respecto al centro del mapa (que es el centro de la zona
    // libre entre cabecera y controles) y ajustada a los límites de paneo.
    function computeHome(availH) {
      const fit = availH / (mapH * viewScale);
      const k = fit > 1.15 ? Math.min(MAX_HOME_ZOOM, fit) : 1;
      if (k === 1) return d3.zoomIdentity;
      const cx = (mapW / 2 - vbX) * viewScale;
      const cy = (mapH / 2 - vbY) * viewScale;
      const tx = clamp(cx * (1 - k), W * (1 - k), 0);
      const ty = clamp(cy * (1 - k), H * (1 - k), 0);
      return d3.zoomIdentity.translate(tx, ty).scale(k);
    }

    // Encaja el mapa en el visor (deja hueco arriba para la cabecera y abajo para los
    // controles, medidos de verdad: en móvil la cabecera es más baja y los botones más
    // grandes), reajusta el tamaño del canvas a la pantalla real y recalcula los límites.
    function resize() {
      if (!mapW) return;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;

      // Punto del mapa que estaba en el centro del visor (para conservar la vista).
      let anchor = null;
      if (W && viewScale) {
        const kOld = view.k * viewScale;
        anchor = [(W / 2 - view.x) / kOld + vbX, (H / 2 - view.y) / kOld + vbY];
      }

      W = w;
      H = h;
      dpr = clamp(Math.min(window.devicePixelRatio || 1, Math.sqrt(MAX_CANVAS_PIXELS / (w * h))), 1, 3);
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;

      const wrapRect = wrap.getBoundingClientRect();
      const padTop = clamp(
        headerEl ? headerEl.getBoundingClientRect().bottom - wrapRect.top + 10 : Math.min(168, H * 0.21),
        48, H * 0.4
      );
      const padBottom = clamp(
        controlsEl ? wrapRect.bottom - controlsEl.getBoundingClientRect().top + 12 : 72,
        40, H * 0.25
      );
      const padX = Math.min(48, W * 0.03);
      const availH = H - padTop - padBottom;
      const s = Math.min((W - padX * 2) / mapW, availH / mapH);
      viewScale = s;
      const vbW = W / s;
      const vbH = H / s;
      vbX = -(vbW - mapW) / 2;
      vbY = -(padTop / s) - (availH / s - mapH) / 2;

      // Sin zoom (k=1) el mapa queda bloqueado: translateExtent = visor.
      const extent = [[0, 0], [W, H]];
      zoom.extent(extent).translateExtent(extent);

      home = computeHome(availH);
      const landscape = W > H;
      // Si el usuario no ha tocado el mapa (o giró el móvil) se recoloca la vista inicial.
      if (!userMoved || landscape !== lastLandscape || !anchor) {
        userMoved = false;
        lastLandscape = landscape;
        sel.interrupt();
        sel.call(zoom.transform, home);
      } else {
        const kNew = view.k * s;
        const t = d3.zoomIdentity
          .translate(W / 2 - kNew * (anchor[0] - vbX), H / 2 - kNew * (anchor[1] - vbY))
          .scale(view.k);
        sel.call(zoom.transform, zoom.constrain()(t, extent, extent));
      }
      schedule();
    }
    // ResizeObserver (no solo window.resize): también reacciona a la barra del navegador
    // móvil, al giro de pantalla y a que la cabecera cambie de alto al cargar la fuente.
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    if (headerEl) resizeObserver.observe(headerEl);
    // El zoom del navegador cambia devicePixelRatio sin cambiar siempre el tamaño CSS.
    window.addEventListener('resize', resize);

    // ---------- Carga de datos ----------
    canvas.classList.remove('ready');
    fetch('/data/world-map.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((worldData) => {
        if (cancelled) return;
        mapW = worldData.width;
        mapH = worldData.height;

        features = worldData.countries.map((c) => ({
          id: c.id,
          properties: { name: c.name, slug: c.slug },
          d: c.d,
          main: c.main,
          path: new Path2D(c.d),
        }));
        allLand = new Path2D();
        features.forEach((f) => allLand.addPath(f.path));

        // Caja envolvente de cada país (prefiltro del hit-test), medida con un path
        // temporal fuera de pantalla.
        const NS = 'http://www.w3.org/2000/svg';
        const probeSvg = document.createElementNS(NS, 'svg');
        probeSvg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
        const probe = document.createElementNS(NS, 'path');
        probeSvg.appendChild(probe);
        wrap.appendChild(probeSvg);
        features.forEach((f) => {
          probe.setAttribute('d', f.d);
          const b = probe.getBBox();
          f.bb = { x: b.x, y: b.y, w: b.width, h: b.height };
        });
        probeSvg.remove();

        // Por si el país ya estaba abierto cuando terminó de cargar.
        if (selectedRef.current) {
          const match = features.find((f) => f.id === selectedRef.current.id);
          if (match) setSelectedRef.current?.(match);
        }

        canvas.classList.add('ready');
        setStatus('ready');
        resize();

        // Comprobación de disponibilidad en segundo plano; luego se actualiza el cursor
        // y el aviso de los países sin archivos.
        const allSlugs = features.map(countrySlug).filter(Boolean);
        findAvailableCountries(allSlugs)
          .then((slugs) => {
            if (cancelled) return;
            availableSlugs = slugs;
            hovered = null; // fuerza a recalcular cursor/tooltip
            needPick = true;
            schedule();
          })
          .catch((err) => {
            console.warn('Could not check country availability; leaving all countries enabled.', err);
          });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(toastTimer);
      clearTimeout(gestureTimer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('click', onClick);
      sel.on('.zoom', null);
      sel.interrupt();
      tooltip.classList.remove('show');
      setSelectedRef.current = null;
      zoomApiRef.current = null;
    };
  }, []);

  return (
    <>
      <div id="map-wrap" ref={wrapRef}>
        {status !== 'ready' && (
          <div className="loading" id="loading">
            {status === 'error' ? 'could not load the map data.' : 'loading world borders…'}
          </div>
        )}
        <canvas id="worldmap" ref={canvasRef} role="img" aria-label="World map. Drag to pan, scroll to zoom, select a country." />
      </div>
      <div className="tooltip" ref={tooltipRef} aria-hidden="true" />
      <div className="map-toast" ref={toastRef} role="status" aria-live="polite" />
    </>
  );
}
