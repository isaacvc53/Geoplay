// data/countries/djibouti.js
// Based on the Djibouti Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "djibouti",
  lang: "en",
  kicker: "GeoPlay · Djibouti",
  title: "How many regions of Djibouti can you name?",
  subtitle: "Type a region and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/djibouti.svg",

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
    "You've completed all 6 regions of Djibouti! 🇩🇯",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Djibouti. Check your connection.",

  regions: [
    {
      id: "DJAR",
      display: "Arta",
      names: [
        "Arta",
        "Arta Region"
      ],
      region_id: null
    },

    {
      id: "DJAS",
      display: "Ali Sabieh",
      names: [
        "Ali Sabieh",
        "Ali Sabieh Region",
        "Ali-Sabieh",
        "Ali-Sabieh Region"
      ],
      region_id: null
    },

    {
      id: "DJDI",
      display: "Dikhil",
      names: [
        "Dikhil",
        "Dikhil Region"
      ],
      region_id: null
    },

    {
      id: "DJDJ",
      display: "Djibouti",
      names: [
        "Djibouti",
        "Djibouti Region",
        "Djibouti City"
      ],
      region_id: null
    },

    {
      id: "DJOB",
      display: "Obock",
      names: [
        "Obock",
        "Obock Region"
      ],
      region_id: null
    },

    {
      id: "DJTA",
      display: "Tadjourah",
      names: [
        "Tadjourah",
        "Tadjourah Region"
      ],
      region_id: null
    }
  ]
};