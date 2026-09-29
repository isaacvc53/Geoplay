// data/countries/canada.js
// Based on the Canada Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "canada",
  lang: "en",
  kicker: "GeoPlay · Canada",
  title: "How many provinces and territories of Canada can you name?",
  subtitle: "Type a Canadian province or territory and the map will fill in.",
  total: 13,
  quizSeconds: 8 * 60,

  geoFile: "../data/geo/canada.svg",

  guessPlaceholder: "Type a province or territory…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My provinces",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a province or territory to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 13 provinces and territories of Canada! 🇨🇦",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/13. The missing provinces and territories are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Canada. Check your connection.",

  regions: [
    {
      id: "CA-AB",
      display: "Alberta",
      names: ["Alberta", "AB"],
      region_id: null
    },
    {
      id: "CA-BC",
      display: "British Columbia",
      names: ["British Columbia", "BC", "B.C."],
      region_id: null
    },
    {
      id: "CA-MB",
      display: "Manitoba",
      names: ["Manitoba", "MB"],
      region_id: null
    },
    {
      id: "CA-NB",
      display: "New Brunswick",
      names: ["New Brunswick", "NB", "Nouveau-Brunswick"],
      region_id: null
    },
    {
      id: "CA-NL",
      display: "Newfoundland and Labrador",
      names: ["Newfoundland and Labrador", "Newfoundland & Labrador", "Newfoundland", "Labrador", "NL", "Terre-Neuve-et-Labrador"],
      region_id: null
    },
    {
      id: "CA-NS",
      display: "Nova Scotia",
      names: ["Nova Scotia", "NS", "Nouvelle-Écosse", "Nouvelle-Ecosse"],
      region_id: null
    },
    {
      id: "CA-NT",
      display: "Northwest Territories",
      names: ["Northwest Territories", "North West Territories", "NWT", "NT", "Territoires du Nord-Ouest"],
      region_id: null
    },
    {
      id: "CA-NU",
      display: "Nunavut",
      names: ["Nunavut", "NU"],
      region_id: null
    },
    {
      id: "CA-ON",
      display: "Ontario",
      names: ["Ontario", "ON"],
      region_id: null
    },
    {
      id: "CA-PE",
      display: "Prince Edward Island",
      names: ["Prince Edward Island", "PEI", "P.E.I.", "PE", "Île-du-Prince-Édouard", "Ile-du-Prince-Edouard"],
      region_id: null
    },
    {
      id: "CA-QC",
      display: "Quebec",
      names: ["Quebec", "Québec", "QC"],
      region_id: null
    },
    {
      id: "CA-SK",
      display: "Saskatchewan",
      names: ["Saskatchewan", "SK"],
      region_id: null
    },
    {
      id: "CA-YT",
      display: "Yukon",
      names: ["Yukon", "Yukon Territory", "YT"],
      region_id: null
    }
  ]
};