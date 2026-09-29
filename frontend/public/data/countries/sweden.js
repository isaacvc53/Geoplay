// data/countries/sweden.js
// Based on the Sweden Counties (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "sweden",
  lang: "en",
  kicker: "GeoPlay · Sweden",
  title: "How many counties of Sweden can you name?",
  subtitle: "Type a Swedish county and the map will fill in.",
  total: 21,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/sweden.svg",

  guessPlaceholder: "Type a county…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My counties",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a county to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 21 counties of Sweden! 🇸🇪",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing counties are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Sweden. Check your connection.",

  regions: [
    {
      id: "SEAB",
      display: "Stockholm",
      names: ["Stockholm"],
      region_id: null
    },
    {
      id: "SEAC",
      display: "Västerbotten",
      names: ["Västerbotten", "Vasterbotten"],
      region_id: null
    },
    {
      id: "SEBD",
      display: "Norrbotten",
      names: ["Norrbotten"],
      region_id: null
    },
    {
      id: "SEC",
      display: "Uppsala",
      names: ["Uppsala"],
      region_id: null
    },
    {
      id: "SED",
      display: "Södermanland",
      names: ["Södermanland", "Sodermanland"],
      region_id: null
    },
    {
      id: "SEE",
      display: "Östergötland",
      names: ["Östergötland", "Ostergotland"],
      region_id: null
    },
    {
      id: "SEF",
      display: "Jönköping",
      names: ["Jönköping", "Jonkoping"],
      region_id: null
    },
    {
      id: "SEG",
      display: "Kronoberg",
      names: ["Kronoberg"],
      region_id: null
    },
    {
      id: "SEH",
      display: "Kalmar",
      names: ["Kalmar"],
      region_id: null
    },
    {
      id: "SEI",
      display: "Gotland",
      names: ["Gotland"],
      region_id: null
    },
    {
      id: "SEK",
      display: "Blekinge",
      names: ["Blekinge"],
      region_id: null
    },
    {
      id: "SEM",
      display: "Skåne",
      names: ["Skåne", "Skane"],
      region_id: null
    },
    {
      id: "SEN",
      display: "Halland",
      names: ["Halland"],
      region_id: null
    },
    {
      id: "SEO",
      display: "Västra Götaland",
      names: ["Västra Götaland", "Vastra Gotaland"],
      region_id: null
    },
    {
      id: "SES",
      display: "Värmland",
      names: ["Värmland", "Varmland"],
      region_id: null
    },
    {
      id: "SET",
      display: "Orebro",
      names: ["Orebro", "Örebro"],
      region_id: null
    },
    {
      id: "SEU",
      display: "Västmanland",
      names: ["Västmanland", "Vastmanland"],
      region_id: null
    },
    {
      id: "SEW",
      display: "Dalarna",
      names: ["Dalarna"],
      region_id: null
    },
    {
      id: "SEX",
      display: "Gävleborg",
      names: ["Gävleborg", "Gavleborg"],
      region_id: null
    },
    {
      id: "SEY",
      display: "Västernorrland",
      names: ["Västernorrland", "Vasternorrland"],
      region_id: null
    },
    {
      id: "SEZ",
      display: "Jämtland",
      names: ["Jämtland", "Jamtland"],
      region_id: null
    }
  ]
};