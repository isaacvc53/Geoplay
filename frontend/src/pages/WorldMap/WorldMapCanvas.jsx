import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as d3 from 'd3';
import { countrySlug } from '../../lib/worldMapSlugs';
import { findAvailableCountries } from '../../lib/availability';

// Mapa mundial a partir de worldUltra.svg (paths ya proyectados, sin d3.geo por país)
// con D3 para zoom/paneo (imperativo, NO en JSX): se monta UNA vez dentro de un
// useEffect y se limpia al desmontar (StrictMode monta/desmonta dos veces en dev).
// El SVG está en proyección Equal Earth (meridiano central ~12,65°E); su descripción
// viaja en `projection` dentro de world-map.json, y con ella se dibujan con d3 el
// contorno de la esfera y la cuadrícula (solo 2 paths) como en el atlas original.
// Conserva las optimizaciones del original: capa GPU (will-change), throttling
// del zoom con requestAnimationFrame, path.digits(1), non-scaling-stroke y
// contain (estos dos últimos, en el CSS). Los datos vienen de
// /data/world-map.json (ver scripts/build-world-map.py).
//
// Props:
//   selected        país actualmente abierto en el panel (para pintarlo "active")
//   onSelect(f)     se llama al hacer clic en un país disponible; f = { id, properties:{name,slug}, d, main? }
//   ref             { zoomIn(), zoomOut(), reset() }

// Proyecciones que puede declarar world-map.json en `projection.type`.
const PROJECTIONS = { equalEarth: d3.geoEqualEarth, naturalEarth1: d3.geoNaturalEarth1 };

// El mapa está muy detallado (islas y microestados), así que se permite más zoom que
// en el mapa antiguo (8x) para poder acertar Malta, Singapur, etc.
const MAX_ZOOM = 20;

// En pantallas altas y estrechas (móvil en vertical) el mapa entero cabe en una franja
// de ~180 px. La vista inicial hace zoom hasta llenar el alto disponible (centrada en
// Europa/África) y se puede seguir alejando hasta ver el mundo entero (zoom 1).
const MAX_HOME_ZOOM = 4;
// Tiempo tras el último gesto antes de soltar la capa GPU y repintar nítido.
const GESTURE_IDLE_MS = 140;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function WorldMapCanvas({ selected, onSelect, ref }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const toastRef = useRef(null);
  const zoomApiRef = useRef(null);
  const countryPathsRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomApiRef.current?.zoomIn(),
    zoomOut: () => zoomApiRef.current?.zoomOut(),
    reset: () => zoomApiRef.current?.reset(),
  }), []);

  // Resalta el país abierto en el panel.
  useEffect(() => {
    countryPathsRef.current?.classed('active', (d) => d === selected);
  }, [selected]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const tooltip = tooltipRef.current;
    const toast = toastRef.current;
    const stage = wrap.closest('.stage');
    const headerEl = stage?.querySelector('header');
    const controlsEl = stage?.querySelector('.zoom-controls');
    const svg = d3.select(svgRef.current);
    const touchOnly = window.matchMedia('(hover: none)');
    let cancelled = false;
    let rafId = 0;
    let idleTimer = 0;
    let toastTimer = 0;

    // Tamaño del mapa en coordenadas del SVG; se fija al cargar los datos.
    let mapW = 0;
    let mapH = 0;
    let viewScale = 1;          // px de pantalla por unidad de SVG a zoom 1
    let currentK = 1;           // zoom actual
    let home = d3.zoomIdentity; // vista inicial (la de "reset")
    let userMoved = false;      // si el usuario ya movió el mapa, un resize no lo recoloca
    let lastLandscape = null;

    const g = svg.append('g');
    // OJO: NO se deja `will-change: transform` fijo. Con él el navegador rasteriza el
    // grupo una vez y al hacer zoom solo escala ese bitmap: el mapa se veía borroso.
    // Ahora la capa GPU se pide solo mientras dura el gesto (start) y se suelta al
    // terminar (end), lo que obliga a repintar los vectores nítidos a la escala final.

    const defs = svg.append('defs');

    const grad = defs.append('radialGradient')
      .attr('id', 'oceanGlow').attr('cx', '30%').attr('cy', '25%').attr('r', '85%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#16405f');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#0e2233');

    // Rayado diagonal para países deshabilitados. Los colores salen de las
    // variables CSS --land-disabled / --land-disabled-line de la página.
    const rootStyles = getComputedStyle(wrap.closest('.worldmap-page') || document.documentElement);
    const disabledFill = rootStyles.getPropertyValue('--land-disabled').trim() || '#6d6555';
    const disabledLine = rootStyles.getPropertyValue('--land-disabled-line').trim() || '#443f34';

    const hatch = defs.append('pattern')
      .attr('id', 'disabledHatch')
      .attr('width', 6).attr('height', 6)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)');
    const hatchRect = hatch.append('rect').attr('width', 6).attr('height', 6).attr('fill', disabledFill);
    const hatchLine = hatch.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6)
      .attr('stroke', disabledLine).attr('stroke-width', 2);
    // El rayado se mide en unidades del SVG: en resize() se reescala con la escala
    // real de pantalla para que sean ~6 px a zoom 1, como en el atlas original.
    function setHatchScale(k) {
      hatch.attr('width', 6 * k).attr('height', 6 * k);
      hatchRect.attr('width', 6 * k).attr('height', 6 * k);
      hatchLine.attr('y2', 6 * k).attr('stroke-width', 2 * k);
    }

    // Esfera (contorno de la proyección, con el degradado de océano) y cuadrícula,
    // dentro de `g`: hacen zoom y paneo junto con los países.
    const ocean = g.append('path').attr('class', 'sphere');
    const graticuleG = g.append('path').attr('class', 'graticule');
    const countriesG = g.append('g').attr('class', 'countries-group');

    // El evento 'zoom' llega más rápido de lo que la pantalla repinta:
    // se aplica una sola vez por frame, con la transformación más reciente.
    let pendingTransform = null;
    let rafScheduled = false;
    function flushTransform() {
      // Como atributo SVG (no CSS style): mismo origen que usa d3-zoom.
      if (pendingTransform) g.attr('transform', pendingTransform);
      rafScheduled = false;
    }

    const zoom = d3.zoom()
      .scaleExtent([1, MAX_ZOOM])
      // Un toque en pantalla táctil nunca es tan quieto como un clic de ratón.
      .clickDistance(12)
      .on('start', () => {
        clearTimeout(idleTimer);
        g.style('will-change', 'transform');
      })
      .on('zoom', (event) => {
        if (event.sourceEvent) userMoved = true; // gesto real (no una llamada del código)
        currentK = event.transform.k;
        pendingTransform = event.transform;
        if (!rafScheduled) { rafScheduled = true; rafId = requestAnimationFrame(flushTransform); }
      })
      .on('end', () => {
        if (pendingTransform) flushTransform();
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          g.style('will-change', null);
          // El rayado mide ~6 px en pantalla sea cual sea el zoom.
          setHatchScale(1 / (viewScale * currentK));
        }, GESTURE_IDLE_MS);
      });
    svg.call(zoom);
    svg.on('mousedown.cursor', () => svg.classed('grabbing', true));
    svg.on('mouseup.cursor', () => svg.classed('grabbing', false));

    zoomApiRef.current = {
      zoomIn: () => { userMoved = true; svg.transition().duration(300).call(zoom.scaleBy, 1.5); },
      zoomOut: () => { userMoved = true; svg.transition().duration(300).call(zoom.scaleBy, 0.67); },
      reset: () => { userMoved = false; svg.transition().duration(400).call(zoom.transform, home); },
    };

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

    // Vista inicial: escala respecto al centro del mapa (que es el centro de la zona
    // libre entre cabecera y controles) y ajustada a los límites de paneo.
    function computeHome(vbX, vbY, vbW, vbH, availH) {
      const fit = availH / (mapH * viewScale);
      const k = fit > 1.15 ? Math.min(MAX_HOME_ZOOM, fit) : 1;
      if (k === 1) return d3.zoomIdentity;
      const tx = clamp((1 - k) * (mapW / 2), (vbX + vbW) * (1 - k), vbX * (1 - k));
      const ty = clamp((1 - k) * (mapH / 2), (vbY + vbH) * (1 - k), vbY * (1 - k));
      return d3.zoomIdentity.translate(tx, ty).scale(k);
    }

    // Encaja el mapa en el visor (deja hueco arriba para la cabecera y abajo
    // para los controles, medidos de verdad: en móvil la cabecera es más baja y los
    // botones más grandes) y recalcula los límites de zoom/paneo.
    function resize() {
      if (!mapW) return;
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      if (!W || !H) return;
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
      const vbX = -(vbW - mapW) / 2;
      const vbY = -(padTop / s) - (availH / s - mapH) / 2;
      svg.attr('viewBox', [vbX, vbY, vbW, vbH]).attr('preserveAspectRatio', 'xMidYMid meet');
      // Sin zoom (scale=1) el mapa queda bloqueado: translateExtent = viewBox.
      const extent = [[vbX, vbY], [vbX + vbW, vbY + vbH]];
      zoom.extent(extent).translateExtent(extent);

      home = computeHome(vbX, vbY, vbW, vbH, availH);
      const landscape = W > H;
      // Si el usuario no ha tocado el mapa (o giró el móvil) se recoloca la vista inicial.
      if (!userMoved || landscape !== lastLandscape) {
        userMoved = false;
        lastLandscape = landscape;
        svg.interrupt();
        svg.call(zoom.transform, home);
      } else {
        setHatchScale(1 / (s * currentK));
      }
    }
    // ResizeObserver (no window.resize): también reacciona a la barra del navegador
    // móvil, al giro de pantalla y a que la cabecera cambie de alto al cargar la fuente.
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    if (headerEl) resizeObserver.observe(headerEl);

    fetch('/data/world-map.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((worldData) => {
        if (cancelled) return;
        mapW = worldData.width;
        mapH = worldData.height;
        // Esfera + cuadrícula a partir de la proyección del SVG (ver build-world-map.py).
        const proj = worldData.projection;
        const makeProjection = PROJECTIONS[proj?.type];
        if (makeProjection) {
          const projection = makeProjection()
            .rotate([-proj.rotate, 0])
            .scale(proj.scale)
            .translate(proj.translate);
          const geoPath = d3.geoPath(projection).digits(1);
          ocean.attr('d', geoPath({ type: 'Sphere' }));
          graticuleG.attr('d', geoPath(d3.geoGraticule10()));
        } else {
          console.warn('world-map.json sin `projection` válida: se dibuja el mapa sin esfera ni cuadrícula.');
        }
        const features = worldData.countries.map((c) => ({
          id: c.id,
          properties: { name: c.name, slug: c.slug },
          d: c.d,
          main: c.main,
        }));


        // availableSlugs === null significa "aún sin comprobar": mientras tanto
        // todos cuentan como disponibles, así el mapa es interactivo en cuanto
        // se parsea la geometría. La comprobación va después, en segundo plano.
        let availableSlugs = null;

        function isUnavailable(f) {
          if (availableSlugs === null) return false;
          return !availableSlugs.has(countrySlug(f));
        }

        const countryPaths = countriesG.selectAll('path')
          .data(features)
          .join('path')
          .attr('class', 'country')
          .classed('disabled', isUnavailable)
          .attr('d', (d) => d.d)
          .on('mouseenter', (event, d) => {
            const name = d.properties.name || 'Country';
            const isDisabled = isUnavailable(d);
            tooltip.replaceChildren();
            const nameEl = document.createElement('span');
            nameEl.className = 'tooltip-name';
            nameEl.textContent = name;
            tooltip.appendChild(nameEl);
            if (isDisabled) {
              const noteEl = document.createElement('span');
              noteEl.className = 'tooltip-note';
              noteEl.textContent = 'Not available';
              tooltip.appendChild(noteEl);
            }
            tooltip.classList.toggle('is-disabled', isDisabled);
            tooltip.classList.add('show');
          })
          .on('mousemove', (event) => {
            tooltip.style.left = event.clientX + 'px';
            tooltip.style.top = event.clientY + 'px';
          })
          .on('mouseleave', () => tooltip.classList.remove('show'))
          .on('click', (event, d) => {
            if (isUnavailable(d)) {
              if (touchOnly.matches) showToast(d.properties.name || 'Country');
              return;
            }
            onSelectRef.current?.(d);
          });
        countryPathsRef.current = countryPaths;

        setStatus('ready');
        resize();

        // Comprobación de disponibilidad en segundo plano; luego se repintan
        // (rayado) los países sin archivos.
        const allSlugs = features.map(countrySlug).filter(Boolean);
        findAvailableCountries(allSlugs)
          .then((slugs) => {
            if (cancelled) return;
            availableSlugs = slugs;
            countryPaths.classed('disabled', isUnavailable);
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
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
      clearTimeout(toastTimer);
      resizeObserver.disconnect();
      svg.on('.zoom', null).on('.cursor', null);
      svg.interrupt();
      svg.selectAll('*').remove();
      countryPathsRef.current = null;
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
        <svg id="worldmap" ref={svgRef} />
      </div>
      <div className="tooltip" ref={tooltipRef} aria-hidden="true" />
      <div className="map-toast" ref={toastRef} role="status" aria-live="polite" />
    </>
  );
}
