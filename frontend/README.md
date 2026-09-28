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
