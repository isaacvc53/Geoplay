// Pure logic for the head-to-head page (no DOM, no React), so it is easy to test.
//
// Vocabulary: "me" is the signed-in player, "friend" the one they compare with.
// A side that is null/undefined means "no data" (never played / no attempts).
import { resolveContinent } from '../../lib/countryInfo';

const CONTINENT_ORDER = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania'];

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function formatTime(totalSeconds) {
  if (totalSeconds == null) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ---------- scoreboard ----------

// `better` says which direction wins. `max` fixes the bar scale (percentages).
export const METRICS = [
  { key: 'countries_played', label: 'Territories charted', better: 'high', format: (v) => String(v) },
  { key: 'games_played', label: 'Expeditions logged', better: 'high', format: (v) => String(v) },
  { key: 'accuracy', label: 'Guess accuracy', better: 'high', max: 100, format: (v) => `${v}%` },
  { key: 'mastered_count', label: 'Territories mastered', better: 'high', format: (v) => String(v) },
  { key: 'streak', label: 'Current streak', better: 'high', format: (v) => plural(v, 'day', 'days') },
  { key: 'fastest_perfect_seconds', label: 'Fastest perfect run', better: 'low', format: formatTime },
];

const has = (v) => v !== null && v !== undefined;

// Who wins one category: 'me' | 'friend' | 'tie' | null (nobody has data).
// If only one side has a value, that side wins (a run beats no run).
export function decide(better, a, b) {
  if (!has(a) && !has(b)) return null;
  if (has(a) && !has(b)) return 'me';
  if (!has(a) && has(b)) return 'friend';
  if (a === b) return 'tie';
  const meWins = better === 'low' ? a < b : a > b;
  return meWins ? 'me' : 'friend';
}

// Bar lengths (0-100) for both sides. For "low is better" metrics the best
// (smallest) value gets the full bar, so a longer bar always means "better".
export function barWidths(metric, a, b) {
  if (!has(a) && !has(b)) return [0, 0];
  if (metric.better === 'low') {
    const best = Math.min(...[a, b].filter(has));
    const width = (v) => {
      if (!has(v)) return 0;
      return v <= 0 ? 100 : Math.round((best / v) * 100);
    };
    return [width(a), width(b)];
  }
  const max = metric.max ?? Math.max(a ?? 0, b ?? 0);
  const width = (v) => (!has(v) || !max ? 0 : Math.round(Math.min(100, (v / max) * 100)));
  return [width(a), width(b)];
}

// Categories won by each side, plus ties.
export function computeScore(me, friend) {
  const score = { me: 0, friend: 0, tie: 0 };
  METRICS.forEach((m) => {
    const winner = decide(m.better, me[m.key], friend[m.key]);
    if (winner) score[winner] += 1;
  });
  return score;
}

export function hasAnyGames(me, friend) {
  return me.games_played > 0 || friend.games_played > 0;
}

// ---------- continents ----------

// Territories played per continent, for the continents where anyone has played.
export function compareContinents(countries) {
  const byName = {};
  countries.forEach((c) => {
    const name = resolveContinent(c.country_name);
    if (!byName[name]) byName[name] = { name, me: 0, friend: 0 };
    if (c.me) byName[name].me += 1;
    if (c.friend) byName[name].friend += 1;
  });
  const names = CONTINENT_ORDER.filter((n) => byName[n])
    .concat(Object.keys(byName).filter((n) => !CONTINENT_ORDER.includes(n)));
  return names.map((n) => byName[n]);
}

// ---------- countries ----------

const pctOf = (side) => (side ? side.best_percentage : null);

// Same rule as a "best score": higher % wins, and on a tie the faster time.
export function countryWinner(c) {
  if (c.me && !c.friend) return 'me';
  if (!c.me && c.friend) return 'friend';
  if (!c.me && !c.friend) return null;
  const byPct = decide('high', c.me.best_percentage, c.friend.best_percentage);
  if (byPct !== 'tie') return byPct;
  if (has(c.me.best_time_seconds) && has(c.friend.best_time_seconds)) {
    return decide('low', c.me.best_time_seconds, c.friend.best_time_seconds);
  }
  return 'tie';
}

export function countryGap(c) {
  return Math.abs((pctOf(c.me) ?? 0) - (pctOf(c.friend) ?? 0));
}

export const COUNTRY_FILTERS = [
  { id: 'all', label: () => 'All', test: () => true },
  { id: 'both', label: () => 'Both played', test: (c) => c.me && c.friend },
  { id: 'me', label: () => 'Only you', test: (c) => c.me && !c.friend },
  { id: 'friend', label: (name) => `Only ${name}`, test: (c) => !c.me && c.friend },
];

export function filterCountries(countries, filterId) {
  const filter = COUNTRY_FILTERS.find((f) => f.id === filterId) || COUNTRY_FILTERS[0];
  return countries.filter((c) => Boolean(filter.test(c)));
}

// `displayName` turns the backend name into what the player sees (English).
export function sortCountries(countries, sortId, displayName) {
  const byName = (a, b) => displayName(a.country_name).localeCompare(displayName(b.country_name));
  return countries.slice().sort(sortId === 'name' ? byName : (a, b) => countryGap(b) - countryGap(a) || byName(a, b));
}

// ---------- regions (inside one country) ----------

// Regions with data for at least one side; those where both have attempts
// come first, biggest difference first.
export function sortRegions(regions) {
  const gap = (r) => Math.abs(r.me.accuracy - r.friend.accuracy);
  const both = (r) => Boolean(r.me && r.friend);
  return regions
    .filter((r) => r.me || r.friend)
    .sort((a, b) => {
      if (both(a) !== both(b)) return both(a) ? -1 : 1;
      if (both(a)) return gap(b) - gap(a) || a.region_name.localeCompare(b.region_name);
      return a.region_name.localeCompare(b.region_name);
    });
}

export function summarizeRegions(regions) {
  const out = { me: 0, friend: 0, tie: 0, meOnly: 0, friendOnly: 0 };
  regions.forEach((r) => {
    if (r.me && r.friend) {
      const winner = decide('high', r.me.accuracy, r.friend.accuracy);
      out[winner] += 1;
    } else if (r.me) {
      out.meOnly += 1;
    } else if (r.friend) {
      out.friendOnly += 1;
    }
  });
  return out;
}
