// data/countries/somalia.js
// Based on the Somalia Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "somalia",
  lang: "en",
  kicker: "GeoPlay · Somalia",
  title: "How many regions of Somalia can you name?",
  subtitle: "Type a Somali region and the map will fill in.",
  total: 18,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/somalia.svg",

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
    "You've completed all 18 regions of Somalia! 🇸🇴",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Somalia. Check your connection.",

  regions: [
    {
      id: "SOAW",
      display: "Awdal",
      names: [
        "Awdal",
        "Awdal Region"
      ],
      region_id: null
    },

    {
      id: "SOBK",
      display: "Bakool",
      names: [
        "Bakool",
        "Bakool Region"
      ],
      region_id: null
    },

    {
      id: "SOBN",
      display: "Banadir",
      names: [
        "Banadir",
        "Banaadir",
        "Benadir",
        "Banadir Region",
        "Banaadir Region",
        "Benadir Region"
      ],
      region_id: null
    },

    {
      id: "SOBR",
      display: "Bari",
      names: [
        "Bari",
        "Bari Region"
      ],
      region_id: null
    },

    {
      id: "SOBY",
      display: "Bay",
      names: [
        "Bay",
        "Bay Region"
      ],
      region_id: null
    },

    {
      id: "SOGA",
      display: "Galgaduud",
      names: [
        "Galgaduud",
        "Galgaduud Region",
        "Galgudud"
      ],
      region_id: null
    },

    {
      id: "SOGE",
      display: "Gedo",
      names: [
        "Gedo",
        "Gedo Region"
      ],
      region_id: null
    },

    {
      id: "SOHI",
      display: "Hiraan",
      names: [
        "Hiraan",
        "Hiiraan",
        "Hiraan Region",
        "Hiiraan Region"
      ],
      region_id: null
    },

    {
      id: "SOJD",
      display: "Middle Juba",
      names: [
        "Middle Juba",
        "Middle Juba Region",
        "Jubbada Dhexe"
      ],
      region_id: null
    },

    {
      id: "SOJH",
      display: "Lower Juba",
      names: [
        "Lower Juba",
        "Lower Juba Region",
        "Jubbada Hoose"
      ],
      region_id: null
    },

    {
      id: "SOMU",
      display: "Mudug",
      names: [
        "Mudug",
        "Mudug Region"
      ],
      region_id: null
    },

    {
      id: "SONU",
      display: "Nugaal",
      names: [
        "Nugaal",
        "Nugal",
        "Nugaal Region",
        "Nugal Region"
      ],
      region_id: null
    },

    {
      id: "SOSA",
      display: "Sanaag",
      names: [
        "Sanaag",
        "Sanaag Region"
      ],
      region_id: null
    },

    {
      id: "SOSD",
      display: "Middle Shabelle",
      names: [
        "Middle Shabelle",
        "Middle Shabelle Region",
        "Shabeellaha Dhexe"
      ],
      region_id: null
    },

    {
      id: "SOSH",
      display: "Lower Shabelle",
      names: [
        "Lower Shabelle",
        "Lower Shabelle Region",
        "Shabeellaha Hoose"
      ],
      region_id: null
    },

    {
      id: "SOSO",
      display: "Sool",
      names: [
        "Sool",
        "Sool Region"
      ],
      region_id: null
    },

    {
      id: "SOTO",
      display: "Togdheer",
      names: [
        "Togdheer",
        "Togdheer Region",
        "Togder"
      ],
      region_id: null
    },

    {
      id: "SOWO",
      display: "Woqooyi Galbeed",
      names: [
        "Woqooyi Galbeed",
        "Woqooyi Galbeed Region",
        "Woqooyi Galbeed",
        "Northwestern",
        "North West",
        "Northwestern Region"
      ],
      region_id: null
    }
  ]
};