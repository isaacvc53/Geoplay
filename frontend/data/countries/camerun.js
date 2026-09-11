window.GEOPLAY_COUNTRY = {
  slug: "camerun",
  lang: "en",
  kicker: "GeoPlay · Cameroon",
  title: "How many regions of Cameroon can you name?",
  subtitle: "Type a region and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/camerun.svg",

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
  completeMessage: "Congratulations! You named all 10 regions of Cameroon.",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz ended — here's what you were missing.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the Cameroon map.",

  regions: [
    {
      id: "CMAD",
      display: "Adamaoua",
      names: ["Adamaoua", "Adamawa", "Adamaoua Region", "Adamawa Region"],
      region_id: null
    },
    {
      id: "CMCE",
      display: "Centre",
      names: ["Centre", "Centre Region", "Central Region"],
      region_id: null
    },
    {
      id: "CMEN",
      display: "Extrême-Nord",
      names: [
        "Extrême-Nord",
        "Extreme-Nord",
        "Extreme North",
        "Far North",
        "Extrême-Nord Region",
        "Extreme North Region",
        "Far North Region"
      ],
      region_id: null
    },
    {
      id: "CMES",
      display: "Est",
      names: ["Est", "East", "Est Region", "East Region"],
      region_id: null
    },
    {
      id: "CMLT",
      display: "Littoral",
      names: ["Littoral", "Littoral Region"],
      region_id: null
    },
    {
      id: "CMNO",
      display: "Nord",
      names: ["Nord", "North", "Nord Region", "North Region"],
      region_id: null
    },
    {
      id: "CMNW",
      display: "Nord-Ouest",
      names: [
        "Nord-Ouest",
        "Nord Ouest",
        "North-West",
        "North West",
        "Nord-Ouest Region",
        "North-West Region",
        "North West Region"
      ],
      region_id: null
    },
    {
      id: "CMOU",
      display: "Ouest",
      names: ["Ouest", "West", "Ouest Region", "West Region"],
      region_id: null
    },
    {
      id: "CMSU",
      display: "Sud",
      names: ["Sud", "South", "Sud Region", "South Region"],
      region_id: null
    },
    {
      id: "CMSW",
      display: "Sud-Ouest",
      names: [
        "Sud-Ouest",
        "Sud Ouest",
        "South-West",
        "South West",
        "Sud-Ouest Region",
        "South-West Region",
        "South West Region"
      ],
      region_id: null
    }
  ]
};