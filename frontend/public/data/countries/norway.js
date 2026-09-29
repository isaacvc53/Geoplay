window.GEOTARIA_COUNTRY = {
  slug: "norway",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many counties and cities of Norway can you name?",
  subtitle: "Type a Norwegian county or city and the map will fill in.",
  total: 11,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/norway.svg",

  guessPlaceholder: "Type a county or city…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My counties and cities",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a county or city to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage: "You've completed all 11 counties and cities of Norway! 🇳🇴",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing counties and cities are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Norway. Check your connection.",

  regions: [
    {
      id: "NO03",
      name: "Oslo",
      names: [
        "Oslo",
        "Oslo Municipality",
        "Oslo County"
      ]
    },
    {
      id: "NO11",
      name: "Rogaland",
      names: [
        "Rogaland",
        "Rogaland County"
      ]
    },
    {
      id: "NO15",
      name: "Møre og Romsdal",
      names: [
        "Møre og Romsdal",
        "More og Romsdal",
        "Møre og Romsdal County"
      ]
    },
    {
      id: "NO18",
      name: "Nordland",
      names: [
        "Nordland",
        "Nordland County"
      ]
    },
    {
      id: "NO30",
      name: "Viken",
      names: [
        "Viken",
        "Viken County"
      ]
    },
    {
      id: "NO34",
      name: "Innlandet",
      names: [
        "Innlandet",
        "Innlandet County"
      ]
    },
    {
      id: "NO38",
      name: "Vestfold og Telemark",
      names: [
        "Vestfold og Telemark",
        "Vestfold and Telemark",
        "Vestfold og Telemark County",
        "Vestfold and Telemark County"
      ]
    },
    {
      id: "NO42",
      name: "Agder",
      names: [
        "Agder",
        "Agder County"
      ]
    },
    {
      id: "NO46",
      name: "Vestland",
      names: [
        "Vestland",
        "Vestland County"
      ]
    },
    {
      id: "NO50",
      name: "Trøndelag",
      names: [
        "Trøndelag",
        "Trondelag",
        "Trøndelag County",
        "Trondelag County"
      ]
    },
    {
      id: "NO54",
      name: "Troms og Finnmark",
      names: [
        "Troms og Finnmark",
        "Troms and Finnmark",
        "Troms og Finnmark County",
        "Troms and Finnmark County"
      ]
    }
  ]
};