window.GEOTARIA_COUNTRY = {
  slug: "pakistan",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many provinces and territories of Pakistan can you name?",
  subtitle: "Type a Pakistani province or territory and the map will fill in.",
  total: 7,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/pakistan.svg",

  guessPlaceholder: "Type a province or territory…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My provinces and territories",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a province or territory to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage: "You've completed all 7 provinces and territories of Pakistan! 🇵🇰",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces and territories are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Pakistan. Check your connection.",

  regions: [
    {
      id: "PKBA",
      name: "Baluchistan",
      names: [
        "Baluchistan",
        "Balochistan",
        "Baluchistan Province",
        "Balochistan Province"
      ]
    },
    {
      id: "PKGB",
      name: "Northern Areas",
      names: [
        "Northern Areas",
        "Gilgit-Baltistan",
        "Northern Areas of Pakistan"
      ]
    },
    {
      id: "PKIS",
      name: "F.C.T.",
      names: [
        "F.C.T.",
        "FCT",
        "Islamabad Capital Territory",
        "Islamabad",
        "Federal Capital Territory"
      ]
    },
    {
      id: "PKJK",
      name: "Azad Kashmir",
      names: [
        "Azad Kashmir",
        "Azad Jammu and Kashmir",
        "AJK"
      ]
    },
    {
      id: "PKKP",
      name: "K.P.",
      names: [
        "K.P.",
        "KP",
        "Khyber Pakhtunkhwa",
        "Khyber Pakhtunkhwa Province",
        "North-West Frontier Province",
        "NWFP"
      ]
    },
    {
      id: "PKPB",
      name: "Punjab",
      names: [
        "Punjab",
        "Punjab Province"
      ]
    },
    {
      id: "PKSD",
      name: "Sind",
      names: [
        "Sind",
        "Sindh",
        "Sind Province",
        "Sindh Province"
      ]
    }
  ]
};