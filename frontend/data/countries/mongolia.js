// data/countries/mongolia.js
// Based on the SimpleMaps Mongolia Admin Areas (level 1) SVG.
// The SVG uses IDs such as MN035 and stores region names in the `name` attribute.

window.GEOPLAY_COUNTRY = {
  slug: "Mongolia",
  lang: "en",
  kicker: "GeoPlay · Mongolia",
  title: "How many Mongolian provinces can you name?",
  subtitle: "Type a Mongolian province and the map will fill in.",
  total: 22,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/mongolia.svg",

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
    "You've completed all 22 provinces of Mongolia! 🇲🇳",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Mongolia. Check your connection.",

  regions: [
    {
      id: "MN035",
      display: "Orhon",
      names: ["Orhon", "Orkhon"],
      region_id: null
    },

    {
      id: "MN037",
      display: "Darhan-Uul",
      names: ["Darhan-Uul", "Darkhan-Uul", "Darkhan-Uul Province"],
      region_id: null
    },

    {
      id: "MN039",
      display: "Hentiy",
      names: ["Hentiy", "Khentii", "Khentii Province"],
      region_id: null
    },

    {
      id: "MN041",
      display: "Hövsgöl",
      names: ["Hövsgöl", "Khuvsgul", "Khövsgöl", "Khövsgöl Province"],
      region_id: null
    },

    {
      id: "MN043",
      display: "Hovd",
      names: ["Hovd", "Khovd", "Khovd Province"],
      region_id: null
    },

    {
      id: "MN046",
      display: "Uvs",
      names: ["Uvs", "Uvs Province"],
      region_id: null
    },

    {
      id: "MN047",
      display: "Töv",
      names: ["Töv", "Tov", "Töv Province"],
      region_id: null
    },

    {
      id: "MN049",
      display: "Selenge",
      names: ["Selenge", "Selenge Province"],
      region_id: null
    },

    {
      id: "MN051",
      display: "Sühbaatar",
      names: [
        "Sühbaatar",
        "Sukhbaatar",
        "Sukhbaatar Province"
      ],
      region_id: null
    },

    {
      id: "MN053",
      display: "Ömnögovi",
      names: [
        "Ömnögovi",
        "Umnugovi",
        "South Gobi",
        "South Gobi Province"
      ],
      region_id: null
    },

    {
      id: "MN055",
      display: "Övörhangay",
      names: [
        "Övörhangay",
        "Uvurkhangai",
        "Övörkhangai",
        "Uvurkhangai Province"
      ],
      region_id: null
    },

    {
      id: "MN057",
      display: "Dzavhan",
      names: [
        "Dzavhan",
        "Zavkhan",
        "Zavkhan Province"
      ],
      region_id: null
    },

    {
      id: "MN059",
      display: "Dundgovi",
      names: [
        "Dundgovi",
        "Dundgovi Province",
        "Middle Gobi"
      ],
      region_id: null
    },

    {
      id: "MN061",
      display: "Dornod",
      names: [
        "Dornod",
        "Dornod Province"
      ],
      region_id: null
    },

    {
      id: "MN063",
      display: "Dornogovi",
      names: [
        "Dornogovi",
        "Dornogovi Province",
        "East Gobi"
      ],
      region_id: null
    },

    {
      id: "MN064",
      display: "Govĭ-Sümber",
      names: [
        "Govĭ-Sümber",
        "Govi-Sumber",
        "Govisumber",
        "Govisumber Province"
      ],
      region_id: null
    },

    {
      id: "MN065",
      display: "Govi-Altay",
      names: [
        "Govi-Altay",
        "Govi Altai",
        "Govi-Altai Province"
      ],
      region_id: null
    },

    {
      id: "MN067",
      display: "Bulgan",
      names: [
        "Bulgan",
        "Bulgan Province"
      ],
      region_id: null
    },

    {
      id: "MN069",
      display: "Bayanhongor",
      names: [
        "Bayanhongor",
        "Bayankhongor",
        "Bayankhongor Province"
      ],
      region_id: null
    },

    {
      id: "MN071",
      display: "Bayan-Ölgiy",
      names: [
        "Bayan-Ölgiy",
        "Bayan-Olgii",
        "Bayan-Ölgii",
        "Bayan-Olgii Province"
      ],
      region_id: null
    },

    {
      id: "MN073",
      display: "Arhangay",
      names: [
        "Arhangay",
        "Arkhangai",
        "Arkhangai Province"
      ],
      region_id: null
    },

    {
      id: "MN1",
      display: "Ulaanbaatar",
      names: [
        "Ulaanbaatar",
        "Ulan Bator"
      ],
      region_id: null
    }
  ]
};