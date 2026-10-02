# Multijugador: ver los dos mapas

Copia estos archivos encima de los de tu repo (mismas rutas), o aplica el parche:
    git apply multijugador-dos-mapas.patch

Backend (endpoint nuevo GET /matches/{id}/rival -> { "region_ids": [...] }):
- backend/models/match.py
- backend/services/match_service.py
- backend/routes/matches.py
- backend/tests/test_match_play.py   (3 tests nuevos)

Frontend:
- frontend/src/lib/api.js
- frontend/src/pages/Country/gameEngine.js
- frontend/src/pages/Country/CountryGame.jsx
- frontend/src/pages/Match/PlayScreen.jsx
- frontend/src/pages/Match/MatchPlay.css

Hay que reconstruir el backend (docker compose up -d --build) porque hay un endpoint nuevo.
