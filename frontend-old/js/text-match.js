// js/text-match.js
// Text normalization and local emergency matching.
// The "real" validation is ALWAYS done by the backend (api.checkRegionName);
// this is only used as a safety net if the backend doesn't respond
// (see localMode in js/game.js).

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'.,()_/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// regions: [{ id, names: [...] }, ...]
function findLocalGuess(regions, raw) {
  const q = normalizeText(raw);
  if (!q) return null;

  const exact = regions.filter((r) =>
    (r.names || []).some((n) => normalizeText(n) === q)
  );
  if (exact.length === 1) return exact[0];

  const qTokens = q.split(" ").filter(Boolean);
  if (qTokens.some((t) => t.length < 3)) return null;

  const hits = regions.filter((r) =>
    (r.names || []).some((name) => {
      const tokens = normalizeText(name).split(" ");
      return qTokens.every((qt) => tokens.some((t) => t === qt || t.startsWith(qt)));
    })
  );
  return hits.length === 1 ? hits[0] : null;
}
