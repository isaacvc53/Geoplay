# Geotaria (React + Vite)

    npm install
    npm run dev

## Migrado
- `src/lib/api.js`, `config.js`, `textMatch.js` (puertos 1:1 de los .js originales)
- `src/context/AuthContext.jsx` (login / register / logout / usuario)
- `src/data/continents.js` (datos de paises.html)
- `src/lib/countryInfo.js` (tabla COUNTRY_INFO de profile.html: slug / nombre / continente)
- Login y Registro
- Menu (`/`): topbar, drawers (amigos / logros / cuenta), hero, estadisticas del usuario
- `public/data/world-topology.json` (extraido de mapa-mundial.html)

## Pendiente
Todas las rutas están migradas (incluido `/perfil`). Falta copiar los datos de países (ver abajo) y conectar
`loadCountryTopology` en `src/pages/Profile/profileLogic.js` (mapa de provincias del perfil).

## Datos de paises
Copia tus `data/countries/*.js` a `public/data/countries/` y tus `data/geo/*.svg`
a `public/data/geo/` sin cambiarlos. Luego regenera el manifest:
`cd public/data && bash generate-manifest.sh`

## Backend
Variable opcional `VITE_API_BASE` en `.env` (por defecto http://127.0.0.1:8000 en local, `/api` en produccion).

## CSS
Cada pagina tiene su CSS encapsulado bajo una clase raiz (`.menu-page`, `.auth-page`...) para que
las variables `:root` y clases genericas (`.brand`, `.panel`...) de unas paginas no pisen a las otras.
Al migrar una pagina nueva, usa el mismo patron.

## Modo «Subdivisiones del mundo» (`/regiones-del-mundo`)
Juego de escribir provincias, estados y regiones de todo el mundo (o de un continente). Sin backend: el progreso
se guarda en `localStorage` (`geotaria.worldRegions.v1`).
- Datos: `public/data/world-admin1.topojson` (Natural Earth admin-1 10m, simplificado; 4.289 regiones, 251 territorios).
  Se regenera con `tools/build_world_admin1.py` (necesita `ne_10m_admin_1_states_provinces.shp`, `pyshp` y `npm i mapshaper`).
  Italia, España, Francia y Filipinas se funden por el campo `region` para quedarse en su primer nivel oficial
  (edita `MERGE` en el script para añadir/quitar países). Los alias en español salen de `backend/nombres_es_regiones.json`.
- Código: `src/lib/worldRegions.js` (lógica), `src/pages/WorldRegions/` (página, `mapEngine.js` en D3, CSS).
- Si varias regiones comparten nombre (p. ej. «Central»), se rellenan todas a la vez.
