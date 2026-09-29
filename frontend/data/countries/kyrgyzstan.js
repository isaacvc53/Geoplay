window.GEOTARIA_COUNTRY = {
  slug: "kyrgyzstan",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many regions and cities of Kyrgyzstan can you name?",
  subtitle: "Type a Kyrgyz region or city and the map will fill in.",
  total: 9,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/kyrgyzstan.svg",

  guessPlaceholder: "Type a region or city…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My regions and cities",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a region or city to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage: "You've completed all 9 regions and cities of Kyrgyzstan! 🇰🇬",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions and cities are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Kyrgyzstan. Check your connection.",

  regions: [
    {
      id: "KGB",
      name: "Batken",
      names: [
        "Batken",
        "Batken Region",
        "Batken Province"
      ]
    },
    {
      id: "KGC",
      name: "Chui",
      names: [
        "Chui",
        "Chuy",
        "Chui Region",
        "Chuy Region",
        "Chui Province",
        "Chuy Province"
      ]
    },
    {
      id: "KGGB",
      name: "Bishkek (city)",
      names: [
        "Bishkek",
        "Bishkek City",
        "City of Bishkek"
      ]
    },
    {
      id: "KGGO",
      name: "Osh (city)",
      names: [
        "Osh",
        "Osh City",
        "City of Osh"
      ]
    },
    {
      id: "KGJ",
      name: "Jalal-Abad",
      names: [
        "Jalal-Abad",
        "Jalal Abad",
        "Jalal-Abad Region",
        "Jalal Abad Region",
        "Jalal-Abad Province"
      ]
    },
    {
      id: "KGN",
      name: "Naryn",
      names: [
        "Naryn",
        "Naryn Region",
        "Naryn Province"
      ]
    },
    {
      id: "KGO",
      name: "Osh",
      names: [
        "Osh",
        "Osh Region",
        "Osh Province"
      ]
    },
    {
      id: "KGT",
      name: "Talas",
      names: [
        "Talas",
        "Talas Region",
        "Talas Province"
      ]
    },
    {
      id: "KGY",
      name: "Issyk-Kul",
      names: [
        "Issyk-Kul",
        "Issyk Kul",
        "Issyk-Kul Region",
        "Issyk Kul Region",
        "Issyk-Kul Province"
      ]
    }
  ]
};