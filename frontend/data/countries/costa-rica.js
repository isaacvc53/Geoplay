// data/countries/costa-rica.js

window.GEOTARIA_COUNTRY = {
  slug: "costa-rica",
  id: 35,
  lang: "en",

  kicker: "GeoPlay · Costa Rica",
  title: "How many provinces of Costa Rica can you name?",
  subtitle: "Type a Costa Rican province and the map will fill in.",

  total: 7,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/costa-rica.svg",

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
    "You've completed all 7 provinces of Costa Rica! 🇨🇷",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing provinces are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Costa Rica. Check your connection.",

  regions: [
    {
      id: "CRA",
      display: "Alajuela",
      names: [
        "Alajuela",
        "Alajuela Province"
      ],
      region_id: 721
    },

    {
      id: "CRC",
      display: "Cartago",
      names: [
        "Cartago",
        "Cartago Province"
      ],
      region_id: 722
    },

    {
      id: "CRG",
      display: "Guanacaste",
      names: [
        "Guanacaste",
        "Guanacaste Province"
      ],
      region_id: 724
    },

    {
      id: "CRH",
      display: "Heredia",
      names: [
        "Heredia",
        "Heredia Province"
      ],
      region_id: 723
    },

    {
      id: "CRL",
      display: "Limón",
      names: [
        "Limón",
        "Limon",
        "Limón Province",
        "Limon Province"
      ],
      region_id: 726
    },

    {
      id: "CRP",
      display: "Puntarenas",
      names: [
        "Puntarenas",
        "Puntarenas Province"
      ],
      region_id: 725
    },

    {
      id: "CRSJ",
      display: "San José",
      names: [
        "San José",
        "San Jose",
        "San José Province",
        "San Jose Province"
      ],
      region_id: 720
    }
  ]
};
