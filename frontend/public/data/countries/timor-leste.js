// data/countries/timor-leste.js
// Based on the Timor-Leste Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "timor-leste",
  lang: "en",
  kicker: "GeoPlay · Timor-Leste",
  title: "How many municipalities of Timor-Leste can you name?",
  subtitle: "Type a Timorese municipality and the map will fill in.",
  total: 13,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/timor-leste.svg",

  guessPlaceholder: "Type a municipality…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My municipalities",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a municipality to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 13 municipalities of Timor-Leste! 🇹🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing municipalities are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Timor-Leste. Check your connection.",

  regions: [
    {
      id: "TLAL",
      display: "Aileu",
      names: [
        "Aileu"
      ],
      region_id: null
    },
    {
      id: "TLAN",
      display: "Ainaro",
      names: [
        "Ainaro"
      ],
      region_id: null
    },
    {
      id: "TLBA",
      display: "Baucau",
      names: [
        "Baucau"
      ],
      region_id: null
    },
    {
      id: "TLBO",
      display: "Bobonaro",
      names: [
        "Bobonaro"
      ],
      region_id: null
    },
    {
      id: "TLCO",
      display: "Cova Lima",
      names: [
        "Cova Lima"
      ],
      region_id: null
    },
    {
      id: "TLDI",
      display: "Dili",
      names: [
        "Dili"
      ],
      region_id: null
    },
    {
      id: "TLER",
      display: "Ermera",
      names: [
        "Ermera"
      ],
      region_id: null
    },
    {
      id: "TLLA",
      display: "Lautém",
      names: [
        "Lautém",
        "Lautem"
      ],
      region_id: null
    },
    {
      id: "TLLI",
      display: "Liquica",
      names: [
        "Liquica",
        "Liquiçá"
      ],
      region_id: null
    },
    {
      id: "TLMF",
      display: "Manufahi",
      names: [
        "Manufahi"
      ],
      region_id: null
    },
    {
      id: "TLMT",
      display: "Manatuto",
      names: [
        "Manatuto"
      ],
      region_id: null
    },
    {
      id: "TLOE",
      display: "Ambeno",
      names: [
        "Ambeno",
        "Oecusse",
        "Oecusse-Ambeno"
      ],
      region_id: null
    },
    {
      id: "TLVI",
      display: "Viqueque",
      names: [
        "Viqueque"
      ],
      region_id: null
    }
  ]
};