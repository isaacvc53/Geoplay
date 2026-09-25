// data/countries/indonesia.js
// Configured against the uploaded simplemaps.com indonesia.svg.
// The SVG uses IDs such as IDKU and stores region names in the `name` attribute.
// viewBox: 0 0 1000 368.

window.GEOTARIA_COUNTRY = {
  slug: "indonesia",
  lang: "en",
  kicker: "GeoPlay · Indonesia",
  title: "How many Indonesian provinces can you name?",
  subtitle: "Type an Indonesian province and the map will fill in.",
  total: 34,
  quizSeconds: 15 * 60,
  geoFile: "../data/geo/indonesia.svg",
  viewBox: "0 0 1000 368",

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
  noneFoundMessage: "You haven’t guessed any yet.",
  pausedMessage: "The quiz is paused.",
  completeMessage: "You’ve completed all 34 provinces of Indonesia! 🇮🇩",
  timeUpMessage: "Time’s up.",
  giveUpMessage: "Quiz finished: {count}/{total}. The missing provinces are highlighted; hover over them to see their names.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the map of Indonesia. Check your connection.",

  regions: [
    {
      id: "IDKU",
      display: "North Kalimantan",
      names: ["North Kalimantan", "Kalimantan Utara"],
      region_id: null
    },
    {
      id: "IDNT",
      display: "East Nusa Tenggara",
      names: ["East Nusa Tenggara", "Nusa Tenggara Timur"],
      region_id: null
    },
    {
      id: "IDKB",
      display: "West Kalimantan",
      names: ["West Kalimantan", "Kalimantan Barat"],
      region_id: null
    },
    {
      id: "IDPA",
      display: "Papua",
      names: ["Papua"],
      region_id: null
    },
    {
      id: "IDJI",
      display: "East Java",
      names: ["East Java", "Jawa Timur"],
      region_id: null
    },
    {
      id: "IDMA",
      display: "Maluku",
      names: ["Maluku"],
      region_id: null
    },
    {
      id: "IDNB",
      display: "West Nusa Tenggara",
      names: ["West Nusa Tenggara", "Nusa Tenggara Barat"],
      region_id: null
    },
    {
      id: "IDSN",
      display: "South Sulawesi",
      names: ["South Sulawesi", "Sulawesi Selatan"],
      region_id: null
    },
    {
      id: "IDJT",
      display: "Central Java",
      names: ["Central Java", "Jawa Tengah"],
      region_id: null
    },
    {
      id: "IDJB",
      display: "West Java",
      names: ["West Java", "Jawa Barat"],
      region_id: null
    },
    {
      id: "IDJK",
      display: "Jakarta",
      names: [
        "Jakarta",
        "Jakarta Raya",
        "Special Capital Region of Jakarta"
      ],
      region_id: null
    },
    {
      id: "IDBT",
      display: "Banten",
      names: ["Banten"],
      region_id: null
    },
    {
      id: "IDYO",
      display: "Yogyakarta",
      names: [
        "Yogyakarta",
        "Special Region of Yogyakarta"
      ],
      region_id: null
    },
    {
      id: "IDSG",
      display: "Southeast Sulawesi",
      names: ["Southeast Sulawesi", "Sulawesi Tenggara"],
      region_id: null
    },
    {
      id: "IDPB",
      display: "West Papua",
      names: ["West Papua", "Papua Barat"],
      region_id: null
    },
    {
      id: "IDST",
      display: "Central Sulawesi",
      names: ["Central Sulawesi", "Sulawesi Tengah"],
      region_id: null
    },
    {
      id: "IDMU",
      display: "North Maluku",
      names: ["North Maluku", "Maluku Utara"],
      region_id: null
    },
    {
      id: "IDKR",
      display: "Riau Islands",
      names: ["Riau Islands", "Kepulauan Riau"],
      region_id: null
    },
    {
      id: "IDRI",
      display: "Riau",
      names: ["Riau"],
      region_id: null
    },
    {
      id: "IDGO",
      display: "Gorontalo",
      names: ["Gorontalo"],
      region_id: null
    },
    {
      id: "IDSA",
      display: "North Sulawesi",
      names: ["North Sulawesi", "Sulawesi Utara"],
      region_id: null
    },
    {
      id: "IDSR",
      display: "West Sulawesi",
      names: ["West Sulawesi", "Sulawesi Barat"],
      region_id: null
    },
    {
      id: "IDJA",
      display: "Jambi",
      names: ["Jambi"],
      region_id: null
    },
    {
      id: "IDSS",
      display: "South Sumatra",
      names: ["South Sumatra", "Sumatera Selatan"],
      region_id: null
    },
    {
      id: "IDLA",
      display: "Lampung",
      names: ["Lampung"],
      region_id: null
    },
    {
      id: "IDBE",
      display: "Bengkulu",
      names: ["Bengkulu"],
      region_id: null
    },
    {
      id: "IDSB",
      display: "West Sumatra",
      names: ["West Sumatra", "Sumatera Barat"],
      region_id: null
    },
    {
      id: "IDSU",
      display: "North Sumatra",
      names: ["North Sumatra", "Sumatera Utara"],
      region_id: null
    },
    {
      id: "IDAC",
      display: "Aceh",
      names: ["Aceh"],
      region_id: null
    },
    {
      id: "IDKT",
      display: "Central Kalimantan",
      names: ["Central Kalimantan", "Kalimantan Tengah"],
      region_id: null
    },
    {
      id: "IDKS",
      display: "South Kalimantan",
      names: ["South Kalimantan", "Kalimantan Selatan"],
      region_id: null
    },
    {
      id: "IDBA",
      display: "Bali",
      names: ["Bali"],
      region_id: null
    },
    {
      id: "IDBB",
      display: "Bangka-Belitung",
      names: [
        "Bangka-Belitung",
        "Bangka Belitung",
        "Bangka-Belitung Islands"
      ],
      region_id: null
    },
    {
      id: "IDKI",
      display: "East Kalimantan",
      names: ["East Kalimantan", "Kalimantan Timur"],
      region_id: null
    }
  ]
};
