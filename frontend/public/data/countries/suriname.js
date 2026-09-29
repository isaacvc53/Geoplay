// data/countries/suriname.js
// Based on the Suriname Districts (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "suriname",
  lang: "en",
  kicker: "GeoPlay · Suriname",
  title: "How many districts of Suriname can you name?",
  subtitle: "Type a Surinamese district and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/suriname.svg",

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
    "You've completed all 10 districts of Suriname! 🇸🇷",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing districts are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Suriname. Check your connection.",

  regions: [
    {
      id: "SRBR",
      display: "Brokopondo",
      names: ["Brokopondo"],
      region_id: null
    },
    {
      id: "SRCM",
      display: "Commewijne",
      names: ["Commewijne"],
      region_id: null
    },
    {
      id: "SRCR",
      display: "Coronie",
      names: ["Coronie"],
      region_id: null
    },
    {
      id: "SRMA",
      display: "Marowijne",
      names: ["Marowijne"],
      region_id: null
    },
    {
      id: "SRNI",
      display: "Nickerie",
      names: ["Nickerie"],
      region_id: null
    },
    {
      id: "SRPM",
      display: "Paramaribo",
      names: ["Paramaribo"],
      region_id: null
    },
    {
      id: "SRPR",
      display: "Para",
      names: ["Para", "Para District"],
      region_id: null
    },
    {
      id: "SRSA",
      display: "Saramacca",
      names: ["Saramacca"],
      region_id: null
    },
    {
      id: "SRSI",
      display: "Sipaliwini",
      names: ["Sipaliwini"],
      region_id: null
    },
    {
      id: "SRWA",
      display: "Wanica",
      names: ["Wanica"],
      region_id: null
    }
  ]
};