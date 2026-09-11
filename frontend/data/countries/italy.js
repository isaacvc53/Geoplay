// data/countries/italy.js
// This one WAS checked against the real italy.svg. Unlike the other
// country files in this set, italy.svg does not come from amCharts'
// SVG Map Generator — it's from simplemaps.com, and its <path>
// elements use a different convention:
//   <path id="IT23" name="Valle d'Aosta" d="...">
// i.e. ids are "IT" + a 2-digit code with NO hyphen (uppercase), and
// the region name is stored in a "name" attribute, not "title" like
// the amCharts-sourced SVGs (germany.svg, cubaLow.svg, etc.).
//
// Because we can't be sure buildFeatureIndex() in game.js also checks
// the "name" attribute (it's documented as matching on "title"), the
// ids below were changed to match italy.svg's real ids exactly
// (IT21, IT23, IT25...), so matching works by id regardless of
// whether the "title" vs "name" fallback is supported. All 20 ids in
// italy.svg were confirmed to map 1:1 to these 20 regions — no extra
// neighboring-country shapes in this file (unlike the amCharts one).
//
// viewBox: italy.svg declares viewbox="0 0 1000 1000", so game.js's
// automatic viewBox detection (see loadGeometry()) should pick that
// up fine without needing to hardcode it here.
//
// NOTE: there is currently no seed_italy.py (same as brazil.js/cuba.js),
// so this page will work in local mode until you decide to seed
// Country="Italy" in the database.

window.GEOPLAY_COUNTRY = {
  slug: "Italy",
  lang: "en",
  kicker: "GeoPlay · Italy",
  title: "How many Italian regions can you name?",
  subtitle: "Type an Italian region and the map will fill in.",
  total: 20,
  quizSeconds: 15 * 60,
  geoFile: "../data/geo/italy.svg",
  // italy.svg declares its viewBox as lowercase `viewbox="0 0 1000 1000"`
  // (simplemaps.com convention). game.js's auto-detection in loadGeometry()
  // reads sourceSvg.getAttribute("viewBox") which is case-sensitive and
  // returns null for a lowercase attribute, so it must be set explicitly
  // here or the map falls back to the page's default viewBox (0 0 960 620)
  // and renders cropped/misaligned with a miscalibrated zoom extent.
  viewBox: "0 0 1000 1000",

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
  completeMessage: "You've completed all 20 regions of Italy! 🇮🇹",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the map of Italy. Check your connection.",

  regions: [
    { id: "IT65", display: "Abruzzo", names: ["Abruzzo"], region_id: null },
    { id: "IT77", display: "Basilicata", names: ["Basilicata"], region_id: null },
    { id: "IT78", display: "Calabria", names: ["Calabria"], region_id: null },
    { id: "IT72", display: "Campania", names: ["Campania"], region_id: null },
    { id: "IT45", display: "Emilia-Romagna", names: ["Emilia-Romagna", "Emilia Romagna"], region_id: null },
    { id: "IT36", display: "Friuli Venezia Giulia", names: ["Friuli Venezia Giulia", "Friuli-Venezia Giulia"], region_id: null },
    { id: "IT62", display: "Lazio", names: ["Lazio"], region_id: null },
    { id: "IT42", display: "Liguria", names: ["Liguria"], region_id: null },
    { id: "IT25", display: "Lombardy", names: ["Lombardy", "Lombardia"], region_id: null },
    { id: "IT57", display: "Marche", names: ["Marche", "The Marches"], region_id: null },
    { id: "IT67", display: "Molise", names: ["Molise"], region_id: null },
    { id: "IT21", display: "Piedmont", names: ["Piedmont", "Piemonte"], region_id: null },
    { id: "IT75", display: "Apulia", names: ["Apulia", "Puglia"], region_id: null },
    { id: "IT88", display: "Sardinia", names: ["Sardinia", "Sardegna"], region_id: null },
    { id: "IT82", display: "Sicily", names: ["Sicily", "Sicilia"], region_id: null },
    { id: "IT52", display: "Tuscany", names: ["Tuscany", "Toscana"], region_id: null },
    { id: "IT32", display: "Trentino-Alto Adige", names: ["Trentino-Alto Adige", "Trentino-South Tyrol"], region_id: null },
    { id: "IT55", display: "Umbria", names: ["Umbria"], region_id: null },
    { id: "IT23", display: "Aosta Valley", names: ["Aosta Valley", "Valle d'Aosta", "Val d'Aosta"], region_id: null },
    { id: "IT34", display: "Veneto", names: ["Veneto"], region_id: null },
  ],
};
