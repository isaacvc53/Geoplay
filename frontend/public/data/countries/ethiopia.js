window.GEOTARIA_COUNTRY = {
  slug: "ethiopia",
  lang: "en",
  kicker: "GeoPlay · Ethiopia",
  title: "How many regions of Ethiopia can you name?",
  subtitle: "Type an Ethiopian region and the map will fill in.",
  total: 12,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/ethiopia.svg",

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

  completeMessage: "You've completed all 12 regions of Ethiopia! 🇪🇹",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Ethiopia. Check your connection.",

  regions: [
    {
      id: "ETAA",
      display: "Addis Ababa",
      names: [
        "Addis Ababa",
        "Addis Ababa City",
        "Addis Ababa Region"
      ],
      region_id: null
    },
    {
      id: "ETAF",
      display: "Afar",
      names: [
        "Afar",
        "Afar Region"
      ],
      region_id: null
    },
    {
      id: "ETAM",
      display: "Amara",
      names: [
        "Amara",
        "Amhara",
        "Amara Region",
        "Amhara Region"
      ],
      region_id: null
    },
    {
      id: "ETBE",
      display: "Benishangul Gumz",
      names: [
        "Benishangul Gumz",
        "Benishangul-Gumuz",
        "Benishangul Gumz Region",
        "Benishangul-Gumuz Region"
      ],
      region_id: null
    },
    {
      id: "ETDD",
      display: "Dire Dawa",
      names: [
        "Dire Dawa",
        "Dire Dawa City",
        "Dire Dawa Region"
      ],
      region_id: null
    },
    {
      id: "ETGA",
      display: "Gambela",
      names: [
        "Gambela",
        "Gambela Region",
        "Gambella",
        "Gambella Region"
      ],
      region_id: null
    },
    {
      id: "ETHA",
      display: "Harari",
      names: [
        "Harari",
        "Harari Region"
      ],
      region_id: null
    },
    {
      id: "ETOR",
      display: "Oromia",
      names: [
        "Oromia",
        "Oromia Region"
      ],
      region_id: null
    },
    {
      id: "ETSI",
      display: "Sidama",
      names: [
        "Sidama",
        "Sidama Region"
      ],
      region_id: null
    },
    {
      id: "ETSN",
      display: "SNNP",
      names: [
        "SNNP",
        "Southern Nations, Nationalities, and Peoples",
        "Southern Nations Nationalities and Peoples",
        "SNNP Region"
      ],
      region_id: null
    },
    {
      id: "ETSO",
      display: "Somali",
      names: [
        "Somali",
        "Somali Region"
      ],
      region_id: null
    },
    {
      id: "ETTI",
      display: "Tigray",
      names: [
        "Tigray",
        "Tigray Region"
      ],
      region_id: null
    }
  ]
};