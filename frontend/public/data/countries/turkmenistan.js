// data/countries/turkmenistan.js
// Based on the Turkmenistan Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "turkmenistan",
  lang: "en",
  kicker: "GeoPlay · Turkmenistan",
  title: "How many regions of Turkmenistan can you name?",
  subtitle: "Type a Turkmen region and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/turkmenistan.svg",

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
    "You've completed all 6 regions of Turkmenistan! 🇹🇲",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Turkmenistan. Check your connection.",

  regions: [
    {
      id: "TMA",
      display: "Ahal Region",
      names: [
        "Ahal Region",
        "Ahal"
      ],
      region_id: null
    },
    {
      id: "TMB",
      display: "Balkan Region",
      names: [
        "Balkan Region",
        "Balkan"
      ],
      region_id: null
    },
    {
      id: "TMD",
      display: "Daşoguz Region",
      names: [
        "Daşoguz Region",
        "Dashoguz Region",
        "Daşoguz",
        "Dashoguz"
      ],
      region_id: null
    },
    {
      id: "TML",
      display: "Lebap Region",
      names: [
        "Lebap Region",
        "Lebap"
      ],
      region_id: null
    },
    {
      id: "TMM",
      display: "Mary Region",
      names: [
        "Mary Region",
        "Mary"
      ],
      region_id: null
    },
    {
      id: "TMS",
      display: "Ashgabat",
      names: [
        "Ashgabat",
        "Aşgabat"
      ],
      region_id: null
    }
  ]
};