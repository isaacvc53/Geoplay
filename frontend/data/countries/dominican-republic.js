// data/countries/dominican-republic.js
// Based on the Dominican Republic Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "dominican-republic",
  lang: "en",
  kicker: "GeoPlay · Dominican Republic",
  title: "How many regions of the Dominican Republic can you name?",
  subtitle: "Type a region and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/dominican-republic.svg",

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
    "You've completed all 10 regions of the Dominican Republic! 🇩🇴",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of the Dominican Republic. Check your connection.",

  regions: [
    {
      id: "DO33",
      display: "Cibao Nordeste",
      names: [
        "Cibao Nordeste",
        "Cibao Northeast",
        "Northeast Cibao"
      ],
      region_id: null
    },

    {
      id: "DO34",
      display: "Cibao Noroeste",
      names: [
        "Cibao Noroeste",
        "Cibao Northwest",
        "Northwest Cibao"
      ],
      region_id: null
    },

    {
      id: "DO35",
      display: "Cibao Norte",
      names: [
        "Cibao Norte",
        "Northern Cibao",
        "North Cibao"
      ],
      region_id: null
    },

    {
      id: "DO36",
      display: "Cibao Sur",
      names: [
        "Cibao Sur",
        "Southern Cibao",
        "South Cibao"
      ],
      region_id: null
    },

    {
      id: "DO37",
      display: "El Valle",
      names: [
        "El Valle",
        "The Valley"
      ],
      region_id: null
    },

    {
      id: "DO38",
      display: "Enriquillo",
      names: [
        "Enriquillo"
      ],
      region_id: null
    },

    {
      id: "DO39",
      display: "Higuamo",
      names: [
        "Higuamo"
      ],
      region_id: null
    },

    {
      id: "DO40",
      display: "Ozama",
      names: [
        "Ozama"
      ],
      region_id: null
    },

    {
      id: "DO41",
      display: "Valdesia",
      names: [
        "Valdesia"
      ],
      region_id: null
    },

    {
      id: "DO42",
      display: "Yuma",
      names: [
        "Yuma"
      ],
      region_id: null
    }
  ]
};