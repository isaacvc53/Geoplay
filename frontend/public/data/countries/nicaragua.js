// data/countries/nicaragua.js
// Based on the Nicaragua Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "nicaragua",
  lang: "en",
  kicker: "GeoPlay · Nicaragua",
  title: "How many departments and autonomous regions of Nicaragua can you name?",
  subtitle: "Type a Nicaraguan department or autonomous region and the map will fill in.",
  total: 17,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/nicaragua.svg",

  guessPlaceholder: "Type a department or autonomous region…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My departments and autonomous regions",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a department or autonomous region to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 17 departments and autonomous regions of Nicaragua! 🇳🇮",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing departments and autonomous regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Nicaragua. Check your connection.",

  regions: [
    {
      id: "NISJ",
      display: "Río San Juan",
      names: ["Rio San Juan", "Río San Juan", "San Juan", "Río San Juan Department"],
      region_id: null
    },
    {
      id: "NIAN",
      display: "North Caribbean Coast",
      names: ["North Caribbean Coast", "North Caribbean Coast Autonomous Region", "Atlántico Norte", "Atlantico Norte", "RACCN", "RAAN", "North Atlantic"],
      region_id: null
    },
    {
      id: "NIJI",
      display: "Jinotega",
      names: ["Jinotega", "Jinotega Department"],
      region_id: null
    },
    {
      id: "NINS",
      display: "Nueva Segovia",
      names: ["Nueva Segovia", "Nueva Segovia Department"],
      region_id: null
    },
    {
      id: "NICI",
      display: "Chinandega",
      names: ["Chinandega", "Chinandega Department"],
      region_id: null
    },
    {
      id: "NIMD",
      display: "Madriz",
      names: ["Madriz", "Madriz Department"],
      region_id: null
    },
    {
      id: "NIRI",
      display: "Rivas",
      names: ["Rivas", "Rivas Department"],
      region_id: null
    },
    {
      id: "NIAS",
      display: "South Caribbean Coast",
      names: ["South Caribbean Coast", "South Caribbean Coast Autonomous Region", "Atlántico Sur", "Atlantico Sur", "RACCS", "RAAS", "South Atlantic"],
      region_id: null
    },
    {
      id: "NILE",
      display: "León",
      names: ["León", "Leon", "León Department"],
      region_id: null
    },
    {
      id: "NIMN",
      display: "Managua",
      names: ["Managua", "Managua Department"],
      region_id: null
    },
    {
      id: "NICA",
      display: "Carazo",
      names: ["Carazo", "Carazo Department"],
      region_id: null
    },
    {
      id: "NIMT",
      display: "Matagalpa",
      names: ["Matagalpa", "Matagalpa Department"],
      region_id: null
    },
    {
      id: "NIBO",
      display: "Boaco",
      names: ["Boaco", "Boaco Department"],
      region_id: null
    },
    {
      id: "NICO",
      display: "Chontales",
      names: ["Chontales", "Chontales Department"],
      region_id: null
    },
    {
      id: "NIES",
      display: "Estelí",
      names: ["Estelí", "Esteli", "Estelí Department"],
      region_id: null
    },
    {
      id: "NIGR",
      display: "Granada",
      names: ["Granada", "Granada Department"],
      region_id: null
    },
    {
      id: "NIMS",
      display: "Masaya",
      names: ["Masaya", "Masaya Department"],
      region_id: null
    }
  ]
};
