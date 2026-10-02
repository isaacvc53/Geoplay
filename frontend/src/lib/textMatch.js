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
// `solved` (Set de ids, opcional): si el nombre lo comparten varias regiones,
// se ignoran las ya acertadas (p. ej. "Zagreb" cuando una de las dos ya está).
export function findExactLocalMatch(regionsList, raw, solved) {
  const q = normalizeText(raw);
  if (!q) return null;
  let exact = regionsList.filter((r) => (r.names || []).some((n) => normalizeText(n) === q));
  if (exact.length > 1 && solved) {
    const pending = exact.filter((r) => !solved.has(r.id));
    if (pending.length === 1) exact = pending;
  }
  return exact.length === 1 ? exact[0] : null;
}

// ¿Hay OTRA región sin acertar cuyo nombre empieza por lo escrito pero es más largo?
// Ej.: "Mato Grosso" -> "Mato Grosso do Sul", "Sudán" -> "Sudán del Sur".
// Si es así, el autoacierto debe esperar un poco por si el jugador sigue escribiendo.
export function hasLongerCandidate(regionsList, region, raw, solved) {
  const q = normalizeText(raw);
  if (!q) return false;
  return regionsList.some((r) =>
    r !== region &&
    !(solved && solved.has(r.id)) &&
    (r.names || []).some((n) => {
      const nn = normalizeText(n);
      return nn.length > q.length && nn.startsWith(q);
    })
  );
}

// Como hasLongerCandidate, pero devuelve CUÁNTO esperar (ms) antes de autoacertar:
//   0        -> ningún otro nombre empieza por lo escrito: acierto inmediato.
//   wordMs   -> el otro nombre sigue con OTRA PALABRA ("Sudán" -> "Sudán del Sur"):
//               el jugador tiene que teclear un espacio y seguir, damos más margen.
//   partMs   -> el otro nombre solo alarga la palabra ("Sur" -> "Suroeste"): si va a
//               seguir escribiendo, la siguiente letra llega enseguida, así que basta
//               una espera corta y el acierto no se siente "colgado".
export function longerCandidateWait(regionsList, region, raw, solved, wordMs = 900, partMs = 500) {
  const q = normalizeText(raw);
  if (!q) return 0;
  let wait = 0;
  for (const r of regionsList) {
    if (r === region || (solved && solved.has(r.id))) continue;
    for (const n of r.names || []) {
      const nn = normalizeText(n);
      if (nn.length > q.length && nn.startsWith(q)) {
        if (nn[q.length] === ' ') return wordMs;
        wait = partMs;
      }
    }
  }
  return wait;
}
