// Motor del mapa (D3 imperativo, igual que el resto de mapas de Geotaria).
// Capas: mar · países (base) · fronteras internas de la zona · regiones acertadas · regiones no acertadas · fronteras de país.
import * as d3 from 'd3';
import { merge, mesh } from 'topojson-client';

const W = 960, H = 560;
// rot: longitud central (negativa) · box: [[lon0,lat0],[lon1,lat1]] visible al empezar la zona
const VIEWS = {
  mundo: { rot: 0 },
  europa: { rot: -10, box: [[-25, 34], [45, 72]] },
  asia: { rot: -90, box: [[25, -11], [150, 78]] },
  africa: { rot: -17, box: [[-20, -36], [55, 38]] },
  america: { rot: 100, box: [[-170, -57], [-30, 75]] },
  oceania: { rot: -175, box: [[110, -48], [240, 25]] },
};

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
const colorFor = (r) => `hsl(${hash(r.a3)}, 52%, ${44 + (r.idx % 3) * 6}%)`;

export function createMapEngine({ svg: svgEl, tip: tipEl, topo, regions }) {
  const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
  const root = svg.append('g');
  const sea = root.append('path').attr('class', 'sea');
  const base = root.append('g').attr('class', 'base');
  const inner = root.append('path').attr('class', 'inner');
  const solvedG = root.append('g').attr('class', 'solved');
  const missedG = root.append('g').attr('class', 'missed');
  const border = root.append('path').attr('class', 'border');

  const obj = topo.objects.regiones;
  const byCountry = new Map();
  for (const r of regions) {
    if (!byCountry.has(r.a3)) byCountry.set(r.a3, []);
    byCountry.get(r.a3).push(obj.geometries[r.idx]);
  }
  const countryPaths = [...byCountry].map(([a3, g]) => ({ a3, geom: merge(topo, g) }));
  base.selectAll('path').data(countryPaths).join('path').attr('class', 'out');

  let proj, path, scope = null;
  const drawn = new Map(); // id -> <path> (acertadas)
  const zoom = d3.zoom().scaleExtent([1, 80]).translateExtent([[-W, -H], [2 * W, 2 * H]])
    .on('zoom', (e) => root.attr('transform', e.transform));
  svg.call(zoom).on('dblclick.zoom', null);

  function showTip(e, r) {
    const box = tipEl.parentElement.getBoundingClientRect();
    tipEl.innerHTML = `<b></b><span></span>`;
    tipEl.firstChild.textContent = r.name; tipEl.lastChild.textContent = r.country;
    tipEl.style.left = Math.min(e.clientX - box.left + 14, box.width - 190) + 'px';
    tipEl.style.top = e.clientY - box.top + 14 + 'px';
    tipEl.classList.add('on');
  }
  const hideTip = () => tipEl.classList.remove('on');

  function drawRegion(r, parent, cls, flash) {
    const p = parent.append('path').datum(r).attr('d', path(r.feature)).attr('class', cls + (flash ? ' flash' : ''))
      .on('mousemove', (e, d) => showTip(e, d)).on('mouseleave', hideTip);
    if (cls === 'ok') p.style('fill', colorFor(r));
    return p;
  }

  function viewTransform() {
    const v = VIEWS[scope.zone];
    if (!v.box) return d3.zoomIdentity;
    const [[a, b], [c, d]] = v.box;
    const pts = [[a, b], [c, d], [a, d], [c, b]].map(proj);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return fitTransform(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 1);
  }
  function fitTransform(x0, y0, x1, y1, pad = 0.85) {
    const k = Math.min(80, pad / Math.max((x1 - x0) / W, (y1 - y0) / H));
    return d3.zoomIdentity.translate(W / 2 - (k * (x0 + x1)) / 2, H / 2 - (k * (y0 + y1)) / 2).scale(k);
  }

  return {
    // Cambia de zona: reproyecta, redibuja las acertadas y encuadra.
    setScope(newScope, solved) {
      scope = newScope;
      proj = d3.geoNaturalEarth1().rotate([VIEWS[scope.zone].rot, 0]).fitSize([W, H], { type: 'Sphere' });
      path = d3.geoPath(proj);
      sea.attr('d', path({ type: 'Sphere' }));
      base.selectAll('path').attr('d', (d) => path(d.geom))
        .attr('class', (d) => (scope.list.some((r) => r.a3 === d.a3) ? 'in' : 'out'));
      inner.attr('d', path(mesh(topo, obj, (a, b) => a !== b && a.properties.c === b.properties.c && scope.ids.has(String(a.properties.k)))));
      border.attr('d', path(mesh(topo, obj, (a, b) => a.properties.c !== b.properties.c)));
      solvedG.selectAll('*').remove(); missedG.selectAll('*').remove(); drawn.clear(); hideTip();
      for (const r of scope.list) if (solved.has(r.id)) drawn.set(r.id, drawRegion(r, solvedG, 'ok', false));
      svg.call(zoom.transform, viewTransform());
    },
    add(list, flash = true) {
      for (const r of list) if (!drawn.has(r.id)) drawn.set(r.id, drawRegion(r, solvedG, 'ok', flash));
    },
    reveal(list) { for (const r of list) if (!drawn.has(r.id)) drawRegion(r, missedG, 'miss', false); },
    clearMissed() { missedG.selectAll('*').remove(); },
    focus(list) {
      if (!list.length) return;
      const bs = list.map((r) => path.bounds(r.feature));
      const t = fitTransform(d3.min(bs, (b) => b[0][0]), d3.min(bs, (b) => b[0][1]), d3.max(bs, (b) => b[1][0]), d3.max(bs, (b) => b[1][1]), 0.6);
      svg.transition().duration(650).call(zoom.transform, t);
    },
    zoomBy: (k) => svg.transition().duration(220).call(zoom.scaleBy, k),
    resetView: () => svg.transition().duration(450).call(zoom.transform, viewTransform()),
    destroy() { svg.on('.zoom', null); svg.selectAll('*').remove(); },
  };
}
