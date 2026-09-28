// data/countries/el-salvador.js
// Based on the El Salvador Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "el-salvador",
  lang: "en",
  kicker: "GeoPlay · El Salvador",
  title: "How many departments of El Salvador can you name?",
  subtitle: "Type a Salvadoran department and the map will fill in.",
  total: 14,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/el-salvador.svg",

  guessPlaceholder: "Type a department…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My departments",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a department to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 14 departments of El Salvador! 🇸🇻",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing departments are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of El Salvador. Check your connection.",

  regions: [
    {
      id: "SVAH",
      display: "Ahuachapán",
      names: [
        "Ahuachapán",
        "Ahuachapan",
        "Ahuachapán Department",
        "Ahuachapan Department"
      ],
      region_id: null
    },

    {
      id: "SVCA",
      display: "Cabañas",
      names: [
        "Cabañas",
        "Cabanas",
        "Cabañas Department",
        "Cabanas Department"
      ],
      region_id: null
    },

    {
      id: "SVCH",
      display: "Chalatenango",
      names: [
        "Chalatenango",
        "Chalatenango Department"
      ],
      region_id: null
    },

    {
      id: "SVCU",
      display: "Cuscatlán",
      names: [
        "Cuscatlán",
        "Cuscatlan",
        "Cuscatlán Department",
        "Cuscatlan Department"
      ],
      region_id: null
    },

    {
      id: "SVLI",
      display: "La Libertad",
      names: [
        "La Libertad",
        "La Libertad Department"
      ],
      region_id: null
    },

    {
      id: "SVMO",
      display: "Morazán",
      names: [
        "Morazán",
        "Morazan",
        "Morazán Department",
        "Morazan Department"
      ],
      region_id: null
    },

    {
      id: "SVPA",
      display: "La Paz",
      names: [
        "La Paz",
        "La Paz Department"
      ],
      region_id: null
    },

    {
      id: "SVSA",
      display: "Santa Ana",
      names: [
        "Santa Ana",
        "Santa Ana Department"
      ],
      region_id: null
    },

    {
      id: "SVSM",
      display: "San Miguel",
      names: [
        "San Miguel",
        "San Miguel Department"
      ],
      region_id: null
    },

    {
      id: "SVSO",
      display: "Sonsonate",
      names: [
        "Sonsonate",
        "Sonsonate Department"
      ],
      region_id: null
    },

    {
      id: "SVSS",
      display: "San Salvador",
      names: [
        "San Salvador",
        "San Salvador Department"
      ],
      region_id: null
    },

    {
      id: "SVSV",
      display: "San Vicente",
      names: [
        "San Vicente",
        "San Vicente Department"
      ],
      region_id: null
    },

    {
      id: "SVUN",
      display: "La Unión",
      names: [
        "La Unión",
        "La Union",
        "La Unión Department",
        "La Union Department"
      ],
      region_id: null
    },

    {
      id: "SVUS",
      display: "Usulután",
      names: [
        "Usulután",
        "Usulutan",
        "Usulután Department",
        "Usulutan Department"
      ],
      region_id: null
    }
  ]
};