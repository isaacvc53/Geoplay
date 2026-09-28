window.GEOTARIA_COUNTRY = {
  slug: "iceland",
  lang: "en",
  kicker: "GeoPlay · Iceland",
  title: "How many regions of Iceland can you name?",
  subtitle: "Type an Icelandic region and the map will fill in.",
  total: 8,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/iceland.svg",

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

  completeMessage: "You've completed all 8 regions of Iceland! 🇮🇸",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Iceland. Check your connection.",

  regions: [
    {
      id: "IS1",
      display: "Höfuðborgarsvæði",
      names: [
        "Höfuðborgarsvæði",
        "Hofudborgarsvaedi",
        "Capital Region",
        "Capital Region of Iceland"
      ],
      region_id: null
    },
    {
      id: "IS2",
      display: "Suðurnes",
      names: [
        "Suðurnes",
        "Sudurnes",
        "Southern Peninsula",
        "Reykjanes"
      ],
      region_id: null
    },
    {
      id: "IS3",
      display: "Vesturland",
      names: [
        "Vesturland",
        "Western Region",
        "West Iceland"
      ],
      region_id: null
    },
    {
      id: "IS4",
      display: "Vestfirðir",
      names: [
        "Vestfirðir",
        "Vestfirdir",
        "Westfjords",
        "Westfjords Region"
      ],
      region_id: null
    },
    {
      id: "IS5",
      display: "Norðurland vestra",
      names: [
        "Norðurland vestra",
        "Nordurland vestra",
        "Northwestern Region",
        "Northwest Iceland"
      ],
      region_id: null
    },
    {
      id: "IS6",
      display: "Norðurland eystra",
      names: [
        "Norðurland eystra",
        "Nordurland eystra",
        "Northeastern Region",
        "Northeast Iceland"
      ],
      region_id: null
    },
    {
      id: "IS7",
      display: "Austurland",
      names: [
        "Austurland",
        "Eastern Region",
        "East Iceland"
      ],
      region_id: null
    },
    {
      id: "IS8",
      display: "Suðurland",
      names: [
        "Suðurland",
        "Sudurland",
        "Southern Region",
        "South Iceland"
      ],
      region_id: null
    }
  ]
};