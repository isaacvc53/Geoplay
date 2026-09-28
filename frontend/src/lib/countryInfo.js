// src/lib/countryInfo.js
//
// Fuente única por país, indexada por el nombre en ESPAÑOL normalizado tal como
// lo guarda el backend (Country.nombre). Copiada de profile.html (COUNTRY_INFO).
//   - en:        nombre en inglés que se muestra al jugador
//   - slug:      Country.slug real, para enlazar a /pais?pais=<slug>
//   - topo:      nombre usado por el topojson del mundo (para emparejar el mapa)
//   - continent: continente
// TODO: cuando /countries/progress devuelva `slug` y nombre en inglés, esta tabla sobra.
// Mantener sincronizada con los seed_*.py al añadir países.

export const COUNTRY_INFO = {
  "espana":          { en: "Spain",          slug: "espana",        topo: "spain",                  continent: "Europe" },
  "francia":         { en: "France",         slug: "francia",       topo: "france",                 continent: "Europe" },
  "alemania":        { en: "Germany",        slug: "alemania",      topo: "germany",                continent: "Europe" },
  "italia":          { en: "Italy",          slug: "italia",        topo: "italy",                  continent: "Europe" },
  "portugal":        { en: "Portugal",       slug: "portugal",      topo: "portugal",               continent: "Europe" },
  "reino unido":     { en: "United Kingdom", slug: "reino-unido",   topo: "united kingdom",          continent: "Europe" },
  "paises bajos":    { en: "Netherlands",    slug: "paises-bajos",  topo: "netherlands",             continent: "Europe" },
  "holanda":         { en: "Netherlands",    slug: "paises-bajos",  topo: "netherlands",             continent: "Europe" },
  "belgica":         { en: "Belgium",        slug: "belgica",       topo: "belgium",                 continent: "Europe" },
  "suiza":           { en: "Switzerland",    slug: "suiza",         topo: "switzerland",             continent: "Europe" },
  "austria":         { en: "Austria",        slug: "austria",       topo: "austria",                 continent: "Europe" },
  "polonia":         { en: "Poland",         slug: "polonia",       topo: "poland",                  continent: "Europe" },
  "grecia":          { en: "Greece",         slug: "grecia",        topo: "greece",                  continent: "Europe" },
  "turquia":         { en: "Turkey",         slug: "turquia",       topo: "turkey",                  continent: "Asia" },
  "rusia":           { en: "Russia",         slug: "rusia",         topo: "russia",                  continent: "Asia" },
  "china":           { en: "China",          slug: "china",         topo: "china",                   continent: "Asia" },
  "japon":           { en: "Japan",          slug: "japon",         topo: "japan",                   continent: "Asia" },
  "india":           { en: "India",          slug: "india",         topo: "india",                   continent: "Asia" },
  "australia":       { en: "Australia",      slug: "australia",     topo: "australia",               continent: "Oceania" },
  "marruecos":       { en: "Morocco",        slug: "marruecos",     topo: "morocco",                 continent: "Africa" },
  "egipto":          { en: "Egypt",          slug: "egipto",        topo: "egypt",                   continent: "Africa" },
  "sudafrica":       { en: "South Africa",   slug: "sudafrica",     topo: "south africa",             continent: "Africa" },

  "argentina":       { en: "Argentina",      slug: "argentina",     topo: "argentina",               continent: "Americas" },
  "chile":           { en: "Chile",          slug: "chile",         topo: "chile",                   continent: "Americas" },
  "colombia":        { en: "Colombia",       slug: "colombia",      topo: "colombia",                continent: "Americas" },
  "brasil":          { en: "Brazil",         slug: "brazil",        topo: "brazil",                  continent: "Americas" },
  "peru":            { en: "Peru",           slug: "peru",          topo: "peru",                    continent: "Americas" },
  "bolivia":         { en: "Bolivia",        slug: "bolivia",       topo: "bolivia",                 continent: "Americas" },
  "ecuador":         { en: "Ecuador",        slug: "ecuador",       topo: "ecuador",                 continent: "Americas" },
  "paraguay":        { en: "Paraguay",       slug: "paraguay",      topo: "paraguay",                continent: "Americas" },
  "uruguay":         { en: "Uruguay",        slug: "uruguay",       topo: "uruguay",                 continent: "Americas" },
  "venezuela":       { en: "Venezuela",      slug: "venezuela",     topo: "venezuela",                continent: "Americas" },
  "guyana":          { en: "Guyana",         slug: "guyana",        topo: "guyana",                  continent: "Americas" },
  "surinam":         { en: "Suriname",       slug: "suriname",      topo: "suriname",                continent: "Americas" },

  "guatemala":       { en: "Guatemala",      slug: "guatemala",     topo: "guatemala",                continent: "Americas" },
  "belice":          { en: "Belize",         slug: "belize",        topo: "belize",                  continent: "Americas" },
  "honduras":        { en: "Honduras",       slug: "honduras",      topo: "honduras",                 continent: "Americas" },
  "el salvador":     { en: "El Salvador",    slug: "el-salvador",   topo: "el salvador",              continent: "Americas" },
  "nicaragua":       { en: "Nicaragua",      slug: "nicaragua",     topo: "nicaragua",                continent: "Americas" },
  "costa rica":      { en: "Costa Rica",     slug: "costa-rica",    topo: "costa rica",               continent: "Americas" },
  "panama":          { en: "Panama",         slug: "panama",        topo: "panama",                  continent: "Americas" },

  "mexico":          { en: "Mexico",         slug: "mexico",        topo: "mexico",                  continent: "Americas" },
  "estados unidos":  { en: "United States",  slug: "united-states", topo: "united states of america", continent: "Americas" },
  "canada":          { en: "Canada",         slug: "canada",        topo: "canada",                  continent: "Americas" },
};

export function normalizeName(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getCountryInfo(countryName) {
  const norm = normalizeName(countryName);
  return COUNTRY_INFO[norm] || { en: countryName, slug: norm, topo: norm };
}

export const resolveSlug = (name) => getCountryInfo(name).slug;
export const resolveDisplayName = (name) => getCountryInfo(name).en;
export const resolveTopoName = (name) => getCountryInfo(name).topo;
export const resolveContinent = (name) => getCountryInfo(name).continent || 'Other';
