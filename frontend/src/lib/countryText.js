// src/lib/countryText.js
//
// Textos de la página del juego de país (/pais), EN INGLÉS.
//
// Todos los textos se generan aquí, en inglés, a partir del nombre inglés del
// país (data/continents.js) y del tipo de región (provinces, states…), que se
// deduce de las etiquetas del archivo data/countries/<slug>.js. Los datos NO
// textuales (regions, names, total, id, slug, geoFile) siempre vienen del archivo.

import { CONTINENTS, FILE_SLUG_ALIASES, slugify, fileSlug } from '../data/continents';

// Nombre inglés por slug (el de data/geo) y por slug del nombre español (el de ?pais=).
const EN_NAME_BY_SLUG = new Map();
Object.values(CONTINENTS).forEach(({ countries }) => {
  countries.forEach(([nameEn, geoSlug, , nameEs]) => {
    EN_NAME_BY_SLUG.set(geoSlug, nameEn);
    EN_NAME_BY_SLUG.set(slugify(nameEs), nameEn);
  });
});

// Los slugs de archivo con otro nombre (usa, bosnia, czechia…) también conocen su nombre inglés.
Object.entries(FILE_SLUG_ALIASES).forEach(([variant, file]) => {
  const name = EN_NAME_BY_SLUG.get(variant);
  if (name && !EN_NAME_BY_SLUG.has(file)) EN_NAME_BY_SLUG.set(file, name);
});
EN_NAME_BY_SLUG.set('usa', 'United States');

// Slug inglés (data/geo) a partir del slug del nombre en español.
const EN_SLUG_BY_ES_SLUG = new Map();
Object.values(CONTINENTS).forEach(({ countries }) => {
  countries.forEach(([, geoSlug, , nameEs]) => EN_SLUG_BY_ES_SLUG.set(slugify(nameEs), geoSlug));
});

// Slugs de archivo a probar para un ?pais=... dado (tal cual y equivalente inglés).
// Orden: el slug tal cual, su alias de archivo, el equivalente inglés y el alias de éste.
export function slugCandidates(pais) {
  const en = EN_SLUG_BY_ES_SLUG.get(pais);
  const list = [pais, fileSlug(pais), en, en && fileSlug(en)].filter(Boolean);
  return [...new Set(list)];
}

// Tipos de región que se reconocen en las etiquetas del archivo (plural inglés).
const REGION_TYPES = [
  'provinces', 'states', 'regions', 'departments', 'counties', 'districts', 'prefectures',
  'cantons', 'governorates', 'municipalities', 'islands', 'parishes', 'divisions', 'emirates',
  'oblasts', 'territories', 'communes', 'atolls', 'voivodeships',
];
const DEFAULT_NOUN = { pl: 'regions', sg: 'region' };

const singularOf = (pl) => pl.replace(/ies$/, 'y').replace(/s$/, '');

// Deduce el tipo de región de las etiquetas ("My provinces", "Type a state…").
function inferNoun(country) {
  const sources = [country.missingLabel, country.guessPlaceholder, country.title, country.subtitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (const pl of REGION_TYPES) {
    const sg = singularOf(pl);
    if (new RegExp(`\\b(${pl}|${sg})\\b`).test(sources)) return { pl, sg };
  }
  return DEFAULT_NOUN;
}

// Nombres que en inglés llevan "the" (title: "states of the United States").
const THE_PLACES = new Set([
  'United States', 'United Kingdom', 'Netherlands', 'Philippines', 'Bahamas', 'Gambia',
  'Czech Republic', 'Czechia', 'Republic of the Congo', 'Democratic Republic of the Congo',
  'Central African Republic', 'United Arab Emirates', 'Maldives', 'Seychelles', 'Comoros',
  'Marshall Islands', 'Solomon Islands',
]);
const withThe = (name) => (THE_PLACES.has(name) ? `the ${name}` : name);

const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

// Textos fijos de la interfaz (no dependen del archivo del país).
export const UI = {
  loadingTitle: 'Loading…',
  loadingMap: 'Loading the map…',
  notFoundTitle: 'Country not found',
  notFoundMessage: (pais) => `We couldn't find a map for “${pais}”.`,
  worldMap: 'World map',
  map: 'Map',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetView: 'Reset view',
  localModeToast: 'Local mode (no connection to the server).',
};

// country: window.GEOTARIA_COUNTRY; slug: el slug con el que se cargó el archivo.
export function buildTexts(country, slug) {
  const noun = inferNoun(country);
  const a = article(noun.sg);
  const total = Number.isFinite(Number(country.total)) ? Number(country.total) : (country.regions || []).length;

  // Nombre del país: inglés de la tabla; si no está, el del kicker del archivo ("GeoPlay · Afghanistan").
  const kickerName = (country.kicker || '').split(' · ')[1];
  const place = EN_NAME_BY_SLUG.get(country.slug) || EN_NAME_BY_SLUG.get(slug) || kickerName || country.slug || slug;

  const texts = {
    kicker: `Geotaria · ${place}`,
    title: `How many ${noun.pl} of ${withThe(place)} can you name?`,
    subtitle: `Type ${a} ${noun.sg} of ${withThe(place)} and the map will fill in.`,
    guessPlaceholder: `Type ${a} ${noun.sg}…`,
    submitLabel: 'Check',
    giveUpLabel: 'Give up',
    resetLabel: 'Reset',
    hintText: 'Drag the map · pinch or scroll to zoom',
    hintTextRevealed: `Hover over or tap ${a} ${noun.sg} to see its name`,
    correctPrefix: 'Correct! ',
    notFoundMessage: 'Not found or ambiguous name.',
    alreadyFoundMessage: 'You already got that one.',
    loadErrorMessage: `Couldn't load the map of ${withThe(place)}. Check your connection.`,
    backLabel: UI.worldMap,
    firstCompletionMessage: 'First game recorded for this country',
    newBestScoreMessage: 'New personal best: +{gain} points',

    // Start screen.
    startLabel: 'Start',
    introCountLabel: `${noun.pl} to find`,
    introNote: 'Press Start when you’re ready.',

    // Result screen (give up or complete).
    resultEyebrowComplete: 'Congratulations',
    resultEyebrowEnded: 'Game over',
    resultHitsLabel: 'Correct',
    resultMissingLabel: 'Missed',
    resultPercentLabel: 'Complete',
    playAgainLabel: 'Play again',
    viewMapLabel: 'View the map',
    viewResultLabel: 'View result',
  };

  // Mensajes con datos dinámicos.
  texts.resultTitle = (pct, complete) => {
    if (complete) return 'Map complete!';
    if (pct >= 75) return 'So close!';
    if (pct >= 40) return 'Good try';
    return 'Keep practising';
  };
  texts.resultMessage = (count, complete) => (complete
    ? `You named all ${total} ${noun.pl} of ${withThe(place)}. Not a single one slipped by.`
    : `You got ${count} of ${total} ${noun.pl} of ${withThe(place)}. The ones you missed are highlighted on the map — hover over or tap them to see their names.`);
  texts.endedFeedback = (count) => `Game over · ${count}/${total}`;
  texts.loadingMap = `Loading the map of ${withThe(place)}…`;
  texts.slotsLabel = `${capitalize(noun.pl)} to guess`;
  texts.slotEmpty = 'To guess';
  texts.total = total;
  texts.place = place;
  texts.localModeToast = UI.localModeToast;
  return texts;
}
