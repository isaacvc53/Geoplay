window.GEOTARIA_COUNTRY = {
  slug: "greenland",
  lang: "en",
  kicker: "GeoPlay · Greenland",
  title: "How many regions of Greenland can you name?",
  subtitle: "Type a Greenlandic region and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/greenland.svg",

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

  completeMessage: "You've completed all 5 regions of Greenland! 🇬🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Greenland. Check your connection.",

  regions: [
    {
      id: "GLKU",
      display: "Kommune Kujalleq",
      names: [
        "Kommune Kujalleq",
        "Kujalleq",
        "Kommune Kujalleq Municipality"
      ],
      region_id: null
    },
    {
      id: "GLQA",
      display: "Qaasuitsup Kommunia",
      names: [
        "Qaasuitsup Kommunia",
        "Qaasuitsup",
        "Qaasuitsup Municipality"
      ],
      region_id: null
    },
    {
      id: "GLQE",
      display: "Qeqqata Kommunia",
      names: [
        "Qeqqata Kommunia",
        "Qeqqata",
        "Qeqqata Municipality"
      ],
      region_id: null
    },
    {
      id: "GLSM",
      display: "Kommuneqarfik Sermersooq",
      names: [
        "Kommuneqarfik Sermersooq",
        "Sermersooq",
        "Sermersooq Municipality"
      ],
      region_id: null
    },
    {
      id: "GLUO",
      display: "Nationalparken",
      names: [
        "Nationalparken",
        "National Park",
        "Northeast Greenland National Park",
        "Northeast Greenland National Park"
      ],
      region_id: null
    }
  ]
};