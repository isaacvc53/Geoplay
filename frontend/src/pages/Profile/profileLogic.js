// Lógica pura del perfil (sin DOM), portada 1:1 de profile.html.
import { normalizeName, resolveContinent, resolveSlug } from '../../lib/countryInfo';

export { normalizeName };

// Fecha relativa estilo "entrada de bitácora": hoy / ayer / hace N días...
export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Un único tono (brass), de apagado a intenso según el % de dominio.
export function colorForPercentage(pct) {
  if (pct == null) return null;
  const start = [70, 62, 44];
  const end = [224, 189, 125];
  const t = Math.max(0, Math.min(100, pct)) / 100;
  const mix = (i) => Math.round(start[i] + (end[i] - start[i]) * t);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}

// --- Rango de explorador, según territorios distintos jugados ---
const RANKS = [
  { min: 0, title: 'Uncharted' },
  { min: 1, title: 'Apprentice Surveyor' },
  { min: 3, title: 'Field Cartographer' },
  { min: 6, title: 'Regional Navigator' },
  { min: 10, title: 'Continental Explorer' },
  { min: 15, title: 'Master Globetrotter' },
  { min: 20, title: 'Legendary Navigator' },
];

export function computeRank(playedCount) {
  let current = RANKS[0];
  for (const r of RANKS) if (playedCount >= r.min) current = r;
  return current.title;
}

// next = null cuando ya se alcanzó el máximo.
export function computeRankProgress(playedCount) {
  let current = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (playedCount >= RANKS[i].min) {
      current = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  if (!next) return { current, next: null, pct: 100 };
  const span = next.min - current.min;
  const progress = playedCount - current.min;
  const pct = span > 0 ? Math.min(100, Math.round((progress / span) * 100)) : 100;
  return { current, next, pct };
}

// --- Logros: se evalúan contra stats agregadas (nunca contra tiempo de partida) ---
export const ACHIEVEMENTS = [
  { title: 'First Landing', desc: 'Complete your first expedition.', check: (s) => s.totalGames >= 1 },
  { title: 'Cartographer', desc: 'Chart 5 territories.', check: (s) => s.territoriesCharted >= 5 },
  { title: 'Globetrotter', desc: 'Chart 15 territories.', check: (s) => s.territoriesCharted >= 15 },
  { title: 'Flawless Run', desc: 'Score 100% in a single expedition.', check: (s) => s.masteredCount >= 1 },
  { title: 'Full Mastery', desc: "Get every region of a territory right, every time you've been asked.", check: (s) => s.fullyMasteredCount >= 1 },
  { title: 'World Wanderer', desc: 'Play territories on 4 different continents.', check: (s) => s.continentsPlayed >= 4 },
  { title: 'On a Roll', desc: 'Play 3 days in a row.', check: (s) => s.streak >= 3 },
  { title: 'Dedicated Explorer', desc: 'Log 20 expeditions.', check: (s) => s.totalGames >= 20 },
  { title: 'Sharp Eye', desc: 'Hold a 90%+ overall accuracy across at least 5 expeditions.', check: (s) => s.totalGames >= 5 && s.overallAccuracy != null && s.overallAccuracy >= 90 },
];

// --- Estadísticas agregadas, calculadas a partir de /progress/countries ---

// Precisión global real (todos los intentos de todas las partidas). Distinto
// del "percentage" por país, que es la MEJOR partida.
export function computeOverallAccuracy(countries) {
  let attempts = 0;
  let correct = 0;
  countries.forEach((c) => (c.regions || []).forEach((r) => {
    attempts += r.attempts;
    correct += r.correct;
  }));
  return attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : null;
}

export function computeHighlights(playedCountries) {
  let bestCountry = null;
  let masteredCount = 0; // países cuya MEJOR partida fue perfecta
  let fullyMasteredCount = 0; // países con TODAS sus regiones al 100% acumulado
  const continents = new Set();

  for (const c of playedCountries) {
    if (!bestCountry || c.percentage > bestCountry.percentage) bestCountry = c;
    if (c.percentage === 100) masteredCount++;
    const regiones = c.regions || [];
    if (regiones.length > 0 && regiones.every((r) => r.accuracy === 100)) fullyMasteredCount++;
    continents.add(resolveContinent(c.country_name));
  }
  return { bestCountry, masteredCount, fullyMasteredCount, continentsPlayed: continents.size };
}

// --- Continentes: territorios pisados (>=1 partida) sobre el total ---
const CONTINENT_ORDER = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania'];

export function computeContinents(countries) {
  const byContinent = {};
  countries.forEach((c) => {
    const cont = resolveContinent(c.country_name);
    if (!byContinent[cont]) byContinent[cont] = { total: 0, played: 0 };
    byContinent[cont].total++;
    if (c.games_played > 0) byContinent[cont].played++;
  });
  const order = CONTINENT_ORDER.filter((k) => byContinent[k])
    .concat(Object.keys(byContinent).filter((k) => !CONTINENT_ORDER.includes(k)));
  return order.map((name) => ({ name, ...byContinent[name] }));
}

// --- Puntos débiles / fuertes ---
// `countryId` null = cruce de todos los países (mín. 2 intentos); con un país,
// mín. 1 intento y hasta 12 filas. mode: 'weak' (peor % primero, sin 100%) o 'strong'.
export function computeSpots(countries, { countryId = null, mode = 'weak', limit = 5 } = {}) {
  const rows = [];
  countries.forEach((c) => {
    if (countryId && String(c.country_id) !== String(countryId)) return;
    const minAttempts = countryId ? 1 : 2;
    (c.regions || []).forEach((r) => {
      if (r.attempts < minAttempts) return;
      if (mode === 'weak' && r.accuracy >= 100) return;
      rows.push({
        region_name: r.region_name,
        accuracy: r.accuracy,
        attempts: r.attempts,
        country_name: c.country_name,
        country_slug: c.country_slug || resolveSlug(c.country_name),
      });
    });
  });
  rows.sort((a, b) => (
    mode === 'weak'
      ? (a.accuracy - b.accuracy || b.attempts - a.attempts)
      : (b.accuracy - a.accuracy || b.attempts - a.attempts)
  ));
  return rows.slice(0, countryId ? 12 : limit);
}

// --- Racha y heatmap de actividad, a partir de las partidas recientes ---
export function dateKey(dateLike) {
  const d = new Date(dateLike);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Días consecutivos jugando hasta hoy; si hoy aún no se jugó, cuenta desde ayer.
export function computeStreak(sessions) {
  if (!sessions || !sessions.length) return 0;
  const daysPlayed = new Set(sessions.map((s) => dateKey(s.played_at)));
  const cursor = new Date();
  if (!daysPlayed.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (daysPlayed.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// 10 semanas de celdas agrupadas en columnas de 7.
export function buildHeatColumns(sessions) {
  const countByDay = {};
  (sessions || []).forEach((s) => {
    const key = dateKey(s.played_at);
    countByDay[key] = (countByDay[key] || 0) + 1;
  });
  const totalDays = 10 * 7;
  const today = new Date();
  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    cells.push({ date: d, count: countByDay[dateKey(d)] || 0 });
  }
  const maxCount = Math.max(1, ...cells.map((c) => c.count));
  const columns = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));
  return { columns, maxCount };
}

// Puntos del gráfico de tendencia (más antigua -> más reciente).
export function buildTrend(sessions) {
  const chron = sessions.slice().reverse();
  const n = chron.length;
  const w = 300, h = 60, pad = 6;
  const xStep = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const points = chron.map((s, i) => [
    pad + i * xStep,
    pad + (1 - Math.max(0, Math.min(100, s.percentage)) / 100) * (h - pad * 2),
  ]);
  const delta = Math.round((chron[n - 1].percentage - chron[0].percentage) * 10) / 10;
  const color = delta > 0 ? '#5a9a86' : (delta < 0 ? '#b1483a' : '#a89b81');
  const arrow = delta > 0 ? '▲' : (delta < 0 ? '▼' : '—');
  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaPath = `${linePath} L${points[n - 1][0].toFixed(1)},${h - pad} L${points[0][0].toFixed(1)},${h - pad} Z`;
  return { chron, n, w, h, points, delta, color, arrow, linePath, areaPath };
}

// Países ya jugados, por nombre, para los buscadores: { id, label }.
export function playedCountryOptions(playedCountries, resolveDisplayName) {
  return playedCountries
    .slice()
    .sort((a, b) => resolveDisplayName(a.country_name).localeCompare(resolveDisplayName(b.country_name)))
    .map((c) => ({ id: String(c.country_id), label: resolveDisplayName(c.country_name) }));
}

// --- Topología ---
let worldTopologyPromise = null;

// Antes se parseaba mapa-mundial.html; ahora es un JSON estático en /public/data.
export function loadWorldTopology() {
  if (!worldTopologyPromise) {
    worldTopologyPromise = fetch('/data/world-topology.json', { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar world-topology.json');
        return res.json();
      })
      .catch((err) => {
        worldTopologyPromise = null;
        throw err;
      });
  }
  return worldTopologyPromise;
}

// PENDIENTE (igual que en el original): falta enganchar con la geometría real
// de provincias de cada país. Debe devolver { topology, objectKey }.
export async function loadCountryTopology() {
  throw new Error('loadCountryTopology: falta conectar con la geometría real de provincias');
}
