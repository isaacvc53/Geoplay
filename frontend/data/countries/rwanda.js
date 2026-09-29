window.GEOTARIA_COUNTRY = {
  slug: "rwanda",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many provinces and the capital city of Rwanda can you name?",
  subtitle: "Type a Rwandan province or the capital city and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/rwanda.svg",

  guessPlaceholder: "Type a province or capital city…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My provinces and capital city",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a province or the capital city to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 5 provinces and the capital city of Rwanda! 🇷🇼",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces and capital city are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Rwanda. Check your connection.",

  regions: [
    {
      id: "RW01",
      name: "Kigali City",
      names: [
        "Kigali City",
        "Kigali",
        "Kigali City Province"
      ]
    },
    {
      id: "RW02",
      name: "Eastern",
      names: [
        "Eastern",
        "Eastern Province"
      ]
    },
    {
      id: "RW03",
      name: "Northern",
      names: [
        "Northern",
        "Northern Province"
      ]
    },
    {
      id: "RW04",
      name: "Western",
      names: [
        "Western",
        "Western Province"
      ]
    },
    {
      id: "RW05",
      name: "Southern",
      names: [
        "Southern",
        "Southern Province"
      ]
    }
  ]
};