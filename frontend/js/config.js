// js/config.js
// The single place where the backend URL lives.
// When you deploy Geotaria to a real domain, change ONLY this line.
const GEOTARIA_CONFIG = {
  API_BASE: ["127.0.0.1", "localhost"].includes(location.hostname)
    ? "http://127.0.0.1:8000"
    : "/api",
};