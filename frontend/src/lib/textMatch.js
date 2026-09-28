// src/lib/textMatch.js
// Text normalization and local emergency matching.
// The "real" validation is ALWAYS done by the backend (api.checkRegionName);
// this is only used as a safety net if the backend doesn't respond
// (see localMode in CountryGamePage).

export function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'.,()_/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// regions: [{ id, names: [...] }, ...]
export function findLocalGuess(regions, raw) {
  const q = normalizeText(raw);
  if (!q) return null;

  const exact = regions.filter((r) => (r.names || []).some((n) => normalizeText(n) === q));
  if (exact.length === 1) return exact[0];

  const qTokens = q.split(' ').filter(Boolean);
  if (qTokens.some((t) => t.length < 3)) return null;

  const hits = regions.filter((r) =>
    (r.names || []).some((name) => {
      const tokens = normalizeText(name).split(' ');
      return qTokens.every((qt) => tokens.some((t) => t === qt || t.startsWith(qt)));
    })
  );
  return hits.length === 1 ? hits[0] : null;
}

// Unlike findLocalGuess (which also accepts 3+ letter prefixes when they
// identify a single region), this variant ONLY accepts the full name.
// Used for the "as you type" live check, so typing "kab" doesn't already
// mark "Kabul" solved before the player finishes typing it.
export function findExactLocalMatch(regionsList, raw) {
  const q = normalizeText(raw);
  if (!q) return null;
  const exact = regionsList.filter((r) => (r.names || []).some((n) => normalizeText(n) === q));
  return exact.length === 1 ? exact[0] : null;
}
