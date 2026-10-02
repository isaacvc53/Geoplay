# Multijugador: sorteo de país en el mapa mundial + auto-inicio

Copia estos archivos encima de los de tu repo (mismas rutas), o aplica el parche:
    git apply ruleta-mapa.patch

Solo frontend (no hay que reconstruir el backend).

Nuevos:
- frontend/src/lib/worldMapData.js              (carga y comparte world-map.json)
- frontend/src/pages/Match/autoStart.js         (recuerda que la sala es de "buscar rival")

Modificados:
- frontend/src/pages/Match/CountryRoulette.jsx  (ruleta sobre el mapa del mundo)
- frontend/src/pages/Match/MatchPage.jsx        (sin botón Start en buscar rival, auto-inicio 3 s)
- frontend/src/pages/Match/Match.css            (estilos del mapa; quita los de la ruleta de nombres)
- frontend/src/pages/Match/matchText.js         (QUEUE_DURATIONS)
- frontend/src/pages/Multiplayer/useMatchQueue.js (precarga el mapa mientras buscas)
- frontend/src/pages/Multiplayer/QuickMatch.jsx   (textos)

Ajustes rápidos (constantes):
- CountryRoulette.jsx: LIT_COUNT (países iluminados al inicio, 26), SPIN_MS (duración, 4200)
- MatchPage.jsx: AUTO_START_SECONDS (espera antes de empezar, 3)
