// data/countries/senegal.js
// Based on the Senegal Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "senegal",
  lang: "en",
  kicker: "GeoPlay · Senegal",
  title: "How many Senegalese regions can you name?",
  subtitle: "Type a Senegalese region and the map will fill in.",
  total: 14,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/senegal.svg",

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
    "You've completed all 14 regions of Senegal! 🇸🇳",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Senegal. Check your connection.",

  regions: [
    {
      id: "SNDB",
      display: "Diourbel",
      names: [
        "Diourbel",
        "Diourbel Region"
      ],
      region_id: null
    },

    {
      id: "SNDK",
      display: "Dakar",
      names: [
        "Dakar",
        "Dakar Region"
      ],
      region_id: null
    },

    {
      id: "SNFK",
      display: "Fatick",
      names: [
        "Fatick",
        "Fatick Region"
      ],
      region_id: null
    },

    {
      id: "SNKA",
      display: "Kaffrine",
      names: [
        "Kaffrine",
        "Kaffrine Region"
      ],
      region_id: null
    },

    {
      id: "SNKD",
      display: "Kolda",
      names: [
        "Kolda",
        "Kolda Region"
      ],
      region_id: null
    },

    {
      id: "SNKE",
      display: "Kédougou",
      names: [
        "Kédougou",
        "Kedougou",
        "Kédougou Region",
        "Kedougou Region"
      ],
      region_id: null
    },

    {
      id: "SNKL",
      display: "Kaolack",
      names: [
        "Kaolack",
        "Kaolack Region"
      ],
      region_id: null
    },

    {
      id: "SNLG",
      display: "Louga",
      names: [
        "Louga",
        "Louga Region"
      ],
      region_id: null
    },

    {
      id: "SNMT",
      display: "Matam",
      names: [
        "Matam",
        "Matam Region"
      ],
      region_id: null
    },

    {
      id: "SNSE",
      display: "Sédhiou",
      names: [
        "Sédhiou",
        "Sedhiou",
        "Sédhiou Region",
        "Sedhiou Region"
      ],
      region_id: null
    },

    {
      id: "SNSL",
      display: "Saint-Louis",
      names: [
        "Saint-Louis",
        "Saint Louis",
        "Saint-Louis Region",
        "Saint Louis Region"
      ],
      region_id: null
    },

    {
      id: "SNTC",
      display: "Tambacounda",
      names: [
        "Tambacounda",
        "Tambacounda Region"
      ],
      region_id: null
    },

    {
      id: "SNTH",
      display: "Thiès",
      names: [
        "Thiès",
        "Thies",
        "Thiès Region",
        "Thies Region"
      ],
      region_id: null
    },

    {
      id: "SNZG",
      display: "Ziguinchor",
      names: [
        "Ziguinchor",
        "Ziguinchor Region"
      ],
      region_id: null
    }
  ]
};