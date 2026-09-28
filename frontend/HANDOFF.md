# GEOTARIA — Handoff para continuar la migración a React

## Contexto
Geotaria es un juego de geografía (adivinar países / provincias sobre un mapa). Estoy migrando el frontend
de HTML + JS vanilla multipágina a **React + Vite (JavaScript, no TypeScript) + react-router-dom**.
El backend (FastAPI) NO se toca. Los mapas siguen con **D3** (imperativo, dentro de useEffect + refs;
NO reescribir el render de los mapas en JSX). Este zip es el proyecto migrado hasta ahora.

Necesitas los archivos ORIGINALES (te los paso aparte): index.html, profile.html, mapa-mundial.html,
paises.html, paises-del-mundo.html, seleccionar-modo.html, country.html, game.js, api.js, config.js,
text-match.js, afghanistan.js, generate-manifest.sh, y **css/global.css + css/game.css** (los usa
country.html y aún no se han subido: pídemelos antes de migrar el juego).

## Ya hecho (compila con `npm run build`; probado en Chromium headless, NO contra el backend real)
- Base: Vite + React + router. `src/App.jsx` con rutas; las no migradas usan `<Pending />`.
- `src/lib/api.js` (port 1:1), `config.js`, `textMatch.js` (normalizeText, findLocalGuess, findExactLocalMatch).
- `src/context/AuthContext.jsx`: `useAuth()` -> { loggedIn, user, login, register, logout }.
- `src/data/continents.js`, `src/data/worldQuiz.js` (CONTINENTES/ALIAS/ISO_POR_PAIS), `src/data/numericToIso.js`.
- `src/lib/`: `countryInfo.js` (tabla REAL `COUNTRY_INFO` copiada de profile.html; claves = nombre en español normalizado), `worldMapSlugs.js`, `availability.js`
  (manifiesto + fallback; descarta respuestas text/html por el fallback SPA), `countryData.js`
  (inyecta `/data/countries/<slug>.js` -> window.GEOTARIA_COUNTRY; prueba slug tal cual y su equivalente inglés),
  `countryText.js` (textos en ESPAÑOL del juego de país).
- Páginas migradas: Login, Register, Menu (`/`), **Mode (`/modo`)**, **WorldQuiz (`/paises-del-mundo`)**,
  **Regions (`/paises?zona=`)**, **WorldMap (`/mapa-mundial`, D3 en `WorldMapCanvas.jsx`)**,
  **Country (`/pais?pais=`, motor imperativo en `pages/Country/gameEngine.js`)**, **Profile (`/perfil`, en INGLÉS)**.
- `public/data/`: `world-topology.json`, `countries/afghanistan.js` (ejemplo), `geo/` VACÍO,
  `available-countries.json` = `[]` (hasta copiar datos y ejecutar `generate-manifest.sh`: sin él, todo el mapa sale rayado).

## Notas de la migración
- **Juego de país en español**: `countryText.js` genera los textos (título, botones, mensajes) a partir del nombre en
  español y del tipo de región (provincias, estados…). Si un archivo de datos declara `lang: "es"`, SUS textos mandan.
  Los nombres de regiones (`display`, `names`) siempre vienen del archivo.
- `gameEngine.js` captura los nodos DOM una vez (StrictMode suelta los refs antes del cleanup) y `destroy()` limpia
  intervalos, timeouts y listeners.
- Bug del original corregido: el "¡Correcto!" pisaba el mensaje de partida completada al acertar la última región.
- Se eliminó el contador de FPS de diagnóstico del mapa mundial.
- Slugs: `paises.html` enlaza con el slug del nombre en ESPAÑOL (`afganistan`), el mapa mundial con el inglés
  (`afghanistan`). `loadCountryData` prueba ambos.
- `@keyframes` son globales: `riseIn` ya existe en `Menu.css`; al migrar el perfil, renombrar el suyo (p. ej. `profRiseIn`).

## Perfil (`/perfil`) — migrado
- `pages/Profile/`: `ProfilePage.jsx` (secciones), `profileLogic.js` (lógica pura: rangos, logros, rachas, puntos
  débiles, tendencia), `CountryPicker.jsx` (buscador de país), `ProgressMap.jsx` (D3 imperativo con ref + useEffect,
  sirve para el mapa mundial y para provincias), `Profile.css` (encapsulado en `.profile-page`, `riseIn` -> `profRiseIn`).
- Datos: `getCurrentUser` + `getCountriesProgress`, y después `getRecentSessions(100)` (hidrata racha, heatmap,
  tendencia, log y el logro "On a Roll"). Sin sesión -> `<Navigate to="/login">`. Logout -> `logout()` + `/`.
- El mapa mundial usa `/data/world-topology.json` (antes parseaba mapa-mundial.html).
- Marca cambiada de "GeoPlay" a "Geotaria" para coincidir con el resto de páginas.
- Bug del original corregido: el tooltip del mapa mundial usaba una variable `rect` inexistente en `mouseenter`.
- `loadCountryTopology` (mapa de provincias en "Weak & strong spots") sigue siendo un STUB que lanza error, como en el
  original: al elegir un país se muestra "Province map for this territory isn't wired up yet." (ver Pendiente).

## Pendiente
Todas las páginas están migradas. Falta lo siguiente (no es código de páginas):
1. **Datos**: copiar `data/countries/*.js` y `data/geo/*.svg` a `public/data/…` y ejecutar `bash generate-manifest.sh`
   dentro de `public/data` (sin ellos, casi ningún país es jugable y el mapa mundial sale rayado).
2. **Mapa de provincias del perfil**: rellenar `loadCountryTopology` en `pages/Profile/profileLogic.js` para que
   devuelva `{ topology, objectKey }` (los SVG de provincias ya viven en `public/data/geo` / `countries/<slug>.js`).
3. **Probar contra el backend real** (CORS desde `localhost:5173`, `VITE_API_BASE`). Hasta ahora solo se ha probado
   con Chromium headless y con tests de la lógica; `npm run build` no se ha podido ejecutar en el entorno del asistente.

## Convenciones (IMPORTANTE)
1. **CSS encapsulado por página.** Todas las páginas se cargan en una sola app, así que los `:root` y clases
   genéricas (.brand, .panel, .card…) chocarían. Cada página lleva su CSS bajo una clase raíz
   (`.menu-page`, `.auth-page`, …). Se genera con `tools/scope_css.py`:
   ```python
   import re, sys; sys.path.insert(0,'tools'); from scope_css import scope
   css = re.search(r'<style>(.*?)</style>', open('original.html',encoding='utf-8').read(), re.S).group(1)
   open('src/pages/X/X.css','w',encoding='utf-8').write(scope(css,'x-page'))
   ```
   (`:root`/`html`/`body` pasan a `&`; los @keyframes quedan globales.) El componente raíz debe tener
   `<div className="x-page">`. Lo que estaba en `body` (color, fondo, fuente) ahora va en el wrapper.
2. Enlaces: `index.html` -> `/`, `pages/country.html?pais=X` -> `/pais?pais=X`, `login.html` -> `/login`,
   `profile.html` -> `/perfil`, `pages/mapa-mundial.html` -> `/mapa-mundial`, `seleccionar-modo.html` -> `/modo`.
   Usar `<Link>`; evitar `<a>` anidados dentro de `<a>`.
3. Mantener el idioma tal cual (quizzes de mundo en español, resto en inglés).
4. Quitar `<Pending />` de `src/App.jsx` al terminar cada ruta. Ejecutar `npm run build` tras cada página.
5. Archivos originales con líneas enormes (JSON/SVG embebidos): NO los imprimas enteros; extrae con
   python/grep. (Ej.: el SVG decorativo del menú está en `src/pages/Menu/worldPaths.js`, 1,2 MB, cargado con
   import() dinámico.)

## Despliegue (recordatorio)
`npm run build` -> `dist/`. Servir con fallback SPA (nginx: `try_files $uri $uri/ /index.html;`) y `/api`
apuntando al backend. Datos de países: copiar `data/countries/*.js` y `data/geo/*.svg` a `public/data/…`
y ejecutar `bash generate-manifest.sh` dentro de `public/data`.
