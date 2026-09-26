// data/countries/czech-republic.js
// Based on the Czech Republic Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "czech-republic",
  lang: "en",
  kicker: "GeoPlay · Czech Republic",
  title: "How many Czech regions can you name?",
  subtitle: "Type a Czech region and the map will fill in.",
  total: 14,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/czech-republic.svg",

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
    "You've completed all 14 regions of Czech Republic! 🇨🇿",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Czech Republic. Check your connection.",

  regions: [
    {
      id: "CZ10",
      display: "Praha",
      names: [
        "Praha",
        "Prague",
        "Hlavní město Praha",
        "Prague Region"
      ],
      region_id: null
    },

    {
      id: "CZ20",
      display: "Středočeský kraj",
      names: [
        "Středočeský kraj",
        "Stredocesky kraj",
        "Central Bohemian Region",
        "Central Bohemia"
      ],
      region_id: null
    },

    {
      id: "CZ31",
      display: "Jihočeský kraj",
      names: [
        "Jihočeský kraj",
        "Jihocesky kraj",
        "South Bohemian Region",
        "South Bohemia"
      ],
      region_id: null
    },

    {
      id: "CZ32",
      display: "Plzeňský kraj",
      names: [
        "Plzeňský kraj",
        "Plzensky kraj",
        "Plzeň Region",
        "Pilsen Region"
      ],
      region_id: null
    },

    {
      id: "CZ41",
      display: "Karlovarský kraj",
      names: [
        "Karlovarský kraj",
        "Karlovarsky kraj",
        "Karlovy Vary Region",
        "Carlsbad Region"
      ],
      region_id: null
    },

    {
      id: "CZ42",
      display: "Ústecký kraj",
      names: [
        "Ústecký kraj",
        "Ustecky kraj",
        "Ústí nad Labem Region",
        "Usti nad Labem Region"
      ],
      region_id: null
    },

    {
      id: "CZ51",
      display: "Liberecký kraj",
      names: [
        "Liberecký kraj",
        "Liberecky kraj",
        "Liberec Region"
      ],
      region_id: null
    },

    {
      id: "CZ52",
      display: "Královéhradecký kraj",
      names: [
        "Královéhradecký kraj",
        "Kralovehradecky kraj",
        "Hradec Králové Region",
        "Hradec Kralove Region"
      ],
      region_id: null
    },

    {
      id: "CZ53",
      display: "Pardubický kraj",
      names: [
        "Pardubický kraj",
        "Pardubicky kraj",
        "Pardubice Region"
      ],
      region_id: null
    },

    {
      id: "CZ63",
      display: "Kraj Vysočina",
      names: [
        "Kraj Vysočina",
        "Kraj Vysocina",
        "Vysočina",
        "Vysocina",
        "Vysočina Region",
        "Vysocina Region"
      ],
      region_id: null
    },

    {
      id: "CZ64",
      display: "Jihomoravský kraj",
      names: [
        "Jihomoravský kraj",
        "Jihomoravsky kraj",
        "South Moravian Region",
        "South Moravia"
      ],
      region_id: null
    },

    {
      id: "CZ71",
      display: "Olomoucký kraj",
      names: [
        "Olomoucký kraj",
        "Olomoucky kraj",
        "Olomouc Region"
      ],
      region_id: null
    },

    {
      id: "CZ72",
      display: "Zlínský kraj",
      names: [
        "Zlínský kraj",
        "Zlinsky kraj",
        "Zlín Region",
        "Zlin Region"
      ],
      region_id: null
    },

    {
      id: "CZ80",
      display: "Moravskoslezský kraj",
      names: [
        "Moravskoslezský kraj",
        "Moravskoslezsky kraj",
        "Moravian-Silesian Region",
        "Moravian Silesian Region"
      ],
      region_id: null
    }
  ]
};