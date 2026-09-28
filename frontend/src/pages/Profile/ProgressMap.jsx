import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature as topoFeature } from 'topojson-client';
import { colorForPercentage, normalizeName } from './profileLogic';

// Mapa coroplético imperativo (D3), sin reescribir en JSX. Sirve para:
//  - variant "world":    países, empareja por nombre normalizado del topojson
//  - variant "province": provincias/regiones de un país (mismo patrón visual)
// `progress` = { [nombreNormalizado]: { value: 0-100, slug?: string } }.
// Solo los países con `slug` son clicables (onOpen(slug)).
export default function ProgressMap({ variant = 'world', topology, objectKey = 'countries', progress, onOpen, style }) {
  const containerRef = useRef(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !topology) return undefined;
    const isWorld = variant === 'world';

    const geo = topoFeature(topology, topology.objects[objectKey]);
    const [width, height] = isWorld ? [820, 420] : [620, 420];
    const projection = (isWorld ? d3.geoNaturalEarth1() : d3.geoMercator()).fitSize([width, height], geo);
    const path = d3.geoPath(projection);
    const entryOf = (d) => progress[normalizeName(d.properties.name)];

    container.replaceChildren();
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'img')
      .attr('aria-label', isWorld ? 'World map of charted territories' : 'Province accuracy map');

    const tooltip = document.createElement('div');
    tooltip.className = 'map-tooltip';
    tooltip.setAttribute('role', 'status');
    container.appendChild(tooltip);
    let rect = null;

    const place = (event) => {
      if (!rect) rect = container.getBoundingClientRect();
      tooltip.style.transform =
        `translate3d(${event.clientX - rect.left}px,${event.clientY - rect.top}px,0) translate(-50%,-120%)`;
    };

    svg.append('g').selectAll('path')
      .data(geo.features)
      .join('path')
      .attr('class', (d) => 'country' + (entryOf(d) ? ' played' : ''))
      .attr('d', path)
      .style('fill', (d) => {
        const entry = entryOf(d);
        return entry ? colorForPercentage(entry.value) : null;
      })
      .each(function (d) {
        if (!isWorld) return;
        const entry = entryOf(d);
        this.setAttribute('aria-label',
          entry ? `${d.properties.name}, ${entry.value}%` : `${d.properties.name}, not played`);
        if (entry && entry.slug) this.setAttribute('tabindex', '0');
      })
      .on('mouseenter', (event, d) => {
        const entry = entryOf(d);
        rect = container.getBoundingClientRect();
        tooltip.textContent = d.properties.name;
        const pct = document.createElement('span');
        pct.className = 't-pct';
        pct.textContent = entry ? `${entry.value}%` : 'not played';
        if (!entry) pct.style.color = 'var(--parchment-dim)';
        tooltip.appendChild(pct);
        place(event);
        tooltip.style.opacity = '1';
      })
      .on('mousemove', place)
      .on('mouseleave', () => {
        tooltip.style.opacity = '0';
        rect = null;
      })
      .on('click keydown', (event, d) => {
        if (!isWorld) return;
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
        const entry = entryOf(d);
        if (entry && entry.slug) {
          event.preventDefault();
          onOpenRef.current?.(entry.slug);
        }
      });

    return () => container.replaceChildren();
  }, [variant, topology, objectKey, progress]);

  return <div className="world-map-wrap" ref={containerRef} style={style} />;
}
