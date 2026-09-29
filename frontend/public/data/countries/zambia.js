// data/countries/zambia.js
// Based on the Zambia Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "zambia",
  lang: "en",
  kicker: "GeoPlay · Zambia",
  title: "How many provinces of Zambia can you name?",
  subtitle: "Type a Zambian province and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/zambia.svg",

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
    "You've completed all 10 provinces of Zambia! 🇿🇲",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/10. The missing provinces are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Zambia. Check your connection.",

  regions: [
    {
      id: "ZM01",
      display: "Western",
      names: ["Western", "Western Province"],
      region_id: null
    },
    {
      id: "ZM02",
      display: "Central",
      names: ["Central", "Central Province"],
      region_id: null
    },
    {
      id: "ZM03",
      display: "Eastern",
      names: ["Eastern", "Eastern Province"],
      region_id: null
    },
    {
      id: "ZM04",
      display: "Luapula",
      names: ["Luapula", "Luapula Province"],
      region_id: null
    },
    {
      id: "ZM05",
      display: "Northern",
      names: ["Northern", "Northern Province"],
      region_id: null
    },
    {
      id: "ZM06",
      display: "North-Western",
      names: ["North-Western", "Northwestern", "North-Western Province"],
      region_id: null
    },
    {
      id: "ZM07",
      display: "Southern",
      names: ["Southern", "Southern Province"],
      region_id: null
    },
    {
      id: "ZM08",
      display: "Copperbelt",
      names: ["Copperbelt", "Copperbelt Province"],
      region_id: null
    },
    {
      id: "ZM09",
      display: "Lusaka",
      names: ["Lusaka", "Lusaka Province"],
      region_id: null
    },
    {
      id: "ZM10",
      display: "Muchinga",
      names: ["Muchinga", "Muchinga Province"],
      region_id: null
    }
  ]
};