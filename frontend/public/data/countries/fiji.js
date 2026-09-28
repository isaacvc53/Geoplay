window.GEOTARIA_COUNTRY = {
  slug: "fiji",
  lang: "en",
  kicker: "GeoPlay · Fiji",
  title: "How many divisions of Fiji can you name?",
  subtitle: "Type a Fijian division and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/fiji.svg",

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

  completeMessage: "You've completed all 5 divisions of Fiji! 🇫🇯",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing divisions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Fiji. Check your connection.",

  regions: [
    {
      id: "FJC",
      display: "Central",
      names: [
        "Central",
        "Central Division",
        "Central Division of Fiji"
      ],
      region_id: null
    },
    {
      id: "FJE",
      display: "Eastern",
      names: [
        "Eastern",
        "Eastern Division",
        "Eastern Division of Fiji"
      ],
      region_id: null
    },
    {
      id: "FJN",
      display: "Northern",
      names: [
        "Northern",
        "Northern Division",
        "Northern Division of Fiji"
      ],
      region_id: null
    },
    {
      id: "FJR",
      display: "Rotuma",
      names: [
        "Rotuma",
        "Rotuma Division",
        "Rotuma Dependency"
      ],
      region_id: null
    },
    {
      id: "FJW",
      display: "Western",
      names: [
        "Western",
        "Western Division",
        "Western Division of Fiji"
      ],
      region_id: null
    }
  ]
};