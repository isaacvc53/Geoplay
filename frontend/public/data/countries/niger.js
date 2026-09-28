window.GEOTARIA_COUNTRY = {
  slug: "niger",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many regions of Niger can you name?",
  subtitle: "Type a Nigerien region and the map will fill in.",
  total: 8,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/niger.svg",

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

  completeMessage: "You've completed all 8 regions of Niger! 🇳🇪",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Niger. Check your connection.",

  regions: [
    {
      id: "NE1",
      name: "Agadez",
      names: ["Agadez", "Agadez Region"]
    },
    {
      id: "NE2",
      name: "Diffa",
      names: ["Diffa", "Diffa Region"]
    },
    {
      id: "NE3",
      name: "Dosso",
      names: ["Dosso", "Dosso Region"]
    },
    {
      id: "NE4",
      name: "Maradi",
      names: ["Maradi", "Maradi Region"]
    },
    {
      id: "NE5",
      name: "Tahoua",
      names: ["Tahoua", "Tahoua Region"]
    },
    {
      id: "NE6",
      name: "Tillabéri",
      names: [
        "Tillabéri",
        "Tillaberi",
        "Tillabéri Region",
        "Tillaberi Region"
      ]
    },
    {
      id: "NE7",
      name: "Zinder",
      names: ["Zinder", "Zinder Region"]
    },
    {
      id: "NE8",
      name: "Niamey",
      names: [
        "Niamey",
        "Niamey Region",
        "Niamey Capital District",
        "Capital District of Niamey"
      ]
    }
  ]
};