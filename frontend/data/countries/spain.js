window.GEOTARIA_COUNTRY = {
  slug: "spain",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many autonomous communities and cities of Spain can you name?",
  subtitle: "Type a Spanish autonomous community or city and the map will fill in.",
  total: 19,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/spain.svg",

  guessPlaceholder: "Type an autonomous community or city…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My autonomous communities and cities",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over an autonomous community or city to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 19 autonomous communities and cities of Spain! 🇪🇸",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing autonomous communities and cities are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Spain. Check your connection.",

  regions: [
    {
      id: "ESAN",
      name: "Andalucía",
      names: ["Andalucía", "Andalucia", "Andalusia", "Andalusia Autonomous Community"]
    },
    {
      id: "ESAR",
      name: "Aragon",
      names: ["Aragon", "Aragón", "Aragon Autonomous Community"]
    },
    {
      id: "ESAS",
      name: "Asturias",
      names: ["Asturias", "Principality of Asturias", "Asturias Autonomous Community"]
    },
    {
      id: "ESCB",
      name: "Cantabria",
      names: ["Cantabria", "Cantabria Autonomous Community"]
    },
    {
      id: "ESCE",
      name: "Ceuta",
      names: ["Ceuta", "Ceuta Autonomous City"]
    },
    {
      id: "ESCL",
      name: "Castilla y León",
      names: ["Castilla y León", "Castilla y Leon", "Castile and León", "Castile and Leon"]
    },
    {
      id: "ESCM",
      name: "Castilla la Mancha",
      names: ["Castilla la Mancha", "Castilla-La Mancha", "Castile-La Mancha"]
    },
    {
      id: "ESCN",
      name: "Islas Canarias",
      names: ["Islas Canarias", "Canarias", "Canary Islands"]
    },
    {
      id: "ESCT",
      name: "Cataluña",
      names: ["Cataluña", "Catalunya", "Catalonia"]
    },
    {
      id: "ESEX",
      name: "Extremadura",
      names: ["Extremadura", "Extremadura Autonomous Community"]
    },
    {
      id: "ESGA",
      name: "Galicia",
      names: ["Galicia", "Galicia Autonomous Community"]
    },
    {
      id: "ESIB",
      name: "Islas Baleares",
      names: ["Islas Baleares", "Baleares", "Balearic Islands"]
    },
    {
      id: "ESMC",
      name: "Murcia",
      names: ["Murcia", "Region of Murcia"]
    },
    {
      id: "ESMD",
      name: "Comunidad de Madrid",
      names: ["Comunidad de Madrid", "Madrid", "Community of Madrid"]
    },
    {
      id: "ESML",
      name: "Melilla",
      names: ["Melilla", "Melilla Autonomous City"]
    },
    {
      id: "ESNC",
      name: "Navarra, Comunidad Foral de",
      names: [
        "Navarra, Comunidad Foral de",
        "Navarra",
        "Comunidad Foral de Navarra",
        "Navarre"
      ]
    },
    {
      id: "ESPV",
      name: "País Vasco",
      names: ["País Vasco", "Pais Vasco", "Euskadi", "Basque Country"]
    },
    {
      id: "ESRI",
      name: "La Rioja",
      names: ["La Rioja", "Rioja"]
    },
    {
      id: "ESVC",
      name: "Comunidad Valenciana",
      names: ["Comunidad Valenciana", "Valencia", "Valencian Community"]
    }
  ]
};