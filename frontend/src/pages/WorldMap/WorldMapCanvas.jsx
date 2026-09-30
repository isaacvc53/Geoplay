import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as d3 from 'd3';
import { countrySlug } from '../../lib/worldMapSlugs';
import { findAvailableCountries } from '../../lib/availability';

// Mapa mundial a partir de world.svg (paths ya proyectados, sin d3.geo) con D3
// para zoom/paneo (imperativo, NO en JSX): se monta UNA vez dentro de un
// useEffect y se limpia al desmontar (StrictMode monta/desmonta dos veces en dev).
// Conserva las optimizaciones del original: capa GPU (will-change), throttling
// del zoom con requestAnimationFrame, path.digits(1), non-scaling-stroke y
// contain (estos dos últimos, en el CSS). Los datos vienen de
// /data/world-map.json (ver scripts/build-world-map.py).
//
// Props:
//   selected        país actualmente abierto en el panel (para pintarlo "active")
//   onSelect(f)     se llama al hacer clic en un país disponible; f = { id, properties:{name,slug}, d, main? }
//   ref             { zoomIn(), zoomOut(), reset() }
export default function WorldMapCanvas({ selected, onSelect, ref }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
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
    const svg = d3.select(svgRef.current);
    let cancelled = false;
    let rafId = 0;

    // Tamaño del mapa en coordenadas del SVG; se fija al cargar los datos.
    let mapW = 0;
    let mapH = 0;

    const g = svg.append('g');
    // Capa de composición propia desde el principio (evita repintar en CPU
    // los ~241 países en cada frame de zoom/paneo).
    g.style('will-change', 'transform');

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
    hatch.append('rect').attr('width', 6).attr('height', 6).attr('fill', disabledFill);
    hatch.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6)
      .attr('stroke', disabledLine).attr('stroke-width', 2);

    // Panel de océano (degradado + cuadrícula) dentro de `g`: hace zoom y
    // paneo junto con los países, como antes la esfera.
    const clip = defs.append('clipPath').attr('id', 'oceanClip');
    const clipRect = clip.append('rect');
    const ocean = g.append('rect').attr('class', 'sphere');
    const graticuleG = g.append('path').attr('class', 'graticule')
      .attr('clip-path', 'url(#oceanClip)');
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
      .scaleExtent([1, 8])
      // Un toque en pantalla táctil nunca es tan quieto como un clic de ratón.
      .clickDistance(12)
      .on('zoom', (event) => {
        pendingTransform = event.transform;
        if (!rafScheduled) { rafScheduled = true; rafId = requestAnimationFrame(flushTransform); }
      });
    svg.call(zoom);
    svg.on('mousedown.cursor', () => svg.classed('grabbing', true));
    svg.on('mouseup.cursor', () => svg.classed('grabbing', false));

    zoomApiRef.current = {
      zoomIn: () => svg.transition().duration(300).call(zoom.scaleBy, 1.5),
      zoomOut: () => svg.transition().duration(300).call(zoom.scaleBy, 0.67),
      reset: () => svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity),
    };

    // Encaja el mapa en el visor (deja hueco arriba para la cabecera y abajo
    // para los controles) y recalcula los límites de zoom/paneo.
    function resize() {
      if (!mapW) return;
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      const padTop = Math.min(168, H * 0.21);
      const padBottom = 72;
      const padX = Math.min(48, W * 0.03);
      const s = Math.min((W - padX * 2) / mapW, (H - padTop - padBottom) / mapH);
      const vbW = W / s;
      const vbH = H / s;
      const vbX = -(vbW - mapW) / 2;
      const vbY = -(padTop / s) - ((H - padTop - padBottom) / s - mapH) / 2;
      svg.attr('viewBox', [vbX, vbY, vbW, vbH]).attr('preserveAspectRatio', 'xMidYMid meet');
      // Sin zoom (scale=1) el mapa queda bloqueado: translateExtent = viewBox.
      const extent = [[vbX, vbY], [vbX + vbW, vbY + vbH]];
      zoom.extent(extent).translateExtent(extent);
    }
    window.addEventListener('resize', resize);

    fetch('/data/world-map.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((worldData) => {
        if (cancelled) return;
        mapW = worldData.width;
        mapH = worldData.height;
        const radius = Math.round(mapH * 0.035);
        for (const r of [clipRect, ocean]) {
          r.attr('x', 0).attr('y', 0).attr('width', mapW).attr('height', mapH)
            .attr('rx', radius).attr('ry', radius);
        }
        graticuleG.attr('d', worldData.graticule);
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
            if (isUnavailable(d)) return;
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
      window.removeEventListener('resize', resize);
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
    </>
  );
}
