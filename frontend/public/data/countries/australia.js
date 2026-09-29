// data/countries/australia.js
// Based on the Australia Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "australia",
  lang: "en",
  kicker: "GeoPlay · Australia",
  title: "How many states and territories of Australia can you name?",
  subtitle: "Type an Australian state or territory and the map will fill in.",
  total: 8,
  quizSeconds: 5 * 60,

  geoFile: "../data/geo/australia.svg",

  guessPlaceholder: "Type a state or territory…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My states",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a state or territory to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 8 states and territories of Australia! 🇦🇺",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/8. The missing states and territories are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Australia. Check your connection.",

  regions: [
    {
      id: "AU-ACT",
      display: "Australian Capital Territory",
      names: ["Australian Capital Territory", "ACT", "Canberra"],
      region_id: null
    },
    {
      id: "AU-NSW",
      display: "New South Wales",
      names: ["New South Wales", "NSW"],
      region_id: null
    },
    {
      id: "AU-NT",
      display: "Northern Territory",
      names: ["Northern Territory", "NT"],
      region_id: null
    },
    {
      id: "AU-QLD",
      display: "Queensland",
      names: ["Queensland", "QLD"],
      region_id: null
    },
    {
      id: "AU-SA",
      display: "South Australia",
      names: ["South Australia", "SA"],
      region_id: null
    },
    {
      id: "AU-TAS",
      display: "Tasmania",
      names: ["Tasmania", "TAS"],
      region_id: null
    },
    {
      id: "AU-VIC",
      display: "Victoria",
      names: ["Victoria", "VIC"],
      region_id: null
    },
    {
      id: "AU-WA",
      display: "Western Australia",
      names: ["Western Australia", "WA"],
      region_id: null
    }
  ]
};