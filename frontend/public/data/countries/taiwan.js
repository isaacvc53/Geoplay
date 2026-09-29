// data/countries/taiwan.js
// Based on the Taiwan Administrative Divisions (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "taiwan",
  lang: "en",
  kicker: "GeoPlay · Taiwan",
  title: "How many administrative divisions of Taiwan can you name?",
  subtitle: "Type a Taiwanese administrative division and the map will fill in.",
  total: 22,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/taiwan.svg",

  guessPlaceholder: "Type an administrative division…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My divisions",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over an administrative division to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 22 administrative divisions of Taiwan! 🇹🇼",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing administrative divisions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Taiwan. Check your connection.",

  regions: [
    {
      id: "TWCHA",
      display: "Changhua",
      names: ["Changhua"],
      region_id: null
    },
    {
      id: "TWCYI",
      display: "Chiayi City",
      names: ["Chiayi City", "Chiayi"],
      region_id: null
    },
    {
      id: "TWCYQ",
      display: "Chiayi",
      names: ["Chiayi", "Chiayi County"],
      region_id: null
    },
    {
      id: "TWHSQ",
      display: "Hsinchu",
      names: ["Hsinchu", "Hsinchu County"],
      region_id: null
    },
    {
      id: "TWHSZ",
      display: "Hsinchu City",
      names: ["Hsinchu City"],
      region_id: null
    },
    {
      id: "TWHUA",
      display: "Hualien",
      names: ["Hualien", "Hualien County"],
      region_id: null
    },
    {
      id: "TWILA",
      display: "Yilan",
      names: ["Yilan", "Yilan County"],
      region_id: null
    },
    {
      id: "TWKEE",
      display: "Keelung City",
      names: ["Keelung City", "Keelung"],
      region_id: null
    },
    {
      id: "TWKHH",
      display: "Kaohsiung City",
      names: ["Kaohsiung City", "Kaohsiung"],
      region_id: null
    },
    {
      id: "TWKIN",
      display: "Kinmen",
      names: ["Kinmen", "Kinmen County"],
      region_id: null
    },
    {
      id: "TWLIE",
      display: "Matsu Islands",
      names: ["Matsu Islands", "Lienchiang", "Lienchiang County"],
      region_id: null
    },
    {
      id: "TWMIA",
      display: "Miaoli",
      names: ["Miaoli", "Miaoli County"],
      region_id: null
    },
    {
      id: "TWNAN",
      display: "Nantou",
      names: ["Nantou", "Nantou County"],
      region_id: null
    },
    {
      id: "TWNWT",
      display: "New Taipei City",
      names: ["New Taipei City", "New Taipei"],
      region_id: null
    },
    {
      id: "TWPEN",
      display: "Penghu",
      names: ["Penghu", "Penghu County"],
      region_id: null
    },
    {
      id: "TWPIF",
      display: "Pingtung",
      names: ["Pingtung", "Pingtung County"],
      region_id: null
    },
    {
      id: "TWTAO",
      display: "Taoyuan",
      names: ["Taoyuan", "Taoyuan City"],
      region_id: null
    },
    {
      id: "TWTNN",
      display: "Tainan City",
      names: ["Tainan City", "Tainan"],
      region_id: null
    },
    {
      id: "TWTPE",
      display: "Taipei City",
      names: ["Taipei City", "Taipei"],
      region_id: null
    },
    {
      id: "TWTTT",
      display: "Taitung",
      names: ["Taitung", "Taitung County"],
      region_id: null
    },
    {
      id: "TWTXG",
      display: "Taichung City",
      names: ["Taichung City", "Taichung"],
      region_id: null
    },
    {
      id: "TWYUN",
      display: "Yunlin",
      names: ["Yunlin", "Yunlin County"],
      region_id: null
    }
  ]
};