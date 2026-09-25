// data/countries/france.js
// Checked against the real france.svg (same simplemaps.com family as
// italy.svg, not amCharts). Its <path> elements use:
//   <path id="FRIDF" name="Île de France" d="...">
// i.e. ids are "FR" + a country-specific code (uppercase, NO hyphen),
// and the region name lives in a "name" attribute, not "title" like
// the amCharts-sourced SVGs. Note france.svg's own "name" values have
// minor typos/omissions (e.g. "Provence Alpes Côte d'Azu", missing
// the final "r", and no hyphens/apostrophes normalized), so the ids
// below were taken verbatim from the SVG while `display`/`names` use
// the correct, fully-accented official region names for matching and
// display.
//
// All 13 ids in france.svg were confirmed to map 1:1 to the 13
// current metropolitan regions (post-2016 merger) — no overseas
// regions and no neighboring-country shapes in this file.
//
// viewBox: france.svg declares lowercase viewbox="0 0 1000 960",
// so — same caveat as italy.js — game.js's case-sensitive
// getAttribute("viewBox") won't pick it up automatically; it's set
// explicitly here.
//
// NOTE: there is currently no seed_france.py (same as brazil.js/
// cuba.js/italy.js), so this page will work in local mode until you
// decide to seed Country="France" in the database.

window.GEOTARIA_COUNTRY = {
  slug: "france",
  lang: "en",
  kicker: "GeoPlay · France",
  title: "How many French regions can you name?",
  subtitle: "Type a French region and the map will fill in.",
  total: 13,
  quizSeconds: 15 * 60,
  geoFile: "../data/geo/france.svg",
  // france.svg declares its viewBox as lowercase `viewbox="0 0 1000 960"`
  // (simplemaps.com convention, like italy.svg). Must be set explicitly
  // here or the map falls back to the page's default viewBox and renders
  // cropped/misaligned with a miscalibrated zoom extent.
  viewBox: "0 0 1000 960",

  guessPlaceholder: "Type a region…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My regions",
  giveUpLabel: "Give up",
  resetLabel: "Reset",
  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a region to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been found.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",
  completeMessage: "You've completed all 13 regions of France! 🇫🇷",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the map of France. Check your connection.",

  regions: [
    { id: "FRARA", display: "Auvergne-Rhône-Alpes", names: ["Auvergne-Rhone-Alpes", "Auvergne-Rhône-Alpes"], region_id: null },
    { id: "FRBFC", display: "Bourgogne-Franche-Comté", names: ["Bourgogne-Franche-Comte", "Bourgogne-Franche-Comté", "Burgundy-Franche-Comte"], region_id: null },
    { id: "FRBRE", display: "Bretagne", names: ["Bretagne", "Brittany"], region_id: null },
    { id: "FRCVL", display: "Centre-Val de Loire", names: ["Centre-Val de Loire", "Centre Val de Loire"], region_id: null },
    { id: "FR20R", display: "Corse", names: ["Corse", "Corsica"], region_id: null },
    { id: "FRGES", display: "Grand Est", names: ["Grand Est"], region_id: null },
    { id: "FRHDF", display: "Hauts-de-France", names: ["Hauts-de-France", "Hauts de France"], region_id: null },
    { id: "FRIDF", display: "Île-de-France", names: ["Ile-de-France", "Île-de-France", "Ile de France"], region_id: null },
    { id: "FRNOR", display: "Normandie", names: ["Normandie", "Normandy"], region_id: null },
    { id: "FRNAQ", display: "Nouvelle-Aquitaine", names: ["Nouvelle-Aquitaine", "Nouvelle Aquitaine"], region_id: null },
    { id: "FROCC", display: "Occitanie", names: ["Occitanie"], region_id: null },
    { id: "FRPDL", display: "Pays de la Loire", names: ["Pays de la Loire"], region_id: null },
    { id: "FRPAC", display: "Provence-Alpes-Côte d'Azur", names: ["Provence-Alpes-Cote d'Azur", "Provence-Alpes-Côte d'Azur", "PACA"], region_id: null },
  ],
};
