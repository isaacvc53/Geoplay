// src/lib/api.js
// All calls to the backend go through here — same contract as the
// original js/api.js, just ported to an ES module. No component should
// call fetch(...) directly against the backend.

import { GEOTARIA_CONFIG } from './config';

const TOKEN_KEY = 'geotaria_token';

// Called by AuthContext when a 401 forces a logout, so it can redirect
// with react-router instead of a hard window.location change.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export const api = {
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

  _handleUnauthorized() {
    this._clearToken();
    if (unauthorizedHandler) unauthorizedHandler();
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  // --- Geography ---

  getRegionsNames(countrySlug) {
    return this._get(`/countries/${encodeURIComponent(countrySlug)}/regions/names`);
  },

  checkRegionName(countrySlug, guess) {
    return this._get(
      `/regions/check?country=${encodeURIComponent(countrySlug)}&name=${encodeURIComponent(guess)}`
    );
  },

  getCountries() {
    return this._get(`/countries`);
  },

  getCountry(countrySlug) {
    return this._get(`/countries/${encodeURIComponent(countrySlug)}`);
  },

  // --- Authentication ---

  register(email, username, password) {
    return this._post(`/auth/register`, { email, username, password });
  },

  async login(email, password) {
    const body = new URLSearchParams();
    body.append('username', email); // the backend uses "username" as the email
    body.append('password', password);

    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  getCurrentUser() {
    return this._get(`/auth/me`);
  },

  // --- Progress / statistics ---

  getCountriesProgress() {
    return this._get(`/progress/countries`);
  },

  getCountryProgress(countryId) {
    return this._get(`/progress/countries/${countryId}`);
  },

  saveGameSession(countryId, timeSeconds, answers) {
    return this._post(`/progress/sessions`, {
      country_id: countryId,
      time_seconds: timeSeconds,
      answers,
    });
  },

  getRecentSessions(limit = 20) {
    return this._get(`/progress/sessions/recent?limit=${limit}`);
  },
};
