// Pure logic for the "World countries" map mode: the 197 countries of worldQuiz.js matched against world-topology.json.
import { feature } from 'topojson-client';
import { CONTINENTES, ALIAS, ISO_POR_PAIS } from '../../data/worldQuiz';
import { NUMERIC_TO_ISO } from '../../data/numericToIso';

export { formatTime } from '../../lib/worldRegions';

// No accents, hyphens or punctuation: "Guinea-Bissau" -> "guinea bissau".
export const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[-’'.]/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

export const CONTINENTS = Object.entries(CONTINENTES).map(([key, c]) => ({ key, label: c.nombre, total: c.paises.length }));
export const COUNTRIES = Object.entries(CONTINENTES).flatMap(([key, c]) =>
  c.paises.map((nombre) => ({ id: norm(nombre), nombre, continente: key, iso: ISO_POR_PAIS[norm(nombre)] })));
export const TOTAL = COUNTRIES.length; // 197

// Normalised name (or alias) -> country
const KEYS = new Map(COUNTRIES.map((c) => [c.id, c]));
const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));
for (const [alias, target] of Object.entries(ALIAS)) {
  const c = BY_ID.get(norm(target));
  if (c) KEYS.set(norm(alias), c);
}

// Countries with no geometry in the map (drawn as a dot at these coordinates).
const LONLAT = { tv: [179.2, -8.52] };

const LABEL = Object.fromEntries(CONTINENTS.map((c) => [c.key, c.label]));

export function buildGame(topo) {
  const feats = feature(topo, topo.objects.countries).features;
  const iso2num = {};
  for (const [n, i] of Object.entries(NUMERIC_TO_ISO)) iso2num[i] = n;
  const byNum = new Map(feats.filter((f) => f.id != null).map((f) => [String(f.id).padStart(3, '0'), f]));
  const countries = COUNTRIES.map((c) => ({
    ...c,
    feature: byNum.get(iso2num[c.iso]) || (c.id === 'kosovo' ? feats.find((f) => f.properties.name === 'Kosovo') : null) || null,
    lonlat: LONLAT[c.iso] || null,
    label: LABEL[c.continente],
  }));
  return { topo, feats, countries };
}

const pending = (c, solved) => !solved.has(c.id);

export function exactMatch(raw, solved) {
  const c = KEYS.get(norm(raw));
  if (!c) return { status: 'none' };
  return pending(c, solved) ? { status: 'hit', country: c } : { status: 'dup', country: c };
}

// Enter: exact match or, failing that, a single pending country whose words start with what was typed.
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

// ms to wait before auto-accepting: 0 if no OTHER pending country has a name starting with what was typed.
// "Guinea" -> "Guinea-Bissau" (900) · "Niger" -> "Nigeria" (500).
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
