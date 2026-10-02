// src/lib/worldRegions.js
// Datos y lógica pura del modo «World subdivisions» (sin backend).
// Fuente: public/data/world-admin1.topojson (Natural Earth admin-1, ver tools/build_world_admin1.py).
// Propiedades de cada región: k id · n nombre (inglés) · c ISO-3 del país · ce país (inglés) · z zona · t tipo · a alias "a|b" (incluye los nombres en español y locales, que también se aceptan).
import { feature } from 'topojson-client';
import { normalizeText } from './textMatch';

export const ZONES = [
  { key: 'mundo', label: 'World' },
  { key: 'europa', label: 'Europe' },
  { key: 'asia', label: 'Asia' },
  { key: 'africa', label: 'Africa' },
  { key: 'america', label: 'Americas' },
  { key: 'oceania', label: 'Oceania' },
];

const TYPE_WORDS = new Set([
  'province', 'provincia', 'state', 'estado', 'region', 'departamento', 'department', 'oblast', 'county', 'city', 'governorate',
  'district', 'distrito', 'governorate', 'gobernacion', 'prefecture', 'prefectura', 'municipality', 'municipio', 'canton',
]);
const GLUE = new Set(['de', 'del', 'of', 'la', 'el']);

// "Provincia de Buenos Aires" -> "buenos aires". Devuelve '' si no cambia nada útil.
export function stripTypeWords(norm) {
  const t = norm.split(' ').filter((w) => !TYPE_WORDS.has(w));
  while (t.length && GLUE.has(t[0])) t.shift();
  while (t.length && GLUE.has(t[t.length - 1])) t.pop();
  const s = t.join(' ');
  return s.length >= 3 && s !== norm ? s : '';
}

let cache = null;
export async function loadWorldRegions() {
  if (cache) return cache;
  const res = await fetch('/data/world-admin1.topojson');
  if (!res.ok) throw new Error('No se pudo cargar world-admin1.topojson');
  const topo = await res.json();
  const feats = feature(topo, topo.objects.regiones).features;
  const regions = feats.map((f, idx) => {
    const p = f.properties;
    const raw = [p.n, ...(p.a ? p.a.split('|') : [])];
    const names = new Set();
    for (const r of raw) {
      const n = normalizeText(r);
      if (n.length >= 2) names.add(n);
      const s = stripTypeWords(n);
      if (s) names.add(s);
    }
    return { idx, id: String(p.k), name: p.n, country: p.ce, a3: p.c, zone: p.z, feature: f, names: [...names] };
  });
  cache = { topo, regions };
  return cache;
}

// Índice por zona: nombre normalizado -> índices de región (solo las de la zona).
export function buildScope(regions, zone) {
  const list = regions.filter((r) => zone === 'mundo' || r.zone === zone);
  const byName = new Map();
  for (const r of list) {
    for (const n of r.names) {
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n).push(r);
    }
  }
  return { zone, list, byName, ids: new Set(list.map((r) => r.id)) };
}

const pending = (rs, solved) => rs.filter((r) => !solved.has(r.id));

// Coincidencia exacta (la usa el autoacierto al teclear). Todas las regiones sin acertar con ese nombre.
export function exactMatch(scope, raw, solved) {
  const q = normalizeText(raw);
  if (q.length < 2) return { status: 'none' };
  // También vale "Province of Buenos Aires" aunque la región se llame "Buenos Aires".
  const all = scope.byName.get(q) || scope.byName.get(stripTypeWords(q));
  if (!all) return { status: 'none' };
  const hit = pending(all, solved);
  return hit.length ? { status: 'hit', regions: hit } : { status: 'dup', regions: all };
}

// Coincidencia al pulsar Enter: exacta o, si no, un único nombre que empiece por lo escrito (palabra a palabra).
export function submitMatch(scope, raw, solved) {
  const ex = exactMatch(scope, raw, solved);
  if (ex.status !== 'none') return ex;
  const q = normalizeText(raw);
  const qt = q.split(' ').filter(Boolean);
  if (!qt.length || qt.some((t) => t.length < 3)) return { status: 'none' };
  const names = [];
  for (const [name, rs] of scope.byName) {
    const tokens = name.split(' ');
    if (qt.every((a) => tokens.some((t) => t === a || t.startsWith(a))) && pending(rs, solved).length) names.push(name);
  }
  if (names.length === 1) return { status: 'hit', regions: pending(scope.byName.get(names[0]), solved) };
  return names.length > 1 ? { status: 'ambiguous', count: names.length } : { status: 'none' };
}

// ms a esperar antes de autoacertar: 0 si ningún otro nombre pendiente empieza por lo escrito.
// "Guinea" -> "Guinea Bisáu" (espera 900) · "Sur" -> "Suroeste" (espera 500).
export function autoWait(scope, raw, solved, wordMs = 900, partMs = 500) {
  const q = normalizeText(raw);
  let wait = 0;
  for (const [name, rs] of scope.byName) {
    if (name.length <= q.length || !name.startsWith(q)) continue;
    if (!pending(rs, solved).length) continue;
    if (name[q.length] === ' ') return wordMs;
    wait = partMs;
  }
  return wait;
}

// ---- Progreso guardado (localStorage) ----
const KEY = 'geotaria.worldRegions.v1';
export function loadProgress() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { solved: new Set(Array.isArray(d?.solved) ? d.solved : []), ms: Number(d?.ms) || 0 };
  } catch { return { solved: new Set(), ms: 0 }; }
}
export function saveProgress(solved, ms) {
  try { localStorage.setItem(KEY, JSON.stringify({ solved: [...solved], ms })); } catch { /* sin espacio / modo privado */ }
}

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const mm = String(m).padStart(2, '0'), ss = String(x).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
