// data/countries/gambia.js
// Based on the Gambia Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "gambia",
  lang: "en",
  kicker: "GeoPlay · Gambia",
  title: "How many regions of the Gambia can you name?",
  subtitle: "Type a Gambian region and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/gambia.svg",

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
    "You've completed all 6 regions of the Gambia! 🇬🇲",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of the Gambia. Check your connection.",

  regions: [
    {
      id: "GMB",
      display: "Banjul",
      names: [
        "Banjul"
      ],
      region_id: null
    },
    {
      id: "GML",
      display: "Lower River",
      names: [
        "Lower River"
      ],
      region_id: null
    },
    {
      id: "GMM",
      display: "Central River",
      names: [
        "Central River"
      ],
      region_id: null
    },
    {
      id: "GMN",
      display: "North Bank",
      names: [
        "North Bank"
      ],
      region_id: null
    },
    {
      id: "GMU",
      display: "Upper River",
      names: [
        "Upper River"
      ],
      region_id: null
    },
    {
      id: "GMW",
      display: "West Coast",
      names: [
        "West Coast"
      ],
      region_id: null
    }
  ]
};