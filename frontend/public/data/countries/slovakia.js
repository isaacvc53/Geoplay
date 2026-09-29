// data/countries/slovakia.js
// Based on the Slovakia Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "slovakia",
  lang: "en",
  kicker: "GeoPlay · Slovakia",
  title: "How many regions of Slovakia can you name?",
  subtitle: "Type a Slovak region and the map will fill in.",
  total: 8,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/slovakia.svg",

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
    "You've completed all 8 regions of Slovakia! 🇸🇰",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Slovakia. Check your connection.",

  regions: [
    {
      id: "SKBC",
      display: "Banskobystrický",
      names: [
        "Banskobystrický",
        "Banskobystricky",
        "Banskobystrický Region",
        "Banskobystricky Region",
        "Banská Bystrica",
        "Banska Bystrica"
      ],
      region_id: null
    },

    {
      id: "SKBL",
      display: "Bratislavský",
      names: [
        "Bratislavský",
        "Bratislavsky",
        "Bratislavský Region",
        "Bratislavsky Region",
        "Bratislava",
        "Bratislava Region"
      ],
      region_id: null
    },

    {
      id: "SKKI",
      display: "Košický",
      names: [
        "Košický",
        "Kosicky",
        "Košický Region",
        "Kosicky Region",
        "Košice",
        "Kosice",
        "Košice Region",
        "Kosice Region"
      ],
      region_id: null
    },

    {
      id: "SKNI",
      display: "Nitriansky",
      names: [
        "Nitriansky",
        "Nitriansky Region",
        "Nitra",
        "Nitra Region"
      ],
      region_id: null
    },

    {
      id: "SKPV",
      display: "Prešov",
      names: [
        "Prešov",
        "Presov",
        "Prešovský",
        "Presovsky",
        "Prešov Region",
        "Presov Region"
      ],
      region_id: null
    },

    {
      id: "SKTA",
      display: "Trnavský",
      names: [
        "Trnavský",
        "Trnavsky",
        "Trnavský Region",
        "Trnavsky Region",
        "Trnava",
        "Trnava Region"
      ],
      region_id: null
    },

    {
      id: "SKTC",
      display: "Trenciansky",
      names: [
        "Trenciansky",
        "Trenčiansky",
        "Trenciansky Region",
        "Trenčiansky Region",
        "Trenčín",
        "Trencin",
        "Trenčín Region",
        "Trencin Region"
      ],
      region_id: null
    },

    {
      id: "SKZI",
      display: "Žilinský",
      names: [
        "Žilinský",
        "Zilinsky",
        "Žilinský Region",
        "Zilinsky Region",
        "Žilina",
        "Zilina",
        "Žilina Region",
        "Zilina Region"
      ],
      region_id: null
    }
  ]
};