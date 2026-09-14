// js/api.js
// Todas las llamadas al backend pasan por aquí. Ninguna página debe hacer
// fetch(...) directamente contra el backend: así, si cambia una ruta o
// tenemos que añadir el token de autenticación más adelante (fase 5),
// se toca en un único sitio.

const TOKEN_KEY = "geoplay_token";

const api = {
  // --- Helpers internos ---

  _getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  _setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  _clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  _authHeaders() {
    const token = this._getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Si el token caducó o es inválido, limpiamos sesión y mandamos
  // al usuario a iniciar sesión de nuevo (salvo que ya esté ahí).
  _handleUnauthorized() {
    this._clearToken();
    const page = window.location.pathname.split("/").pop();
    if (page !== "login.html" && page !== "register.html") {
      window.location.href = "login.html?expired=1";
    }
  },

  async _get(path) {
    const res = await fetch(`${GEOPLAY_CONFIG.API_BASE}${path}`, {
      headers: { ...this._authHeaders() },
    });
    if (res.status === 401 && this._getToken()) {
      this._handleUnauthorized();
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  async _post(path, body) {
    const res = await fetch(`${GEOPLAY_CONFIG.API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this._authHeaders(),
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401 && this._getToken()) {
      this._handleUnauthorized();
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  // --- Geografía (ya existentes) ---

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

  // --- Autenticación (nuevo) ---

  // POST /auth/register (JSON: { email, username, password })
  register(email, username, password) {
    return this._post(`/auth/register`, { email, username, password });
  },

  // POST /auth/login
  // OJO: este endpoint espera form-urlencoded (OAuth2PasswordRequestForm),
  // no JSON, así que no puede usar _post. Guarda el token si el login va bien.
  async login(email, password) {
    const body = new URLSearchParams();
    body.append("username", email); // el backend usa "username" como email
    body.append("password", password);

    const res = await fetch(`${GEOPLAY_CONFIG.API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    this._setToken(data.access_token);
    return data;
  },

  logout() {
    this._clearToken();
  },

  isLoggedIn() {
    return Boolean(this._getToken());
  },

  // GET /auth/me (ruta protegida)
  getCurrentUser() {
    return this._get(`/auth/me`);
  },

  // --- Progreso / estadísticas (nuevo) ---

  // GET /progress/countries (ruta protegida)
  // -> [{ country_id, country_name, total_regions, percentage, games_played,
  //       best_score: {...} | null, regions: [{ region_id, region_name, attempts, correct, accuracy }] }, ...]
  getCountriesProgress() {
    return this._get(`/progress/countries`);
  },

  // GET /progress/countries/{id} (ruta protegida)
  getCountryProgress(countryId) {
    return this._get(`/progress/countries/${countryId}`);
  },

  // POST /progress/sessions (ruta protegida)
  // answers: [{ region_id, correct }, ...]
  saveGameSession(countryId, timeSeconds, answers) {
    return this._post(`/progress/sessions`, {
      country_id: countryId,
      time_seconds: timeSeconds,
      answers,
    });
  },

  // NUEVO: GET /progress/sessions/recent?limit=N (ruta protegida)
  // -> [{ id, country_id, country_name, country_slug, total_regions,
  //       correct_regions, percentage, time_seconds, played_at }, ...]
  // Más recientes primero. Alimenta el feed de actividad y la gráfica
  // de evolución del perfil.
  getRecentSessions(limit = 20) {
    return this._get(`/progress/sessions/recent?limit=${limit}`);
  },
};
