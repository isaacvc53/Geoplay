// Lógica pura de «Países del mundo» (mapa): los 197 países de worldQuiz.js emparejados con world-topology.json.
import { feature } from 'topojson-client';
import { CONTINENTES, ALIAS, ISO_POR_PAIS } from '../../data/worldQuiz';
import { NUMERIC_TO_ISO } from '../../data/numericToIso';

export { formatTime } from '../../lib/worldRegions';

// Sin tildes, guiones ni signos: "Guinea-Bisáu" -> "guinea bisau".
export const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[-’'.]/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
// Normalizador antiguo (las claves de ISO_POR_PAIS están hechas con él).
const oldNorm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

export const CONTINENTS = Object.entries(CONTINENTES).map(([key, c]) => ({ key, label: c.nombre, total: c.paises.length }));
export const COUNTRIES = Object.entries(CONTINENTES).flatMap(([key, c]) =>
  c.paises.map((nombre) => ({ id: norm(nombre), nombre, continente: key, iso: ISO_POR_PAIS[oldNorm(nombre)] })));
export const TOTAL = COUNTRIES.length; // 197

// Nombre (o alias) normalizado -> país
const KEYS = new Map(COUNTRIES.map((c) => [c.id, c]));
const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));
for (const [alias, target] of Object.entries(ALIAS)) {
  const c = BY_ID.get(norm(target));
  if (c) KEYS.set(norm(alias), c);
}

// Países que no traen geometría en el mapa (se marcan con un punto en sus coordenadas).
const LONLAT = { tv: [179.2, -8.52] };

export function buildGame(topo) {
  const feats = feature(topo, topo.objects.countries).features;
  const iso2num = {};
  for (const [n, i] of Object.entries(NUMERIC_TO_ISO)) iso2num[i] = n;
  const byNum = new Map(feats.filter((f) => f.id != null).map((f) => [String(f.id).padStart(3, '0'), f]));
  const countries = COUNTRIES.map((c) => ({
    ...c,
    feature: byNum.get(iso2num[c.iso]) || (c.id === 'kosovo' ? feats.find((f) => f.properties.name === 'Kosovo') : null) || null,
    lonlat: LONLAT[c.iso] || null,
  }));
  return { topo, feats, countries };
}

const pending = (c, solved) => !solved.has(c.id);

export function exactMatch(raw, solved) {
  const c = KEYS.get(norm(raw));
  if (!c) return { status: 'none' };
  return pending(c, solved) ? { status: 'hit', country: c } : { status: 'dup', country: c };
}

// Enter: exacto o, si no, un único país pendiente cuyas palabras empiecen por lo escrito.
export function submitMatch(raw, solved) {
  const ex = exactMatch(raw, solved);
  if (ex.status !== 'none') return ex;
  const qt = norm(raw).split(' ').filter(Boolean);
  if (!qt.length || qt.some((t) => t.length < 3)) return { status: 'none' };
  const found = new Set();
  for (const [key, c] of KEYS) {
    const tokens = key.split(' ');
    if (pending(c, solved) && qt.every((a) => tokens.some((t) => t.startsWith(a)))) found.add(c);
  }
  if (found.size === 1) return { status: 'hit', country: [...found][0] };
  return found.size > 1 ? { status: 'ambiguous', count: found.size } : { status: 'none' };
}

// ms a esperar antes de autoacertar: 0 si ningún OTRO país pendiente tiene un nombre que empiece por lo escrito.
// "Sudán" -> "Sudán del Sur" (900) · "Níger" -> "Nigeria" (500).
export function autoWait(raw, solved, wordMs = 900, partMs = 500) {
  const q = norm(raw), me = KEYS.get(q);
  let wait = 0;
  for (const [key, c] of KEYS) {
    if (c === me || !pending(c, solved) || key.length <= q.length || !key.startsWith(q)) continue;
    if (key[q.length] === ' ') return wordMs;
    wait = partMs;
  }
  return wait;
}
