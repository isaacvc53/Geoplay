// data/countries/yemen.js
// Based on the Yemen Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "yemen",
  lang: "en",
  kicker: "GeoPlay · Yemen",
  title: "How many governorates of Yemen can you name?",
  subtitle: "Type a Yemeni governorate and the map will fill in.",
  total: 22,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/yemen.svg",

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

  completeMessage:
    "You've completed all 22 governorates of Yemen! 🇾🇪",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/22. The missing governorates are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Yemen. Check your connection.",

  regions: [
    {
      id: "YEAB",
      display: "Abyan",
      names: ["Abyan"],
      region_id: null
    },
    {
      id: "YEAD",
      display: "Aden",
      names: ["Aden"],
      region_id: null
    },
    {
      id: "YEAM",
      display: "Amran",
      names: ["Amran", "Amran Governorate"],
      region_id: null
    },
    {
      id: "YEBA",
      display: "Al Bayda",
      names: ["Al Bayda", "Al-Bayda", "Bayda"],
      region_id: null
    },
    {
      id: "YEDA",
      display: "Ad Dali'",
      names: ["Ad Dali'", "Al Dhale'e", "Dhale"],
      region_id: null
    },
    {
      id: "YEDH",
      display: "Dhamar",
      names: ["Dhamar"],
      region_id: null
    },
    {
      id: "YEHD",
      display: "Hadramawt",
      names: ["Hadramawt", "Hadhramaut", "Hadramout"],
      region_id: null
    },
    {
      id: "YEHJ",
      display: "Hajjah",
      names: ["Hajjah"],
      region_id: null
    },
    {
      id: "YEHU",
      display: "Al Hodeidah",
      names: ["Al Hodeidah", "Hodeidah", "Al Hudaydah"],
      region_id: null
    },
    {
      id: "YEIB",
      display: "Ibb",
      names: ["Ibb"],
      region_id: null
    },
    {
      id: "YEJA",
      display: "Al Jawf",
      names: ["Al Jawf", "Jawf"],
      region_id: null
    },
    {
      id: "YELA",
      display: "Lahj",
      names: ["Lahj"],
      region_id: null
    },
    {
      id: "YEMA",
      display: "Ma'rib",
      names: ["Ma'rib", "Marib", "Ma'rib Governorate"],
      region_id: null
    },
    {
      id: "YEMR",
      display: "Al Maharah",
      names: ["Al Maharah", "Al Mahra", "Mahra"],
      region_id: null
    },
    {
      id: "YEMW",
      display: "Al Mahwit",
      names: ["Al Mahwit", "Mahwit"],
      region_id: null
    },
    {
      id: "YERA",
      display: "Raymah",
      names: ["Raymah", "Raimah"],
      region_id: null
    },
    {
      id: "YESA",
      display: "Sana'a City",
      names: ["Sana'a City", "Sanaa City", "Amanat Al Asimah"],
      region_id: null
    },
    {
      id: "YESD",
      display: "Sa'dah",
      names: ["Sa'dah", "Saada", "Sadah"],
      region_id: null
    },
    {
      id: "YESH",
      display: "Shabwah",
      names: ["Shabwah", "Shabwa"],
      region_id: null
    },
    {
      id: "YESN",
      display: "Sana'a",
      names: ["Sana'a", "Sanaa", "Sana'a Governorate"],
      region_id: null
    },
    {
      id: "YESU",
      display: "Socotra",
      names: ["Socotra", "Socotra Governorate"],
      region_id: null
    },
    {
      id: "YETA",
      display: "Ta'iz",
      names: ["Ta'iz", "Taiz", "Ta'izz"],
      region_id: null
    }
  ]
};