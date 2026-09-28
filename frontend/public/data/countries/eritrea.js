window.GEOTARIA_COUNTRY = {
  slug: "eritrea",
  lang: "en",
  kicker: "GeoPlay · Eritrea",
  title: "How many regions of Eritrea can you name?",
  subtitle: "Type an Eritrean region and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/eritrea.svg",

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

  completeMessage: "You've completed all 6 regions of Eritrea! 🇪🇷",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Eritrea. Check your connection.",

  regions: [
    {
      id: "ERAN",
      display: "Anseba",
      names: [
        "Anseba",
        "Anseba Region"
      ],
      region_id: null
    },
    {
      id: "ERDK",
      display: "Debubawi Keyih Bahri",
      names: [
        "Debubawi Keyih Bahri",
        "Southern Red Sea",
        "Debubawi Keyih Bahri Region",
        "Southern Red Sea Region"
      ],
      region_id: null
    },
    {
      id: "ERDU",
      display: "Debub",
      names: [
        "Debub",
        "Southern",
        "Debub Region",
        "Southern Region"
      ],
      region_id: null
    },
    {
      id: "ERGB",
      display: "Gash Barka",
      names: [
        "Gash Barka",
        "Gash-Barka",
        "Gash Barka Region",
        "Gash-Barka Region"
      ],
      region_id: null
    },
    {
      id: "ERMA",
      display: "Maekel",
      names: [
        "Maekel",
        "Central",
        "Maekel Region",
        "Central Region"
      ],
      region_id: null
    },
    {
      id: "ERSK",
      display: "Semenawi Keyih Bahri",
      names: [
        "Semenawi Keyih Bahri",
        "Northern Red Sea",
        "Semenawi Keyih Bahri Region",
        "Northern Red Sea Region"
      ],
      region_id: null
    }
  ]
};