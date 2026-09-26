// data/countries/denmark.js
// Based on the Denmark Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "denmark",
  lang: "en",
  kicker: "GeoPlay · Denmark",
  title: "How many regions of Denmark can you name?",
  subtitle: "Type a Danish region and the map will fill in.",
  total: 5,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/denmark.svg",

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
    "You've completed all 5 regions of Denmark! 🇩🇰",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Denmark. Check your connection.",

  regions: [
    {
      id: "DK81",
      display: "Nordjylland",
      names: [
        "Nordjylland",
        "North Denmark Region",
        "North Jutland",
        "North Denmark"
      ],
      region_id: null
    },

    {
      id: "DK82",
      display: "Midtjylland",
      names: [
        "Midtjylland",
        "Central Denmark Region",
        "Central Jutland",
        "Central Denmark"
      ],
      region_id: null
    },

    {
      id: "DK83",
      display: "Syddanmark",
      names: [
        "Syddanmark",
        "Region of Southern Denmark",
        "Southern Denmark",
        "South Denmark"
      ],
      region_id: null
    },

    {
      id: "DK84",
      display: "Hovedstaden",
      names: [
        "Hovedstaden",
        "Capital Region of Denmark",
        "Capital Region",
        "Greater Copenhagen"
      ],
      region_id: null
    },

    {
      id: "DK85",
      display: "Sjælland",
      names: [
        "Sjælland",
        "Sjaelland",
        "Region Zealand",
        "Zealand Region",
        "Zealand"
      ],
      region_id: null
    }
  ]
};