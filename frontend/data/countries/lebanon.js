window.GEOTARIA_COUNTRY = {
  slug: "lebanon",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many governorates of Lebanon can you name?",
  subtitle: "Type a Lebanese governorate and the map will fill in.",
  total: 8,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/lebanon.svg",

  guessPlaceholder: "Type a governorate…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My governorates",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a governorate to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage: "You've completed all 8 governorates of Lebanon! 🇱🇧",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing governorates are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Lebanon. Check your connection.",

  regions: [
    {
      id: "LBAK",
      name: "Akkar",
      names: [
        "Akkar",
        "Akkar Governorate"
      ]
    },
    {
      id: "LBAS",
      name: "North",
      names: [
        "North",
        "North Governorate",
        "North Lebanon",
        "North Lebanon Governorate"
      ]
    },
    {
      id: "LBBA",
      name: "Beirut",
      names: [
        "Beirut",
        "Beirut Governorate",
        "Beirut District"
      ]
    },
    {
      id: "LBBH",
      name: "Baalbek-El Hermel",
      names: [
        "Baalbek-El Hermel",
        "Baalbek-Hermel",
        "Baalbek-El Hermel Governorate",
        "Baalbek-Hermel Governorate"
      ]
    },
    {
      id: "LBBI",
      name: "Bekaa",
      names: [
        "Bekaa",
        "Beqaa",
        "Bekaa Governorate",
        "Beqaa Governorate"
      ]
    },
    {
      id: "LBJA",
      name: "South",
      names: [
        "South",
        "South Governorate",
        "South Lebanon",
        "South Lebanon Governorate"
      ]
    },
    {
      id: "LBJL",
      name: "Mount Lebanon",
      names: [
        "Mount Lebanon",
        "Mount Lebanon Governorate"
      ]
    },
    {
      id: "LBNA",
      name: "El Nabatieh",
      names: [
        "El Nabatieh",
        "Nabatieh",
        "Nabatiyeh",
        "El Nabatieh Governorate",
        "Nabatieh Governorate",
        "Nabatiyeh Governorate"
      ]
    }
  ]
};