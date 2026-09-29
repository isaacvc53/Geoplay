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
    if (!res.ok) throw await this._makeError(res);
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
    if (!res.ok) throw await this._makeError(res);
    return res.json();
  },

  // Builds the Error thrown for a failed response. Besides `status`, it
  // carries `code` when the backend sent {"detail": {"code": "..."}}
  // (used by the friends endpoints so the UI can show its own message).
  async _makeError(res) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    try {
      const body = await res.json();
      const detail = body && body.detail;
      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        err.code = detail.code;
      }
    } catch {
      // response without a JSON body
    }
    return err;
  },

  async _putForm(path, formData) {
    // Sin Content-Type: el navegador lo pone con el boundary del multipart.
    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}${path}`, {
      method: 'PUT',
      headers: { ...this._authHeaders() },
      body: formData,
    });
    if (res.status === 401 && this._getToken()) {
      this._handleUnauthorized();
    }
    if (!res.ok) throw await this._makeError(res);
    return res.json();
  },

  async _delete(path) {
    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}${path}`, {
      method: 'DELETE',
      headers: { ...this._authHeaders() },
    });
    if (res.status === 401 && this._getToken()) {
      this._handleUnauthorized();
    }
    if (!res.ok) throw await this._makeError(res);
    return null; // DELETE endpoints answer 204 No Content
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

  // --- Profile photo ---

  // `blob` is the already-cropped image. Resolves with the updated user.
  uploadAvatar(blob) {
    const form = new FormData();
    form.append('archivo', blob, 'avatar.jpg');
    return this._putForm(`/auth/me/avatar`, form);
  },

  deleteAvatar() {
    return this._delete(`/auth/me/avatar`);
  },

  // The image needs the token, so an <img src> can't fetch it directly:
  // we download it as a Blob and the caller makes an object URL. null = no photo.
  async getAvatarBlob() {
    const res = await fetch(`${GEOTARIA_CONFIG.API_BASE}/auth/me/avatar`, {
      headers: { ...this._authHeaders() },
    });
    if (res.status === 401 && this._getToken()) {
      this._handleUnauthorized();
    }
    if (res.status === 404) return null;
    if (!res.ok) throw await this._makeError(res);
    return res.blob();
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

  // --- Friends ---

  // -> { friends: [...], incoming: [...], outgoing: [...] }
  getFriends() {
    return this._get(`/friends`);
  },

  // -> { status: 'pending' | 'accepted', friendship_id, username }
  sendFriendRequest(username) {
    return this._post(`/friends/requests`, { username });
  },

  acceptFriendRequest(friendshipId) {
    return this._post(`/friends/requests/${friendshipId}/accept`, {});
  },

  // Declines a received request or cancels a sent one.
  removeFriendRequest(friendshipId) {
    return this._delete(`/friends/requests/${friendshipId}`);
  },

  removeFriend(friendshipId) {
    return this._delete(`/friends/${friendshipId}`);
  },

  // --- Compare with a friend ---

  // Global stats of both players + a per-country summary. Only works with
  // accepted friends (404 { code: 'friend_not_found' } otherwise). The browser's
  // UTC offset lets the server compute streaks in the viewer's own timezone.
  getComparison(username) {
    const tz = new Date().getTimezoneOffset();
    return this._get(`/compare?with=${encodeURIComponent(username)}&tz_offset=${tz}`);
  },

  // Region-by-region accuracy of both players in one country.
  getCountryComparison(countryId, username) {
    return this._get(`/compare/countries/${countryId}?with=${encodeURIComponent(username)}`);
  },
};
