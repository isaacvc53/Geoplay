// Países del mapa mundial (public/data/world-map.json, de Natural Earth; ver tools/build-world-map.mjs) para dibujarlos como siluetas,
// p. ej. en la ruleta del sorteo de país. Se descarga UNA vez por pestaña y se comparte:
// la cola de "buscar rival" la pide por adelantado para que, al formarse la pareja, ya esté
// en la caché del navegador.
//
// -> Promise<[{ id, name, slug, d, main? }]>  (sin la Antártida, que solo ocupa sitio)
// Si falla, el siguiente intento vuelve a pedirlo.

let cached = null;

export function loadWorldMap() {
  if (!cached) {
    cached = fetch('/data/world-map.json')
      .then((res) => {
        if (!res.ok) throw new Error(`world-map.json: ${res.status}`);
        return res.json(); // si el servidor devolviera el HTML de la app, esto lanza
      })
      .then((data) => (data.countries || []).filter((c) => c.slug && c.d && c.slug !== 'antarctica'))
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}
