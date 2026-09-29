// data/countries/bhutan.js
// Based on the Bhutan Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "bhutan",
  lang: "en",
  kicker: "GeoPlay · Bhutan",
  title: "How many districts of Bhutan can you name?",
  subtitle: "Type a Bhutanese district and the map will fill in.",
  total: 20,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/bhutan.svg",

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

  completeMessage:
    "You've completed all 20 districts of Bhutan! 🇧🇹",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/20. The missing districts are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Bhutan. Check your connection.",

  regions: [
    {
      id: "BT11",
      display: "Paro",
      names: ["Paro"],
      region_id: null
    },
    {
      id: "BT12",
      display: "Chhukha",
      names: ["Chhukha", "Chukha"],
      region_id: null
    },
    {
      id: "BT13",
      display: "Ha",
      names: ["Ha"],
      region_id: null
    },
    {
      id: "BT14",
      display: "Samchi",
      names: ["Samchi", "Samtse"],
      region_id: null
    },
    {
      id: "BT15",
      display: "Thimphu",
      names: ["Thimphu"],
      region_id: null
    },
    {
      id: "BT21",
      display: "Chirang",
      names: ["Chirang", "Tsirang"],
      region_id: null
    },
    {
      id: "BT22",
      display: "Daga",
      names: ["Daga", "Dagana"],
      region_id: null
    },
    {
      id: "BT23",
      display: "Punakha",
      names: ["Punakha"],
      region_id: null
    },
    {
      id: "BT24",
      display: "Wangdi Phodrang",
      names: ["Wangdi Phodrang", "Wangdue Phodrang", "Wangdue"],
      region_id: null
    },
    {
      id: "BT31",
      display: "Geylegphug",
      names: ["Geylegphug", "Sarpang"],
      region_id: null
    },
    {
      id: "BT32",
      display: "Tongsa",
      names: ["Tongsa", "Trongsa"],
      region_id: null
    },
    {
      id: "BT33",
      display: "Bumthang",
      names: ["Bumthang"],
      region_id: null
    },
    {
      id: "BT34",
      display: "Shemgang",
      names: ["Shemgang", "Zhemgang"],
      region_id: null
    },
    {
      id: "BT41",
      display: "Tashigang",
      names: ["Tashigang", "Trashigang"],
      region_id: null
    },
    {
      id: "BT42",
      display: "Mongar",
      names: ["Mongar"],
      region_id: null
    },
    {
      id: "BT43",
      display: "Pemagatsel",
      names: ["Pemagatsel", "Pema Gatshel"],
      region_id: null
    },
    {
      id: "BT44",
      display: "Lhuntshi",
      names: ["Lhuntshi", "Lhuentse"],
      region_id: null
    },
    {
      id: "BT45",
      display: "Samdrup Jongkhar",
      names: ["Samdrup Jongkhar"],
      region_id: null
    },
    {
      id: "BTGA",
      display: "Gasa",
      names: ["Gasa"],
      region_id: null
    },
    {
      id: "BTTY",
      display: "Tashi Yangtse",
      names: ["Tashi Yangtse", "Trashiyangtse"],
      region_id: null
    }
  ]
};