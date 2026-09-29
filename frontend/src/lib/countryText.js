// src/lib/countryText.js
//
// Textos de la página del juego de país (/pais), EN INGLÉS.
//
// Todos los textos se generan aquí, en inglés, a partir del nombre inglés del
// país (data/continents.js) y del tipo de región (provinces, states…), que se
// deduce de las etiquetas del archivo data/countries/<slug>.js. Los datos NO
// textuales (regions, names, total, id, slug, geoFile) siempre vienen del archivo.

import { CONTINENTS, slugify } from '../data/continents';

// Nombre inglés por slug (el de data/geo) y por slug del nombre español (el de ?pais=).
const EN_NAME_BY_SLUG = new Map();
Object.values(CONTINENTS).forEach(({ countries }) => {
  countries.forEach(([nameEn, geoSlug, , nameEs]) => {
    EN_NAME_BY_SLUG.set(geoSlug, nameEn);
    EN_NAME_BY_SLUG.set(slugify(nameEs), nameEn);
  });
});

// Slug inglés (data/geo) a partir del slug del nombre en español.
const EN_SLUG_BY_ES_SLUG = new Map();
Object.values(CONTINENTS).forEach(({ countries }) => {
  countries.forEach(([, geoSlug, , nameEs]) => EN_SLUG_BY_ES_SLUG.set(slugify(nameEs), geoSlug));
});

// Slugs de archivo a probar para un ?pais=... dado (tal cual y equivalente inglés).
export function slugCandidates(pais) {
  const list = [pais];
  const en = EN_SLUG_BY_ES_SLUG.get(pais);
  if (en && en !== pais) list.push(en);
  return list;
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
    title: `How many ${noun.pl} of ${place} can you name?`,
    subtitle: `Type ${a} ${noun.sg} of ${place} and the map will fill in.`,
    guessPlaceholder: `Type ${a} ${noun.sg}…`,
    submitLabel: 'Check',
    giveUpLabel: 'Give up',
    resetLabel: 'Reset',
    hintText: 'Drag the map · pinch or scroll to zoom',
    hintTextRevealed: `Hover over or tap ${a} ${noun.sg} to see its name`,
    correctPrefix: 'Correct! ',
    notFoundMessage: 'Not found or ambiguous name.',
    alreadyFoundMessage: 'You already got that one.',
    loadErrorMessage: `Couldn't load the map of ${place}. Check your connection.`,
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
    ? `You named all ${total} ${noun.pl} of ${place}. Not a single one slipped by.`
    : `You got ${count} of ${total} ${noun.pl} of ${place}. The ones you missed are highlighted on the map — hover over or tap them to see their names.`);
  texts.endedFeedback = (count) => `Game over · ${count}/${total}`;
  texts.loadingMap = `Loading the map of ${place}…`;
  texts.slotsLabel = `${capitalize(noun.pl)} to guess`;
  texts.slotEmpty = 'To guess';
  texts.total = total;
  texts.place = place;
  texts.localModeToast = UI.localModeToast;
  return texts;
}
