// src/lib/countryData.js
// Carga data/countries/<slug>.js inyectando un <script> que define
// window.GEOTARIA_COUNTRY (los ~197 archivos de datos siguen funcionando tal cual).

import { slugCandidates } from './countryText';

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => { el.remove(); resolve(); };
    el.onerror = () => { el.remove(); reject(new Error(`No se pudo cargar ${src}`)); };
    document.body.appendChild(el);
  });
}

// Prueba el slug tal cual y su equivalente inglés (paises.html enlaza con el
// slug del nombre ESPAÑOL; los archivos pueden estar con cualquiera de los dos).
// Devuelve { country, slug } o lanza si ninguno existe.
export async function loadCountryData(pais) {
  for (const slug of slugCandidates(pais)) {
    delete window.GEOTARIA_COUNTRY;
    try {
      // Sin ?v=Date.now(): nginx sirve /data/ con revalidación (ETag), así que el
      // navegador solo vuelve a descargar el archivo si ha cambiado de verdad.
      await injectScript(`/data/countries/${encodeURIComponent(slug)}.js`);
    } catch {
      continue;
    }
    const country = window.GEOTARIA_COUNTRY;
    delete window.GEOTARIA_COUNTRY;
    if (country) return { country, slug };
  }
  throw new Error(`data/countries/${pais}.js does not exist`);
}

// El SVG es /data/geo/<slug>.svg, con el slug del archivo .js que se cargó. Se ignora
// country.geoFile salvo que sea una URL absoluta: algunos archivos lo tenían con otro
// nombre (ivory-coast.svg, czech-republic.svg…) que no existe y el mapa no cargaba.
export function resolveGeoUrl(country, slug) {
  const file = country.geoFile;
  if (file && /^(https?:)?\/\//.test(file)) return file;
  return `/data/geo/${encodeURIComponent(slug)}.svg`;
}
