window.GEOPLAY_COUNTRY = {
  slug: "belize",
  id: 31,
  lang: "en",
  kicker: "GeoPlay · Belize",
  title: "How many Belizean districts can you name?",
  subtitle: "Type a Belizean district and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/belize.svg",

  guessPlaceholder: "Type a district…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",

  missingLabel: "My districts",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a district to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",

  pausedMessage: "The quiz is paused.",
  completeMessage: "Congratulations! You named all 6 Belizean districts.",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz ended. Here are the districts you didn't find.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the Belize map.",

  regions: [
    {
      id: "BZBZ",
      display: "Belize",
      names: [
        "Belize",
        "Belize District"
      ],
      region_id: 665
    },
    {
      id: "BZCY",
      display: "Cayo",
      names: [
        "Cayo",
        "Cayo District"
      ],
      region_id: 666
    },
    {
      id: "BZCZL",
      display: "Corozal",
      names: [
        "Corozal",
        "Corozal District"
      ],
      region_id: 667
    },
    {
      id: "BZOW",
      display: "Orange Walk",
      names: [
        "Orange Walk",
        "Orange Walk District"
      ],
      region_id: 668
    },
    {
      id: "BZSC",
      display: "Stann Creek",
      names: [
        "Stann Creek",
        "Stann Creek District"
      ],
      region_id: 669
    },
    {
      id: "BZTOL",
      display: "Toledo",
      names: [
        "Toledo",
        "Toledo District"
      ],
      region_id: 670
    }
  ]
};