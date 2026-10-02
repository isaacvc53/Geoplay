// Countries map engine (imperative D3). Layers: sea · territories · solved · missed · borders · dots (tiny countries).
import * as d3 from 'd3';
import { mesh } from 'topojson-client';

const W = 960, H = 560;
const BOX = { europa: [[-25, 34], [45, 72]], asia: [[25, -11], [150, 78]], africa: [[-20, -36], [55, 38]], america: [[-170, -57], [-30, 75]], oceania: [[110, -48], [180, 25]] };

export function createMapEngine({ svg: svgEl, tip: tipEl, topo, feats, countries }) {
  const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
  const root = svg.append('g');
  const proj = d3.geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' });
  const path = d3.geoPath(proj);
  const inGame = new Set(countries.map((c) => c.feature).filter(Boolean));

  root.append('path').attr('class', 'sea').attr('d', path({ type: 'Sphere' }));
  root.append('g').attr('class', 'base').selectAll('path').data(feats).join('path')
    .attr('d', path).attr('class', (d) => (inGame.has(d) ? 'in' : 'out'));
  const solvedG = root.append('g').attr('class', 'solved');
  const missedG = root.append('g').attr('class', 'missed');
  root.append('path').attr('class', 'border').attr('d', path(mesh(topo, topo.objects.countries, (a, b) => a !== b)));
  const dotsG = root.append('g').attr('class', 'dots');

  // Posición del punto y si el país es demasiado pequeño para verse (o no tiene geometría).
  for (const c of countries) {
    if (c.feature) {
      const [[x0, y0], [x1, y1]] = path.bounds(c.feature);
      c.tiny = Math.max(x1 - x0, y1 - y0) < 7;
      c.xy = path.centroid(c.feature);
    } else { c.tiny = true; c.xy = c.lonlat ? proj(c.lonlat) : null; }
  }

  let k = 1;
  const drawn = new Map(); // id -> true
  const zoom = d3.zoom().scaleExtent([1, 80]).translateExtent([[-W, -H], [2 * W, 2 * H]])
    .on('zoom', (e) => { k = e.transform.k; root.attr('transform', e.transform); dotsG.selectAll('circle').attr('r', 5 / k); });
  svg.call(zoom).on('dblclick.zoom', null);

  let tipTimer = null;
  const touchOnly = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  function showTip(e, c) {
    const box = tipEl.parentElement.getBoundingClientRect();
    tipEl.innerHTML = '<b></b><span></span>';
    tipEl.firstChild.textContent = c.nombre; tipEl.lastChild.textContent = c.label;
    tipEl.style.left = Math.min(e.clientX - box.left + 14, box.width - 190) + 'px';
    tipEl.style.top = e.clientY - box.top + 14 + 'px';
    tipEl.classList.add('on');
    if (touchOnly) { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2200); }
  }
  const hideTip = () => tipEl.classList.remove('on');

  function draw(c, layer, cls, flash) {
    if (drawn.has(c.id + cls)) return;
    drawn.set(c.id + cls, true);
    const hover = (sel) => sel.on('mousemove', (e) => showTip(e, c)).on('mouseleave', hideTip);
    // fill/stroke attributes are a fallback: the CSS (.solved / .missed / .dots) wins when it loads, but the colours never depend on it.
    const fill = cls === 'ok' ? '#c9a24b' : '#a8504a';
    if (c.feature) hover(layer.append('path').attr('d', path(c.feature)).attr('fill', fill).attr('stroke', '#0e2233').attr('stroke-width', 0.5).attr('class', cls + (flash ? ' flash' : '')));
    if (c.tiny && c.xy) hover(dotsG.append('circle').attr('cx', c.xy[0]).attr('cy', c.xy[1]).attr('r', 5 / k).attr('fill', fill).attr('stroke', '#0e2233').attr('class', cls + (flash ? ' flash' : '')));
  }

  const fit = (x0, y0, x1, y1, pad) => {
    const s = Math.min(80, pad / Math.max((x1 - x0) / W, (y1 - y0) / H));
    return d3.zoomIdentity.translate(W / 2 - (s * (x0 + x1)) / 2, H / 2 - (s * (y0 + y1)) / 2).scale(s);
  };
  const viewOf = (key) => {
    const b = BOX[key];
    if (!b) return d3.zoomIdentity;
    const [[a, bb], [c, d]] = b;
    const pts = [[a, bb], [c, d], [a, d], [c, bb]].map(proj);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return fit(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 1);
  };

  return {
    add(list, flash = true) { list.forEach((c) => draw(c, solvedG, 'ok', flash)); },
    reveal(list) { list.forEach((c) => { if (!drawn.has(c.id + 'ok')) draw(c, missedG, 'miss', false); }); },
    clear() { solvedG.selectAll('*').remove(); missedG.selectAll('*').remove(); dotsG.selectAll('*').remove(); drawn.clear(); hideTip(); },
    focus(key) { svg.transition().duration(650).call(zoom.transform, viewOf(key)); },
    zoomBy: (f) => svg.transition().duration(220).call(zoom.scaleBy, f),
    resetView: () => svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity),
    destroy() { clearTimeout(tipTimer); svg.on('.zoom', null); svg.selectAll('*').remove(); },
  };
}
