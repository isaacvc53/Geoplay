// Qué países tienen ya mapa + datos de juego.
// Camino rápido: /data/available-countries.json (lo genera generate-manifest.sh
// en el despliegue) -> UNA petición. Si no existe, se comprueba país por país.
// El resultado se cachea en sessionStorage durante la sesión de la pestaña.

const DATA_JS_DIR = '/data/countries/';
const DATA_SVG_DIR = '/data/geo/';
const REQUIRE_BOTH_FILES = true; // true: hacen falta el .js Y el .svg
const FILE_CHECK_TIMEOUT_MS = 4000;
const AVAILABILITY_CACHE_KEY = 'geoplay:available-countries';

// OJO (específico de SPA): con el fallback `try_files ... /index.html` (nginx) o
// el de Vite en desarrollo, un archivo inexistente responde 200 con el HTML de
// la app. Por eso, además de res.ok, se descarta cualquier respuesta text/html.
function isRealFile(res) {
  if (!res.ok) return false;
  const type = (res.headers.get('content-type') || '').toLowerCase();
  return !type.includes('text/html');
}

// HEAD (no descarga el contenido); si el servidor no lo soporta, GET.
async function fileExists(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FILE_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      const res2 = await fetch(url, { method: 'GET', cache: 'no-store', signal: controller.signal });
      return isRealFile(res2);
    }
    return isRealFile(res);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function countryHasMap(slug) {
  if (!slug) return false;
  if (!REQUIRE_BOTH_FILES) return fileExists(`${DATA_JS_DIR}${slug}.js`);
  const [jsOk, svgOk] = await Promise.all([
    fileExists(`${DATA_JS_DIR}${slug}.js`),
    fileExists(`${DATA_SVG_DIR}${slug}.svg`),
  ]);
  return jsOk && svgOk;
}

// Lanza las comprobaciones por lotes (concurrency) para no disparar 240+ a la vez.
async function findAvailableSlow(slugs, concurrency = 16) {
  const available = new Set();
  let i = 0;
  async function worker() {
    while (i < slugs.length) {
      const slug = slugs[i++];
      if (slug && (await countryHasMap(slug))) available.add(slug);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, slugs.length) }, worker));
  return available;
}

// slugs: todos los slugs candidatos del mapa (solo se usan en el camino lento).
export async function findAvailableCountries(slugs) {
  try {
    const cached = sessionStorage.getItem(AVAILABILITY_CACHE_KEY);
    if (cached) return new Set(JSON.parse(cached));
  } catch {
    // sessionStorage no disponible (modo privado…): sin caché.
  }

  let available;
  try {
    const res = await fetch('/data/available-countries.json', { cache: 'no-store' });
    if (isRealFile(res)) {
      const list = await res.json();
      if (Array.isArray(list)) available = new Set(list);
    }
  } catch (err) {
    console.warn('No manifest found (available-countries.json), checking country by country', err);
  }
  if (!available) available = await findAvailableSlow(slugs);

  try {
    sessionStorage.setItem(AVAILABILITY_CACHE_KEY, JSON.stringify([...available]));
  } catch {
    // sin caché
  }
  return available;
}
