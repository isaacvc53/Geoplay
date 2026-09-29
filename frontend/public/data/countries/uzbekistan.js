// data/countries/uzbekistan.js
// Based on the Uzbekistan Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "uzbekistan",
  lang: "en",
  kicker: "GeoPlay · Uzbekistan",
  title: "How many regions of Uzbekistan can you name?",
  subtitle: "Type a Uzbek region and the map will fill in.",
  total: 14,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/uzbekistan.svg",

  guessPlaceholder: "Type a region…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My regions",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a region to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 14 regions of Uzbekistan! 🇺🇿",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/14. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Uzbekistan. Check your connection.",

  regions: [
    {
      id: "UZAN",
      display: "Andijon",
      names: ["Andijon", "Andijan"],
      region_id: null
    },
    {
      id: "UZBU",
      display: "Bukhoro",
      names: ["Bukhoro", "Bukhara"],
      region_id: null
    },
    {
      id: "UZFA",
      display: "Ferghana",
      names: ["Ferghana", "Fergana"],
      region_id: null
    },
    {
      id: "UZJI",
      display: "Jizzakh",
      names: ["Jizzakh", "Jizzax"],
      region_id: null
    },
    {
      id: "UZNG",
      display: "Namangan",
      names: ["Namangan"],
      region_id: null
    },
    {
      id: "UZNW",
      display: "Navoi",
      names: ["Navoi", "Navoiy"],
      region_id: null
    },
    {
      id: "UZQA",
      display: "Kashkadarya",
      names: ["Kashkadarya", "Qashqadaryo"],
      region_id: null
    },
    {
      id: "UZQR",
      display: "Karakalpakstan",
      names: ["Karakalpakstan", "Qoraqalpog'iston"],
      region_id: null
    },
    {
      id: "UZSA",
      display: "Samarkand",
      names: ["Samarkand", "Samarqand"],
      region_id: null
    },
    {
      id: "UZSI",
      display: "Sirdaryo",
      names: ["Sirdaryo", "Syrdarya"],
      region_id: null
    },
    {
      id: "UZSU",
      display: "Surkhandarya",
      names: ["Surkhandarya", "Surxondaryo"],
      region_id: null
    },
    {
      id: "UZTK",
      display: "Tashkent",
      names: ["Tashkent"],
      region_id: null
    },
    {
      id: "UZTO",
      display: "Tashkent",
      names: ["Tashkent", "Tashkent Region", "Tashkent Province"],
      region_id: null
    },
    {
      id: "UZXO",
      display: "Khorezm",
      names: ["Khorezm", "Xorazm"],
      region_id: null
    }
  ]
};