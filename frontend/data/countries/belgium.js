window.GEOTARIA_COUNTRY = {
  slug: "belgium",
  lang: "en",
  kicker: "GeoPlay · Belgium",
  title: "How many Belgian regions can you name?",
  subtitle: "Type a Belgian region and the map will fill in.",
  total: 3,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/belgium.svg",

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
  completeMessage: "Congratulations! You named all 3 Belgian regions.",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz ended. Here are the regions you didn't find.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the Belgium map.",

  regions: [
    {
      id: "BEBRU",
      display: "Brussels",
      names: [
        "Brussels",
        "Brussels-Capital",
        "Brussels-Capital Region",
        "Brussels Region",
        "Brussels Capital Region"
      ],
      region_id: null
    },
    {
      id: "BEVLG",
      display: "Flanders",
      names: [
        "Flanders",
        "Flemish Region",
        "Flemish Region of Belgium"
      ],
      region_id: null
    },
    {
      id: "BEWAL",
      display: "Wallonia",
      names: [
        "Wallonia",
        "Walloon Region",
        "Walloon Region of Belgium"
      ],
      region_id: null
    }
  ]
};