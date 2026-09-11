// data/countries/armenia.js

window.GEOPLAY_COUNTRY = {
  slug: "Armenia",
  lang: "en",

  kicker: "GeoPlay · Armenia",
  title: "How many Armenian provinces can you name?",
  subtitle: "Type an Armenian province and the map will fill in.",

  total: 11,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/armenia.svg",

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
    "You've completed all 11 provinces of Armenia! 🇦🇲",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Armenia. Check your connection.",

  regions: [
    {
      id: "AMAG",
      display: "Aragatsotn",
      names: [
        "Aragatsotn",
        "Aragatsotn Province"
      ],
      region_id: null
    },

    {
      id: "AMAR",
      display: "Ararat",
      names: [
        "Ararat",
        "Ararat Province"
      ],
      region_id: null
    },

    {
      id: "AMAV",
      display: "Armavir",
      names: [
        "Armavir",
        "Armavir Province"
      ],
      region_id: null
    },

    {
      id: "AMER",
      display: "Yerevan",
      names: [
        "Yerevan",
        "Erevan",
        "Yerevan City",
        "Yerevan Municipality"
      ],
      region_id: null
    },

    {
      id: "AMGR",
      display: "Gegharkunik",
      names: [
        "Gegharkunik",
        "Gegharkunik Province"
      ],
      region_id: null
    },

    {
      id: "AMKT",
      display: "Kotayk",
      names: [
        "Kotayk",
        "Kotayk Province"
      ],
      region_id: null
    },

    {
      id: "AMLO",
      display: "Lori",
      names: [
        "Lori",
        "Lori Province"
      ],
      region_id: null
    },

    {
      id: "AMSH",
      display: "Shirak",
      names: [
        "Shirak",
        "Shirak Province"
      ],
      region_id: null
    },

    {
      id: "AMSU",
      display: "Syunik",
      names: [
        "Syunik",
        "Syunik Province"
      ],
      region_id: null
    },

    {
      id: "AMTV",
      display: "Tavush",
      names: [
        "Tavush",
        "Tavush Province"
      ],
      region_id: null
    },

    {
      id: "AMVD",
      display: "Vayots Dzor",
      names: [
        "Vayots Dzor",
        "Vayots-Dzor",
        "Vayots Dzor Province"
      ],
      region_id: null
    }
  ]
};