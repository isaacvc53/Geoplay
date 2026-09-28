// src/lib/countryText.js
//
// Textos de la página del juego de país (/pais), EN ESPAÑOL.
//
// Los archivos data/countries/<slug>.js traen sus propios textos (kicker,
// title, mensajes…) y hoy están en inglés (lang: "en"). Regla:
//   - Si el archivo declara `lang: "es"`, sus textos MANDAN sobre los de aquí
//     (así se puede ir traduciendo país a país sin tocar código).
//   - Si no, se usan los textos en español de este módulo, generados a partir
//     del nombre del país (en español) y del tipo de región (provincias,
//     estados…), que se deduce de las etiquetas inglesas del archivo.
//   - Los datos NO textuales (regions, names, total, quizSeconds, id, slug,
//     geoFile) siempre vienen del archivo.

import { CONTINENTS, slugify } from '../data/continents';

// Nombre en español por slug (inglés, el de data/geo) y por slug del nombre español.
const ES_NAME_BY_SLUG = new Map();
Object.values(CONTINENTS).forEach(({ countries }) => {
  countries.forEach(([, geoSlug, , nameEs]) => {
    ES_NAME_BY_SLUG.set(geoSlug, nameEs);
    ES_NAME_BY_SLUG.set(slugify(nameEs), nameEs);
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

// Tipo de región: plural inglés -> { pl, sg, g } (g: género gramatical del sustantivo).
const REGION_NOUNS = {
  provinces: { pl: 'provincias', sg: 'provincia', g: 'f' },
  states: { pl: 'estados', sg: 'estado', g: 'm' },
  regions: { pl: 'regiones', sg: 'región', g: 'f' },
  departments: { pl: 'departamentos', sg: 'departamento', g: 'm' },
  counties: { pl: 'condados', sg: 'condado', g: 'm' },
  districts: { pl: 'distritos', sg: 'distrito', g: 'm' },
  prefectures: { pl: 'prefecturas', sg: 'prefectura', g: 'f' },
  cantons: { pl: 'cantones', sg: 'cantón', g: 'm' },
  governorates: { pl: 'gobernaciones', sg: 'gobernación', g: 'f' },
  municipalities: { pl: 'municipios', sg: 'municipio', g: 'm' },
  islands: { pl: 'islas', sg: 'isla', g: 'f' },
  parishes: { pl: 'parroquias', sg: 'parroquia', g: 'f' },
  divisions: { pl: 'divisiones', sg: 'división', g: 'f' },
  emirates: { pl: 'emiratos', sg: 'emirato', g: 'm' },
  oblasts: { pl: 'óblasts', sg: 'óblast', g: 'm' },
  territories: { pl: 'territorios', sg: 'territorio', g: 'm' },
  communes: { pl: 'comunas', sg: 'comuna', g: 'f' },
  atolls: { pl: 'atolones', sg: 'atolón', g: 'm' },
  voivodeships: { pl: 'voivodatos', sg: 'voivodato', g: 'm' },
};
const DEFAULT_NOUN = { pl: 'regiones', sg: 'región', g: 'f' };

// Deduce el tipo de región de las etiquetas inglesas ("My provinces", "Type a state…").
function inferNoun(country) {
  const sources = [country.missingLabel, country.guessPlaceholder, country.title, country.subtitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (const [en, noun] of Object.entries(REGION_NOUNS)) {
    const singular = en.replace(/ies$/, 'y').replace(/s$/, '');
    if (new RegExp(`\\b(${en}|${singular})\\b`).test(sources)) return noun;
  }
  return DEFAULT_NOUN;
}

const FLAG_EMOJI = /[\u{1F1E6}-\u{1F1FF}]{2}/u;

// Campos de texto que un archivo con lang:"es" puede sobrescribir.
const TEXT_KEYS = [
  'kicker', 'title', 'subtitle', 'guessPlaceholder', 'submitLabel', 'pauseLabel', 'resumeLabel',
  'missingLabel', 'giveUpLabel', 'resetLabel', 'hintText', 'hintTextRevealed', 'correctPrefix',
  'notFoundMessage', 'alreadyFoundMessage', 'noneFoundMessage', 'pausedMessage', 'completeMessage',
  'timeUpMessage', 'giveUpMessage', 'readyMessage', 'readyLocalMessage', 'loadErrorMessage',
  'backLabel', 'firstCompletionMessage', 'newBestScoreMessage', 'newBestTimeMessage',
];

// Textos fijos de la interfaz (no dependen del archivo del país).
export const UI = {
  loadingTitle: 'Cargando…',
  notFoundTitle: 'País no encontrado',
  map: 'Mapa',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  resetView: 'Restablecer vista',
  close: 'Cerrar',
  localModeToast: 'Modo local (sin conexión con el servidor).',
};

// country: window.GEOTARIA_COUNTRY; slug: el slug con el que se cargó el archivo.
export function buildTexts(country, slug) {
  const nameEs = ES_NAME_BY_SLUG.get(country.slug) || ES_NAME_BY_SLUG.get(slug) || null;
  const noun = inferNoun(country);
  const f = noun.g === 'f';
  const un = f ? 'una' : 'un';
  const las = f ? 'Las' : 'Los';
  const resaltadas = f ? 'resaltadas' : 'resaltados';
  const cargadas = f ? 'cargadas' : 'cargados';
  const total = Number.isFinite(Number(country.total)) ? Number(country.total) : (country.regions || []).length;

  // Nombre del país para mostrar: español si lo conocemos; si no, el que ya venga en el archivo.
  const place = nameEs || country.title || country.slug || slug;
  const brand = (country.kicker || 'Geotaria').split(' · ')[0];
  const flag = ((country.completeMessage || '').match(FLAG_EMOJI) || [''])[0];

  const generated = {
    kicker: `${brand} · ${place}`,
    title: `¿Cuántas ${noun.pl} de ${place} puedes nombrar?`,
    subtitle: `Escribe ${un} ${noun.sg} de ${place} y el mapa se irá rellenando.`,
    guessPlaceholder: `Escribe ${un} ${noun.sg}…`,
    submitLabel: 'Comprobar',
    pauseLabel: 'Pausa',
    resumeLabel: 'Reanudar',
    missingLabel: `Mis ${noun.pl}`,
    giveUpLabel: 'Rendirse',
    resetLabel: 'Reiniciar',
    hintText: 'Arrastra el mapa · usa la rueda para hacer zoom',
    hintTextRevealed: `Pasa el ratón por cada ${noun.sg} para ver su nombre`,
    correctPrefix: '¡Correcto! ',
    notFoundMessage: 'No encontrado o nombre ambiguo.',
    alreadyFoundMessage: 'Ese ya lo tenías.',
    noneFoundMessage: 'Todavía no has acertado nada.',
    pausedMessage: 'El juego está en pausa.',
    completeMessage: `¡Has completado ${f ? 'las' : 'los'} ${total} ${noun.pl} de ${place}!${flag ? ' ' + flag : ''}`,
    timeUpMessage: 'Se acabó el tiempo.',
    giveUpMessage: `Juego terminado: {count}/{total}. ${las} que faltan están ${resaltadas}; pasa el ratón por encima para ver su nombre.`,
    readyMessage: '¡Mapa listo, empieza a escribir!',
    readyLocalMessage: 'Mapa listo en modo local.',
    loadErrorMessage: `No se pudo cargar el mapa de ${place}. Comprueba tu conexión.`,
    backLabel: 'Mapa mundial',
    firstCompletionMessage: '¡Primera expedición registrada para este país!',
    newBestScoreMessage: '¡Nueva mejor puntuación! +{gain} pts',
    newBestTimeMessage: '¡Nuevo mejor tiempo! -{saved} s',
  };

  const texts = { ...generated };
  if (country.lang === 'es') {
    TEXT_KEYS.forEach((k) => { if (country[k]) texts[k] = country[k]; });
  }

  // Mensajes con datos dinámicos.
  texts.connected = (n) => `Conectado: ${n} ${n === 1 ? noun.sg : noun.pl} ${n === 1 ? cargadas.replace(/s$/, '') : cargadas} desde la base de datos`;
  texts.loadingMap = `Cargando el mapa de ${place}…`;
  texts.total = total;
  texts.place = place;
  texts.localModeToast = UI.localModeToast;
  return texts;
}
