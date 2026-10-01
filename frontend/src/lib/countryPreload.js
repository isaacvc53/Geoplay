// src/lib/countryPreload.js
// Downloads everything a country map needs (data/countries/<slug>.js and the SVG)
// BEFORE it is needed, and keeps the result for the rest of the session. The
// multiplayer room calls it as soon as the country is drawn, so when the countdown
// ends the map is already on this device.
//
// The result is { country, slug, geoUrl }. `geoUrl` points to a local copy of the SVG
// (a blob: URL), so createGame({ geoUrl }) can fetch() it with no network at all.

import { loadCountryData, resolveGeoUrl } from './countryData';

const PRELOAD_TIMEOUT_MS = 20000;
const cache = new Map(); // pais -> Promise<{ country, slug, geoUrl }>

async function download(pais) {
  const { country, slug } = await loadCountryData(pais);

  const url = resolveGeoUrl(country, slug);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}: HTTP ${res.status}`);
  const svgText = await res.text();
  // With the SPA fallback a missing file answers 200 with the app's HTML.
  if (!/<svg[\s>]/i.test(svgText)) throw new Error(`${url} is not an SVG`);

  const geoUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  return { country, slug, geoUrl };
}

// Idempotent: calling it again for the same country (React StrictMode, a second
// component, a retry) shares the same download. A failure is never cached.
export function preloadCountry(pais) {
  let promise = cache.get(pais);
  if (promise) return promise;

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out loading the map')), PRELOAD_TIMEOUT_MS);
  });
  promise = Promise.race([download(pais), timeout]).finally(() => clearTimeout(timer));
  cache.set(pais, promise);
  promise.catch(() => {
    if (cache.get(pais) === promise) cache.delete(pais);
  });
  return promise;
}
