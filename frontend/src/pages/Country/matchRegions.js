// Casa las regiones del backend (region_id + nombres) con las regiones locales del archivo
// del país (id del SVG + nombres). Función pura, sin DOM: gameEngine.js la usa en loadRegions().
//
// Por qué no es un simple "la primera local que comparta un nombre":
//   - Hay nombres repetidos entre regiones distintas (en Croacia "Zagreb" es a la vez
//     "Zagreb County" y "City of Zagreb"; en Estonia hay dos "Tartu"...). Con un find()
//     simple las dos regiones del backend caían en la MISMA local: una se quedaba sin
//     region_id (no se podía pintar al acertarla) y la otra recibía el id equivocado.
//   - Ahora cada región del backend elige la local con MÁS nombres en común, y una local ya
//     asignada no se vuelve a usar. Si hay empate (nombres idénticos, como los dos "Rakvere")
//     se sigue el orden de ids del backend, que es el orden en que el seed leyó el archivo.
//
// normalize: la función de normalización de texto (lib/textMatch).
// Muta `regions` (region_id y nombres que solo conoce el backend), igual que antes.
export function matchBackendRegions(regions, backendRegions, normalize) {
  const keysOf = (names) => new Set((names || []).map(normalize).filter(Boolean));
  const localKeys = regions.map((r) => keysOf(r.names));
  const taken = new Set(); // índices de `regions` ya asignados

  const ordered = [...(backendRegions || [])].sort((a, b) => a.region_id - b.region_id);

  ordered.forEach((backendRegion) => {
    const backendKeys = keysOf(backendRegion.names);

    let best = -1;
    let bestShared = 0;
    regions.forEach((_, i) => {
      if (taken.has(i)) return;
      let shared = 0;
      localKeys[i].forEach((k) => { if (backendKeys.has(k)) shared += 1; });
      if (shared > bestShared) {
        best = i;
        bestShared = shared;
      }
    });
    if (best < 0) return;

    taken.add(best);
    const local = regions[best];
    local.region_id = backendRegion.region_id;

    // Añade los nombres que solo conoce el backend (español, alias...): así el
    // autoacierto al teclear también los reconoce, no solo el botón Check.
    const known = localKeys[best];
    (backendRegion.names || []).forEach((n) => {
      const key = normalize(n);
      if (n && key && !known.has(key)) {
        (local.names = local.names || []).push(n);
        known.add(key);
      }
    });
  });
}
