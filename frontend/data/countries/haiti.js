window.GEOTARIA_COUNTRY = {
  slug: "haiti",
  lang: "en",
  kicker: "GeoPlay · Haiti",
  title: "How many departments of Haiti can you name?",
  subtitle: "Type a Haitian department and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/haiti.svg",

  guessPlaceholder: "Type a department…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My departments",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a department to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage: "You've completed all 10 departments of Haiti! 🇭🇹",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing departments are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Haiti. Check your connection.",

  regions: [
    {
      id: "HT-AR",
      display: "Artibonite",
      names: [
        "Artibonite",
        "Artibonite Department",
        "Latibonit"
      ],
      region_id: null
    },
    {
      id: "HT-CE",
      display: "Centre",
      names: [
        "Centre",
        "Centre Department",
        "Central"
      ],
      region_id: null
    },
    {
      id: "HT-GA",
      display: "Grand'Anse",
      names: [
        "Grand'Anse",
        "Grand Anse",
        "Grande-Anse",
        "Grand'Anse Department",
        "Grand Anse Department",
        "Grandans"
      ],
      region_id: null
    },
    {
      id: "HT-NI",
      display: "Nippes",
      names: [
        "Nippes",
        "Nippes Department",
        "Nip"
      ],
      region_id: null
    },
    {
      id: "HT-ND",
      display: "Nord",
      names: [
        "Nord",
        "Nord Department",
        "North"
      ],
      region_id: null
    },
    {
      id: "HT-NE",
      display: "Nord-Est",
      names: [
        "Nord-Est",
        "Nord Est",
        "Nord-Est Department",
        "Northeast",
        "North-East"
      ],
      region_id: null
    },
    {
      id: "HT-NO",
      display: "Nord-Ouest",
      names: [
        "Nord-Ouest",
        "Nord Ouest",
        "Nord-Ouest Department",
        "Northwest",
        "North-West"
      ],
      region_id: null
    },
    {
      id: "HT-OU",
      display: "Ouest",
      names: [
        "Ouest",
        "Ouest Department",
        "West"
      ],
      region_id: null
    },
    {
      id: "HT-SD",
      display: "Sud",
      names: [
        "Sud",
        "Sud Department",
        "South"
      ],
      region_id: null
    },
    {
      id: "HT-SE",
      display: "Sud-Est",
      names: [
        "Sud-Est",
        "Sud Est",
        "Sud-Est Department",
        "Southeast",
        "South-East"
      ],
      region_id: null
    }
  ]
};