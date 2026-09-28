// src/lib/config.js
// The single place where the backend URL lives.
// When you deploy Geotaria to a real domain, change ONLY this line
// (or better, set VITE_API_BASE in a .env file — see below).
export const GEOTARIA_CONFIG = {
  API_BASE:
    import.meta.env.VITE_API_BASE ||
    (['127.0.0.1', 'localhost'].includes(window.location.hostname)
      ? 'http://127.0.0.1:8000'
      : '/api'),
};
