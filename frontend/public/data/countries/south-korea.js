// data/countries/south-korea.js
// Based on the South Korea Provinces (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "south-korea",
  lang: "en",
  kicker: "GeoPlay · South Korea",
  title: "How many provinces of South Korea can you name?",
  subtitle: "Type a South Korean province and the map will fill in.",
  total: 17,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/south-korea.svg",

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

  completeMessage:
    "You've completed all 17 provinces of South Korea! 🇰🇷",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of South Korea. Check your connection.",

  regions: [
    {
      id: "KR11",
      display: "Seoul",
      names: ["Seoul"],
      region_id: null
    },
    {
      id: "KR26",
      display: "Busan",
      names: ["Busan"],
      region_id: null
    },
    {
      id: "KR27",
      display: "Daegu",
      names: ["Daegu"],
      region_id: null
    },
    {
      id: "KR28",
      display: "Incheon",
      names: ["Incheon"],
      region_id: null
    },
    {
      id: "KR29",
      display: "Gwangju",
      names: ["Gwangju"],
      region_id: null
    },
    {
      id: "KR30",
      display: "Daejeon",
      names: ["Daejeon"],
      region_id: null
    },
    {
      id: "KR31",
      display: "Ulsan",
      names: ["Ulsan"],
      region_id: null
    },
    {
      id: "KR41",
      display: "Gyeonggi",
      names: ["Gyeonggi"],
      region_id: null
    },
    {
      id: "KR42",
      display: "Gangwon",
      names: ["Gangwon"],
      region_id: null
    },
    {
      id: "KR43",
      display: "North Chungcheong",
      names: ["North Chungcheong"],
      region_id: null
    },
    {
      id: "KR44",
      display: "South Chungcheong",
      names: ["South Chungcheong"],
      region_id: null
    },
    {
      id: "KR45",
      display: "North Jeolla",
      names: ["North Jeolla"],
      region_id: null
    },
    {
      id: "KR46",
      display: "South Jeolla",
      names: ["South Jeolla"],
      region_id: null
    },
    {
      id: "KR47",
      display: "North Gyeongsang",
      names: ["North Gyeongsang"],
      region_id: null
    },
    {
      id: "KR48",
      display: "South Gyeongsang",
      names: ["South Gyeongsang"],
      region_id: null
    },
    {
      id: "KR49",
      display: "Jeju",
      names: ["Jeju"],
      region_id: null
    },
    {
      id: "KR50",
      display: "Sejong",
      names: ["Sejong"],
      region_id: null
    }
  ]
};