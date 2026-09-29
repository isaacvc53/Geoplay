// data/countries/venezuela.js
// Based on the Venezuela Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "venezuela",
  lang: "en",
  kicker: "GeoPlay · Venezuela",
  title: "How many states of Venezuela can you name?",
  subtitle: "Type a Venezuelan state and the map will fill in.",
  total: 25,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/venezuela.svg",

  guessPlaceholder: "Type a state…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My states",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a state to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 25 states of Venezuela! 🇻🇪",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/25. The missing states are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Venezuela. Check your connection.",

  regions: [
    {
      id: "VEA",
      display: "Distrito Capital",
      names: ["Distrito Capital", "Capital District", "Caracas"],
      region_id: null
    },
    {
      id: "VEB",
      display: "Anzoátegui",
      names: ["Anzoátegui", "Anzoategui"],
      region_id: null
    },
    {
      id: "VEC",
      display: "Apure",
      names: ["Apure"],
      region_id: null
    },
    {
      id: "VED",
      display: "Aragua",
      names: ["Aragua"],
      region_id: null
    },
    {
      id: "VEE",
      display: "Barinas",
      names: ["Barinas"],
      region_id: null
    },
    {
      id: "VEF",
      display: "Bolívar",
      names: ["Bolívar", "Bolivar"],
      region_id: null
    },
    {
      id: "VEG",
      display: "Carabobo",
      names: ["Carabobo"],
      region_id: null
    },
    {
      id: "VEH",
      display: "Cojedes",
      names: ["Cojedes"],
      region_id: null
    },
    {
      id: "VEI",
      display: "Falcón",
      names: ["Falcón", "Falcon"],
      region_id: null
    },
    {
      id: "VEJ",
      display: "Guárico",
      names: ["Guárico", "Guarico"],
      region_id: null
    },
    {
      id: "VEK",
      display: "Lara",
      names: ["Lara"],
      region_id: null
    },
    {
      id: "VEL",
      display: "Mérida",
      names: ["Mérida", "Merida"],
      region_id: null
    },
    {
      id: "VEM",
      display: "Miranda",
      names: ["Miranda"],
      region_id: null
    },
    {
      id: "VEN",
      display: "Monagas",
      names: ["Monagas"],
      region_id: null
    },
    {
      id: "VEO",
      display: "Nueva Esparta",
      names: ["Nueva Esparta"],
      region_id: null
    },
    {
      id: "VEP",
      display: "Portuguesa",
      names: ["Portuguesa"],
      region_id: null
    },
    {
      id: "VER",
      display: "Sucre",
      names: ["Sucre"],
      region_id: null
    },
    {
      id: "VES",
      display: "Táchira",
      names: ["Táchira", "Tachira"],
      region_id: null
    },
    {
      id: "VET",
      display: "Trujillo",
      names: ["Trujillo"],
      region_id: null
    },
    {
      id: "VEU",
      display: "Yaracuy",
      names: ["Yaracuy"],
      region_id: null
    },
    {
      id: "VEV",
      display: "Zulia",
      names: ["Zulia"],
      region_id: null
    },
    {
      id: "VEW",
      display: "Dependencias Federales",
      names: ["Dependencias Federales", "Federal Dependencies"],
      region_id: null
    },
    {
      id: "VEX",
      display: "La Guaira",
      names: ["La Guaira", "Vargas"],
      region_id: null
    },
    {
      id: "VEY",
      display: "Delta Amacuro",
      names: ["Delta Amacuro"],
      region_id: null
    },
    {
      id: "VEZ",
      display: "Amazonas",
      names: ["Amazonas"],
      region_id: null
    }
  ]
};