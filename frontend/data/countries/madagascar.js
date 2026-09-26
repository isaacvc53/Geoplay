window.GEOTARIA_COUNTRY = {
  slug: "madagascar",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many provinces of Madagascar can you name?",
  subtitle: "Type a Malagasy province and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/madagascar.svg",

  guessPlaceholder: "Type a province…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My provinces",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a province to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage: "You've completed all 6 provinces of Madagascar! 🇲🇬",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Madagascar. Check your connection.",

  regions: [
    {
      id: "MGA",
      name: "Toamasina",
      names: [
        "Toamasina",
        "Tamatave",
        "Toamasina Province"
      ]
    },
    {
      id: "MGD",
      name: "Antsiranana",
      names: [
        "Antsiranana",
        "Diego Suarez",
        "Diego-Suarez",
        "Antsiranana Province"
      ]
    },
    {
      id: "MGF",
      name: "Fianarantsoa",
      names: [
        "Fianarantsoa",
        "Fianarantsoa Province"
      ]
    },
    {
      id: "MGM",
      name: "Mahajanga",
      names: [
        "Mahajanga",
        "Majunga",
        "Mahajanga Province"
      ]
    },
    {
      id: "MGT",
      name: "Antananarivo",
      names: [
        "Antananarivo",
        "Tananarive",
        "Antananarivo Province"
      ]
    },
    {
      id: "MGU",
      name: "Toliara",
      names: [
        "Toliara",
        "Tuléar",
        "Tulear",
        "Toliara Province"
      ]
    }
  ]
};