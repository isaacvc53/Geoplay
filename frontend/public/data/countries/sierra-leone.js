// data/countries/sierra-leone.js
// Based on the Sierra Leone Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "sierra-leone",
  lang: "en",
  kicker: "GeoPlay · Sierra Leone",
  title: "How many regions of Sierra Leone can you name?",
  subtitle: "Type a region of Sierra Leone and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/sierra-leone.svg",

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
    "You've completed all 5 regions of Sierra Leone! 🇸🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Sierra Leone. Check your connection.",

  regions: [
    {
      id: "SLE",
      display: "Eastern",
      names: [
        "Eastern",
        "Eastern Province",
        "Eastern Region"
      ],
      region_id: null
    },

    {
      id: "SLN",
      display: "Northern",
      names: [
        "Northern",
        "Northern Province",
        "Northern Region"
      ],
      region_id: null
    },

    {
      id: "SLNW",
      display: "Northern Western",
      names: [
        "Northern Western",
        "North Western",
        "North-Western",
        "Northern Western Province",
        "Northern Western Region"
      ],
      region_id: null
    },

    {
      id: "SLS",
      display: "Southern",
      names: [
        "Southern",
        "Southern Province",
        "Southern Region"
      ],
      region_id: null
    },

    {
      id: "SLW",
      display: "Western",
      names: [
        "Western",
        "Western Province",
        "Western Region",
        "Western Area"
      ],
      region_id: null
    }
  ]
};