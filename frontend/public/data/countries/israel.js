window.GEOTARIA_COUNTRY = {
  slug: "israel",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many districts of Israel can you name?",
  subtitle: "Type an Israeli district and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/israel.svg",

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

  completeMessage: "You've completed all 6 districts of Israel! 🇮🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing districts are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Israel. Check your connection.",

  regions: [
    {
      id: "ILD",
      name: "HaDarom",
      names: [
        "HaDarom",
        "Hadaron",
        "Southern District",
        "South District"
      ]
    },
    {
      id: "ILHA",
      name: "Haifa",
      names: [
        "Haifa",
        "Haifa District"
      ]
    },
    {
      id: "ILJM",
      name: "Jerusalem",
      names: [
        "Jerusalem",
        "Jerusalem District"
      ]
    },
    {
      id: "ILM",
      name: "HaMerkaz",
      names: [
        "HaMerkaz",
        "Hamerkaz",
        "Central District",
        "Centre District"
      ]
    },
    {
      id: "ILTA",
      name: "Tel Aviv",
      names: [
        "Tel Aviv",
        "Tel Aviv District"
      ]
    },
    {
      id: "ILZ",
      name: "HaZafon",
      names: [
        "HaZafon",
        "Hazafon",
        "Northern District",
        "North District"
      ]
    }
  ]
};