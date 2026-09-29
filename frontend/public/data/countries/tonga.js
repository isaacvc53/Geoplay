// data/countries/tonga.js
// Based on the Tonga Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "tonga",
  lang: "en",
  kicker: "GeoPlay · Tonga",
  title: "How many divisions of Tonga can you name?",
  subtitle: "Type a Tongan division and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/tonga.svg",

  guessPlaceholder: "Type a division…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My divisions",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a division to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 5 divisions of Tonga! 🇹🇴",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing divisions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Tonga. Check your connection.",

  regions: [
    {
      id: "TO01",
      display: "Eua",
      names: [
        "Eua",
        "ʻEua"
      ],
      region_id: null
    },
    {
      id: "TO02",
      display: "Ha'apai",
      names: [
        "Ha'apai",
        "Haʻapai"
      ],
      region_id: null
    },
    {
      id: "TO03",
      display: "Niuas",
      names: [
        "Niuas"
      ],
      region_id: null
    },
    {
      id: "TO04",
      display: "Tongatapu",
      names: [
        "Tongatapu"
      ],
      region_id: null
    },
    {
      id: "TO05",
      display: "Vava'u",
      names: [
        "Vava'u",
        "Vavaʻu"
      ],
      region_id: null
    }
  ]
};