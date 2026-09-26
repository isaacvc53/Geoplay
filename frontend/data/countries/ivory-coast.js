// data/countries/ivory-coast.js
// Based on the Ivory Coast Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "ivory-coast",
  lang: "en",
  kicker: "GeoPlay · Ivory Coast",
  title: "How many regions of Ivory Coast can you name?",
  subtitle: "Type an Ivorian region and the map will fill in.",
  total: 14,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/ivory-coast.svg",

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
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 14 regions of Ivory Coast! 🇨🇮",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Ivory Coast. Check your connection.",

  regions: [
    {
      id: "CIAB",
      display: "Abidjan",
      names: [
        "Abidjan",
        "Abidjan District",
        "Abidjan Autonomous District"
      ],
      region_id: null
    },

    {
      id: "CIBS",
      display: "Bas-Sassandra",
      names: [
        "Bas-Sassandra",
        "Bas-Sassandra District",
        "Bas Sassandra"
      ],
      region_id: null
    },

    {
      id: "CICM",
      display: "Comoé",
      names: [
        "Comoé",
        "Comoe",
        "Comoé District",
        "Comoe District"
      ],
      region_id: null
    },

    {
      id: "CIDN",
      display: "Denguélé",
      names: [
        "Denguélé",
        "Denguele",
        "Denguélé District",
        "Denguele District"
      ],
      region_id: null
    },

    {
      id: "CIGD",
      display: "Gôh-Djiboua",
      names: [
        "Gôh-Djiboua",
        "Goh-Djiboua",
        "Gôh Djiboua",
        "Goh Djiboua",
        "Gôh-Djiboua District",
        "Goh-Djiboua District"
      ],
      region_id: null
    },

    {
      id: "CILC",
      display: "Lacs",
      names: [
        "Lacs",
        "Lacs District"
      ],
      region_id: null
    },

    {
      id: "CILG",
      display: "Lagunes",
      names: [
        "Lagunes",
        "Lagunes District"
      ],
      region_id: null
    },

    {
      id: "CIMG",
      display: "Montagnes",
      names: [
        "Montagnes",
        "Montagnes District"
      ],
      region_id: null
    },

    {
      id: "CISM",
      display: "Sassandra-Marahoué",
      names: [
        "Sassandra-Marahoué",
        "Sassandra-Marahoue",
        "Sassandra Marahoué",
        "Sassandra Marahoue",
        "Sassandra-Marahoué District",
        "Sassandra-Marahoue District"
      ],
      region_id: null
    },

    {
      id: "CISV",
      display: "Savanes",
      names: [
        "Savanes",
        "Savanes District"
      ],
      region_id: null
    },

    {
      id: "CIVB",
      display: "Vallée du Bandama",
      names: [
        "Vallée du Bandama",
        "Vallee du Bandama",
        "Vallée du Bandama District",
        "Vallee du Bandama District"
      ],
      region_id: null
    },

    {
      id: "CIWR",
      display: "Woroba",
      names: [
        "Woroba",
        "Woroba District"
      ],
      region_id: null
    },

    {
      id: "CIYM",
      display: "Yamoussoukro",
      names: [
        "Yamoussoukro",
        "Yamoussoukro District",
        "Yamoussoukro Autonomous District"
      ],
      region_id: null
    },

    {
      id: "CIZZ",
      display: "Zanzan",
      names: [
        "Zanzan",
        "Zanzan District"
      ],
      region_id: null
    }
  ]
};