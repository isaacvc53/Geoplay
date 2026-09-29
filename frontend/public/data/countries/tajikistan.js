// data/countries/tajikistan.js
// Based on the Tajikistan Administrative Divisions (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "tajikistan",
  lang: "en",
  kicker: "GeoPlay · Tajikistan",
  title: "How many administrative divisions of Tajikistan can you name?",
  subtitle: "Type a Tajik administrative division and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/tajikistan.svg",

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
    "You've completed all 5 administrative divisions of Tajikistan! 🇹🇯",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing administrative divisions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Tajikistan. Check your connection.",

  regions: [
    {
      id: "TJDU",
      display: "Dushanbe",
      names: ["Dushanbe"],
      region_id: null
    },
    {
      id: "TJGB",
      display: "Gorno-Badakhshan",
      names: ["Gorno-Badakhshan", "Gorno-Badakhshan Autonomous Province"],
      region_id: null
    },
    {
      id: "TJKT",
      display: "Khatlon",
      names: ["Khatlon"],
      region_id: null
    },
    {
      id: "TJRA",
      display: "Tadzhikistan Territories",
      names: ["Tadzhikistan Territories", "Republican Subordination Districts"],
      region_id: null
    },
    {
      id: "TJSU",
      display: "Leninabad",
      names: ["Leninabad", "Sughd"],
      region_id: null
    }
  ]
};