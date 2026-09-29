// data/countries/togo.js
// Based on the Togo Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "togo",
  lang: "en",
  kicker: "GeoPlay · Togo",
  title: "How many regions of Togo can you name?",
  subtitle: "Type a Togolese region and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/togo.svg",

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
    "You've completed all 5 regions of Togo! 🇹🇬",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Togo. Check your connection.",

  regions: [
    {
      id: "TGC",
      display: "Centre",
      names: [
        "Centre"
      ],
      region_id: null
    },
    {
      id: "TGK",
      display: "Kara",
      names: [
        "Kara"
      ],
      region_id: null
    },
    {
      id: "TGM",
      display: "Maritime",
      names: [
        "Maritime"
      ],
      region_id: null
    },
    {
      id: "TGP",
      display: "Plateaux",
      names: [
        "Plateaux"
      ],
      region_id: null
    },
    {
      id: "TGS",
      display: "Savanes",
      names: [
        "Savanes"
      ],
      region_id: null
    }
  ]
};