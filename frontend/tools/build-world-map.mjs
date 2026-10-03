#!/usr/bin/env node
// Genera public/data/world-map.json (siluetas de los países para la ruleta del sorteo de país)
// a partir de Natural Earth (admin-0, 10m, vía el paquete npm `world-atlas`).
//
// Uso (desde frontend/):
//     npm i -D world-atlas          # una sola vez (d3 y topojson-client ya son dependencias)
//     node tools/build-world-map.mjs
//
// Natural Earth es de dominio público (naturalearthdata.com), así que el resultado se puede usar
// también en un proyecto comercial. world-atlas (ISC) solo empaqueta esos datos en TopoJSON.
//
// Salida: { width, height, projection, graticule, countries: [{ id, name, slug, d, main? }] }
//   - La proyección es la misma que usaba el mapa anterior (d3.geoEqualEarth con el meridiano
//     central en 12,65°E, escala 305,73), así que el VIEWBOX de CountryRoulette.jsx sigue valiendo.
//   - id:   ISO 3166-1 alfa-2 (solo informativo; la ruleta no lo usa).
//   - slug: para los 197 países de backend/paises_meta.json es `slug_archivo` (el slug que guarda el
//           backend y el nombre de data/countries/<slug>.js). Para los territorios, la tabla TERRITORIES.
//   - d:    path completo del país: solo M / L / Z con coordenadas absolutas (boxOf() de la ruleta
//           depende de ese formato), 2 decimales.
//   - main: solo si el país tiene varios polígonos; el más grande, para el aro del ganador.
//
// Ajustes sobre Natural Earth para que cada entrada sea "un país del juego":
//   · Se separan de su metrópoli las regiones de ultramar de Francia, Países Bajos y Noruega.
//   · Se funden con su país Somalilandia, Chipre del Norte, la zona de la ONU y las bases británicas
//     de Chipre, Baikonur (Kazajistán) y Guantánamo (Cuba).
//   · Se descartan la Antártida y los arrecifes/bancos disputados sin población.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { NUMERIC_TO_ISO } from '../src/data/numericToIso.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'data', 'world-map.json');
const META = JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', 'backend', 'paises_meta.json'), 'utf8'));
const TOPO = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'node_modules', 'world-atlas', 'countries-10m.json'), 'utf8'));

// --- Proyección (idéntica a la del mapa anterior) ---------------------------------------------
const MARGIN = 10;        // unidades de aire alrededor del contorno de la esfera
const CENTER_LON = 12.65; // meridiano central (°E)
const SCALE = 305.73;     // escala de d3
const TOL = 0.25;         // tolerancia de simplificación (unidades del mapa; ~0,1 px en pantalla)

const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
const eeY = (phi) => { const l = Math.asin(M * Math.sin(phi)); const l2 = l * l; return l * (A1 + A2 * l2 + l2 ** 3 * (A3 + A4 * l2)); };
const halfW = (SCALE * Math.PI) / (M * A1);
const halfH = SCALE * eeY(Math.PI / 2);
const width = +(2 * halfW + 2 * MARGIN).toFixed(2);
const height = +(2 * halfH + 2 * MARGIN).toFixed(2);
const translate = [+(MARGIN + halfW).toFixed(2), +(MARGIN + halfH).toFixed(2)];
const projection = d3.geoEqualEarth().rotate([-CENTER_LON, 0]).scale(SCALE).translate(translate);

// --- Slugs y nombres ----------------------------------------------------------------------------
const COUNTRIES = {}; // ISO2 (mayúsculas) -> [slug, nombre]
for (const v of Object.values(META)) COUNTRIES[v.iso.toUpperCase()] = [v.slug_archivo, v.en];
const TERRITORIES = {
  GL: ['greenland', "Greenland"],
  GS: ['south-georgia-and-south-sandwich-islands', "South Georgia and the South Sandwich Islands"],
  PF: ['french-polynesia', "French Polynesia"],
  SJ: ['svalbard-and-jan-mayen', "Svalbard and Jan Mayen"],
  SH: ['saint-helena', "Saint Helena"],
  EH: ['western-sahara', "Western Sahara"],
  TF: ['french-southern-and-antarctic-lands', "French Southern and Antarctic Lands"],
  NC: ['new-caledonia', "New Caledonia"],
  GF: ['french-guiana', "French Guiana"],
  MP: ['northern-mariana-islands', "Northern Mariana Islands"],
  WF: ['wallis-and-futuna', "Wallis and Futuna"],
  FK: ['falkland-islands', "Falkland Islands"],
  PR: ['puerto-rico', "Puerto Rico"],
  KY: ['cayman-islands', "Cayman Islands"],
  FO: ['faroe-islands', "Faroe Islands"],
  GP: ['guadeloupe', "Guadeloupe"],
  RE: ['reunion', "Reunion"],
  VI: ['us-virgin-islands', "US Virgin Islands"],
  AX: ['aland-islands', "Aland Islands"],
  HK: ['hong-kong', "Hong Kong"],
  MQ: ['martinique', "Martinique"],
  TC: ['turks-and-caicos-islands', "Turks and Caicos Islands"],
  CW: ['curacao', "Curaçao"],
  IM: ['isle-of-man', "Isle of Man"],
  GU: ['guam', "Guam"],
  HM: ['heard-island-and-mcdonald-islands', "Heard Island and McDonald Islands"],
  YT: ['mayotte', "Mayotte"],
  PM: ['saint-pierre-and-miquelon', "Saint Pierre and Miquelon"],
  VG: ['british-virgin-islands', "British Virgin Islands"],
  BQ: ['bonaire-saint-eustachius-and-saba', "Bonaire, Saint Eustachius and Saba"],
  NU: ['niue', "Niue"],
  AW: ['aruba', "Aruba"],
  BM: ['bermuda', "Bermuda"],
  AS: ['american-samoa', "American Samoa"],
  AI: ['anguilla', "Anguilla"],
  CX: ['christmas-island', "Christmas Island"],
  JE: ['jersey', "Jersey"],
  MS: ['montserrat', "Montserrat"],
  IO: ['british-indian-ocean-territory', "British Indian Ocean Territory"],
  GG: ['guernsey', "Guernsey"],
  CK: ['cook-islands', "Cook Islands"],
  NF: ['norfolk-island', "Norfolk Island"],
  PN: ['pitcairn-islands', "Pitcairn Islands"],
  MF: ['saint-martin', "Saint Martin"],
  SX: ['sint-maarten', "Sint Maarten"],
  BV: ['bouvet-island', "Bouvet Island"],
  BL: ['saint-barthelemy', "Saint Barthelemy"],
  MO: ['macau', "Macau"],
  GI: ['gibraltar', "Gibraltar"],
  CC: ['cocos-keeling-islands', "Cocos (Keeling) Islands"],
  UM: ['us-minor-outlying-islands', 'U.S. Minor Outlying Islands'],
};
const slugOf = (iso) => COUNTRIES[iso] || TERRITORIES[iso];

// --- Qué hacer con cada entidad de Natural Earth -------------------------------------------------
const BY_NAME = { Kosovo: 'XK' }; // los pocos sin código numérico que son países
const MERGE_INTO = {
  Somaliland: 'SO', 'N. Cyprus': 'CY', 'Cyprus U.N. Buffer Zone': 'CY', Akrotiri: 'CY', Dhekelia: 'CY',
  Baikonur: 'KZ', 'USNB Guantanamo Bay': 'CU',
};
const DROP = new Set([
  'Antarctica', 'Siachen Glacier', 'Coral Sea Is.', 'Spratly Is.', 'Ashmore and Cartier Is.', 'Bajo Nuevo Bank',
  'Serranilla Bank', 'Scarborough Reef', 'Clipperton I.',
]);
const NAME_TO_ISO = { 'Indian Ocean Ter.': 'CX', 'U.S. Minor Outlying Is.': 'UM' };

// Reparto de los polígonos de un país entre su metrópoli y sus territorios, según el centro de cada polígono.
const inBox = (c, [lo0, lo1, la0, la1]) => c[0] >= lo0 && c[0] <= lo1 && c[1] >= la0 && c[1] <= la1;
const SPLIT = {
  FR: (c) => (inBox(c, [-55, -51, 2, 6]) ? 'GF' : inBox(c, [-62, -61.05, 15.7, 16.6]) ? 'GP'
    : inBox(c, [-61.4, -60.7, 14.3, 15]) ? 'MQ' : inBox(c, [55, 56, -21.6, -20.8]) ? 'RE'
    : inBox(c, [44.8, 45.5, -13.2, -12.4]) ? 'YT' : 'FR'),
  NL: (c) => (inBox(c, [-70, -62, 12, 18]) ? 'BQ' : 'NL'),
  NO: (c) => (c[1] > 73 || c[0] < -3 ? 'SJ' : c[1] < -50 ? 'BV' : 'NO'),
  CX: (c) => (c[0] < 100 ? 'CC' : 'CX'), // "Territorios del océano Índico": Cocos (96°E) y Navidad (105°E)
};

// --- Geometría -----------------------------------------------------------------------------------
const polysOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
function centerOf(poly) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of poly[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

const polygons = new Map(); // ISO2 -> [polígonos GeoJSON]
const add = (iso, poly) => { if (!polygons.has(iso)) polygons.set(iso, []); polygons.get(iso).push(poly); };
const unknown = [];
for (const f of feature(TOPO, TOPO.objects.countries).features) {
  const name = f.properties.name;
  if (DROP.has(name)) continue;
  let iso = MERGE_INTO[name] || NAME_TO_ISO[name] || BY_NAME[name];
  if (!iso && f.id !== undefined) iso = (NUMERIC_TO_ISO[f.id] || '').toUpperCase();
  if (!iso) { unknown.push(name); continue; }
  const split = SPLIT[iso];
  for (const poly of polysOf(f.geometry)) add(split ? split(centerOf(poly)) : iso, poly);
}
if (unknown.length) console.error('AVISO: sin código ISO:', unknown);

// Proyecta una geometría y devuelve sus anillos [[x, y], ...] ya recortados en el antimeridiano de la proyección.
function project(geometry) {
  const rings = [];
  let cur = null;
  const sink = {
    point(x, y) { cur.push([x, y]); },
    lineStart() { cur = []; },
    lineEnd() { if (cur.length > 2) rings.push(cur); cur = null; },
    polygonStart() {}, polygonEnd() {}, sphere() {},
  };
  d3.geoStream(geometry, projection.stream(sink));
  return rings;
}

// Proyecta un polígono suelto. Si un polígono pequeño llega con el sentido de giro invertido (pasa con algún atolón
// de Maldivas), d3 lo toma como "toda la esfera menos el atolón" y taparía el océano entero: se detecta y se le da la vuelta.
function projectPolygon(poly) {
  const rings = project({ type: 'Polygon', coordinates: poly });
  const xs = poly[0].map((p) => p[0]), ys = poly[0].map((p) => p[1]);
  const small = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 20;
  const huge = rings.some((r) => {
    const rx = r.map((p) => p[0]), ry = r.map((p) => p[1]);
    return Math.max(Math.max(...rx) - Math.min(...rx), Math.max(...ry) - Math.min(...ry)) > 400;
  });
  return small && huge ? project({ type: 'Polygon', coordinates: poly.map((r) => [...r].reverse()) }) : rings;
}

// Ramer–Douglas–Peucker sobre un anillo cerrado (se parte por el punto más lejano del primero).
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function rdp(pts, tol) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let max = 0, idx = -1;
    for (let k = i + 1; k < j; k++) { const d = distSeg(pts[k], pts[i], pts[j]); if (d > max) { max = d; idx = k; } }
    if (idx > 0 && max > tol) { keep[idx] = 1; stack.push([i, idx], [idx, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
function simplifyRing(ring) {
  const r = [ring[0]];
  for (const p of ring) if (p[0] !== r[r.length - 1][0] || p[1] !== r[r.length - 1][1]) r.push(p);
  if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  if (r.length < 4) return r;
  let far = 1, max = -1;
  for (let k = 1; k < r.length; k++) { const d = Math.hypot(r[k][0] - r[0][0], r[k][1] - r[0][1]); if (d > max) { max = d; far = k; } }
  const a = rdp(r.slice(0, far + 1), TOL), b = rdp([...r.slice(far), r[0]], TOL);
  const out = [...a, ...b.slice(1, -1)];
  return out.length >= 3 ? out : [r[0], r[far], r[Math.floor((r.length + far) / 2)]];
}

const fmt = (v) => (Math.round(v * 100) / 100).toString();
function ringPath(ring) {
  const pts = [];
  for (const [x, y] of ring) {
    const s = `${fmt(x)},${fmt(y)}`;
    if (pts[pts.length - 1] !== s) pts.push(s);
  }
  return pts.length < 3 ? '' : `M${pts.join('L')}Z`;
}
const bboxArea = (ring) => {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
};

// --- Construcción --------------------------------------------------------------------------------
const countries = [];
const slugSeen = new Map();
for (const [iso, polys] of polygons) {
  const info = slugOf(iso);
  if (!info) { console.error('AVISO: sin slug para', iso); continue; }
  let rings = polys.flatMap(projectPolygon).map(simplifyRing).filter((r) => r.length >= 3);
  // Microestados (Vaticano, ...): a 2 decimales su contorno real se queda en un punto, así que se dibujan como un
  // hexágono mínimo (diámetro ~0,8 unidades, menos de 1 px) centrado donde están, para que sigan existiendo.
  const hexagon = (cx, cy) => Array.from({ length: 6 }, (_, k) => [cx + 0.4 * Math.cos((k * Math.PI) / 3), cy + 0.4 * Math.sin((k * Math.PI) / 3)]);
  if (!rings.length) {
    // El contorno de Natural Earth del Vaticano es un polígono degenerado (sin área) y d3 lo descarta.
    const [cx, cy] = projection(centerOf(polys[0]));
    rings = [hexagon(cx, cy)];
  } else {
    const all = rings.flat();
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    if (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 0.8) {
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      rings = [hexagon(cx, cy)];
    }
  }
  const paths = rings.map(ringPath).filter(Boolean);
  if (!paths.length) { console.error('AVISO: sin geometría para', iso); continue; }
  const entry = { id: iso, name: info[1], slug: info[0], d: paths.join('') };
  if (paths.length > 1) {
    const big = rings.reduce((a, b) => (bboxArea(b) > bboxArea(a) ? b : a));
    entry.main = ringPath(big);
  }
  entry._area = Math.max(...rings.map(bboxArea));
  entry._total = (() => {
    const all = rings.flat();
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
  })();
  (slugSeen.get(entry.slug) || slugSeen.set(entry.slug, []).get(entry.slug)).push(iso);
  countries.push(entry);
}
const dups = [...slugSeen].filter(([, v]) => v.length > 1);
if (dups.length) { console.error('ERROR: slugs repetidos:', dups); process.exit(1); }

// Los países grandes se dibujan primero y los pequeños encima, para que un enclave o una isla dentro de la
// caja de otro país (Lesoto, San Marino, ...) no quede tapado.
countries.sort((a, b) => b._total - a._total || (a.id < b.id ? -1 : 1));
for (const c of countries) { delete c._area; delete c._total; }

fs.writeFileSync(OUT, JSON.stringify({
  width, height,
  projection: { type: 'equalEarth', rotate: CENTER_LON, scale: SCALE, translate },
  graticule: '',
  countries,
}));
console.error(`${countries.length} países, mapa ${width}x${height} -> ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
