// js/api.js
// All calls to the backend go through here. No page should make
// fetch(...) directly against the backend: that way, if a route changes or
// we need to add the auth token later on (phase 5),
// it's touched in a single place.

const TOKEN_KEY = "geotaria_token";

const api = {
  // --- Internal helpers ---

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

  // If the token expired or is invalid, clear the session and send
  // the user to sign in again (unless they're already there).
  _handleUnauthorized() {
    this._clearToken();
    const page = window.location.pathname.split("/").pop();
    if (page !== "login.html" && page !== "register.html") {
      window.location.href = "login.html?expired=1";
    }
  },

  async _get(path) {
    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}${path}`, {
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
    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}${path}`, {
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

  // --- Geography (already existing) ---

  // GET /countries/{country}/regions/names
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

  // GET /countries/{country}
  getCountry(countrySlug) {
    return this._get(`/countries/${encodeURIComponent(countrySlug)}`);
  },

  // --- Authentication (new) ---

  // POST /auth/register (JSON: { email, username, password })
  register(email, username, password) {
    return this._post(`/auth/register`, { email, username, password });
  },

  // POST /auth/login
  // NOTE: this endpoint expects form-urlencoded (OAuth2PasswordRequestForm),
  // not JSON, so it can't use _post. Saves the token if login succeeds.
  async login(email, password) {
    const body = new URLSearchParams();
    body.append("username", email); // the backend uses "username" as the email
    body.append("password", password);

    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}/auth/login`, {
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

  // GET /auth/me (protected route)
  getCurrentUser() {
    return this._get(`/auth/me`);
  },

  // --- Progress / statistics (new) ---

  // GET /progress/countries (protected route)
  // -> [{ country_id, country_name, total_regions, percentage, games_played,
  //       best_score: {...} | null, regions: [{ region_id, region_name, attempts, correct, accuracy }] }, ...]
  getCountriesProgress() {
    return this._get(`/progress/countries`);
  },

  // GET /progress/countries/{id} (protected route)
  getCountryProgress(countryId) {
    return this._get(`/progress/countries/${countryId}`);
  },

  // POST /progress/sessions (protected route)
  // answers: [{ region_id, correct }, ...]
  saveGameSession(countryId, timeSeconds, answers) {
    return this._post(`/progress/sessions`, {
      country_id: countryId,
      time_seconds: timeSeconds,
      answers,
    });
  },

  // NEW: GET /progress/sessions/recent?limit=N (protected route)
  // -> [{ id, country_id, country_name, country_slug, total_regions,
  //       correct_regions, percentage, time_seconds, played_at }, ...]
  // Most recent first. Feeds the activity feed and the profile's
  // progress chart.
  getRecentSessions(limit = 20) {
    return this._get(`/progress/sessions/recent?limit=${limit}`);
  },
};
