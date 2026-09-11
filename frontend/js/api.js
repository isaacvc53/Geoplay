// js/api.js
// Todas las llamadas al backend pasan por aquí. Ninguna página debe hacer
// fetch(...) directamente contra el backend: así, si cambia una ruta o
// tenemos que añadir el token de autenticación más adelante (fase 5),
// se toca en un único sitio.

const api = {
  async _get(path) {
    const res = await fetch(`${GEOPLAY_CONFIG.API_BASE}${path}`);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  // GET /countries/{pais}/regions/names
  // -> [{ region_id, names: [...] }, ...]
  getRegionsNames(countrySlug) {
    return this._get(`/countries/${encodeURIComponent(countrySlug)}/regions/names`);
  },

  // GET /regions/check?country=X&name=Y
  // -> { encontrado: true, region_id, name } | { encontrado: false }
  checkRegionName(countrySlug, guess) {
    return this._get(
      `/regions/check?country=${encodeURIComponent(countrySlug)}&name=${encodeURIComponent(guess)}`
    );
  },

  // GET /countries
  getCountries() {
    return this._get(`/countries`);
  },

  // GET /countries/{pais}
  getCountry(countrySlug) {
    return this._get(`/countries/${encodeURIComponent(countrySlug)}`);
  },
};
