window.GEOTARIA_COUNTRY = {
  slug: "palestine",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many regions of Palestine can you name?",
  subtitle: "Type a Palestinian region and the map will fill in.",
  total: 2,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/palestine.svg",

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

  completeMessage: "You've completed both regions of Palestine! 🇵🇸",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Palestine. Check your connection.",

  regions: [
    {
      id: "PSGZZ",
      name: "Gaza Strip",
      names: [
        "Gaza Strip",
        "Gaza",
        "Gaza Strip Region"
      ]
    },
    {
      id: "PSWBK",
      name: "West Bank",
      names: [
        "West Bank",
        "West Bank Region"
      ]
    }
  ]
};