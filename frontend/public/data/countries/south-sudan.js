// data/countries/south-sudan.js
// Based on the South Sudan States (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "south-sudan",
  lang: "en",
  kicker: "GeoPlay · South Sudan",
  title: "How many states of South Sudan can you name?",
  subtitle: "Type a South Sudanese state and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/south-sudan.svg",

  guessPlaceholder: "Type a state…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My states",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a state to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 10 states of South Sudan! 🇸🇸",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing states are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of South Sudan. Check your connection.",

  regions: [
    {
      id: "SSBN",
      display: "Northern Bahr el Ghazal",
      names: ["Northern Bahr el Ghazal"],
      region_id: null
    },
    {
      id: "SSBW",
      display: "Western Bahr el Ghazal",
      names: ["Western Bahr el Ghazal"],
      region_id: null
    },
    {
      id: "SSEC",
      display: "Central Equatoria",
      names: ["Central Equatoria"],
      region_id: null
    },
    {
      id: "SSEE",
      display: "Eastern Equatoria",
      names: ["Eastern Equatoria"],
      region_id: null
    },
    {
      id: "SSEW",
      display: "Western Equatoria",
      names: ["Western Equatoria"],
      region_id: null
    },
    {
      id: "SSJG",
      display: "Jonglei",
      names: ["Jonglei"],
      region_id: null
    },
    {
      id: "SSLK",
      display: "Lakes",
      names: ["Lakes"],
      region_id: null
    },
    {
      id: "SSNU",
      display: "Upper Nile",
      names: ["Upper Nile"],
      region_id: null
    },
    {
      id: "SSUY",
      display: "Unity",
      names: ["Unity"],
      region_id: null
    },
    {
      id: "SSWR",
      display: "Warrap",
      names: ["Warrap"],
      region_id: null
    }
  ]
};