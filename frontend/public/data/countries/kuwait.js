window.GEOTARIA_COUNTRY = {
  slug: "kuwait",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many governorates of Kuwait can you name?",
  subtitle: "Type a Kuwaiti governorate and the map will fill in.",
  total: 6,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/kuwait.svg",

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

  completeMessage: "You've completed all 6 governorates of Kuwait! 🇰🇼",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing governorates are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Kuwait. Check your connection.",

  regions: [
    {
      id: "KWAH",
      name: "Al Ahmadi",
      names: [
        "Al Ahmadi",
        "Ahmadi",
        "Al Ahmadi Governorate",
        "Ahmadi Governorate"
      ]
    },
    {
      id: "KWFA",
      name: "Al Farwaniyah",
      names: [
        "Al Farwaniyah",
        "Farwaniyah",
        "Al Farwaniyah Governorate",
        "Farwaniyah Governorate"
      ]
    },
    {
      id: "KWHA",
      name: "Hawalli",
      names: [
        "Hawalli",
        "Hawalli Governorate"
      ]
    },
    {
      id: "KWJA",
      name: "Al Jahrah",
      names: [
        "Al Jahrah",
        "Al Jahra",
        "Jahra",
        "Al Jahrah Governorate",
        "Al Jahra Governorate",
        "Jahra Governorate"
      ]
    },
    {
      id: "KWKU",
      name: "Al Asimah",
      names: [
        "Al Asimah",
        "Al Asimah Governorate",
        "Capital Governorate"
      ]
    },
    {
      id: "KWMU",
      name: "Mubarak Al-Kabeer",
      names: [
        "Mubarak Al-Kabeer",
        "Mubarak Al Kabeer",
        "Mubarak Al-Kabeer Governorate",
        "Mubarak Al Kabeer Governorate"
      ]
    }
  ]
};