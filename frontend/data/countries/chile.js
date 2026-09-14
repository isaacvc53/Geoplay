// data/countries/chile.js

window.GEOPLAY_COUNTRY = {
  slug: "Chile",
  id: 19,
  lang: "en",

  kicker: "GeoPlay · Chile",
  title: "How many regions of Chile can you name?",
  subtitle: "Type a Chilean region and the map will fill in.",

  total: 16,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/chile.svg",

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
    "You've completed all 16 regions of Chile! 🇨🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Chile. Check your connection.",

  regions: [
    {
      id: "CLAI",
      display: "Aisén del General Carlos Ibáñez del Campo",
      names: [
        "Aisén del General Carlos Ibáñez del Campo",
        "Aisen del General Carlos Ibanez del Campo",
        "Aisén",
        "Aisen",
        "Aysén",
        "Aysen",
        "Aysén del General Carlos Ibáñez del Campo",
        "Aysen del General Carlos Ibanez del Campo",
        "Aysen Region"
      ],
      region_id: 441
    },

    {
      id: "CLAN",
      display: "Antofagasta",
      names: [
        "Antofagasta",
        "Antofagasta Region"
      ],
      region_id: 429
    },

    {
      id: "CLAP",
      display: "Arica y Parinacota",
      names: [
        "Arica y Parinacota",
        "Arica and Parinacota",
        "Arica y Parinacota Region",
        "Arica and Parinacota Region"
      ],
      region_id: 427
    },

    {
      id: "CLAR",
      display: "La Araucanía",
      names: [
        "La Araucanía",
        "La Araucania",
        "Araucanía",
        "Araucania",
        "La Araucanía Region",
        "La Araucania Region"
      ],
      region_id: 438
    },

    {
      id: "CLAT",
      display: "Atacama",
      names: [
        "Atacama",
        "Atacama Region"
      ],
      region_id: 430
    },

    {
      id: "CLBI",
      display: "Bío-Bío",
      names: [
        "Bío-Bío",
        "Bio-Bio",
        "Biobío",
        "Biobio",
        "Bío Bío",
        "Bio Bio",
        "Bío-Bío Region",
        "Biobío Region"
      ],
      region_id: 437
    },

    {
      id: "CLCO",
      display: "Coquimbo",
      names: [
        "Coquimbo",
        "Coquimbo Region"
      ],
      region_id: 431
    },

    {
      id: "CLLI",
      display: "Libertador General Bernardo O'Higgins",
      names: [
        "Libertador General Bernardo O'Higgins",
        "Libertador General Bernardo O’Higgins",
        "O'Higgins",
        "O’Higgins",
        "Bernardo O'Higgins",
        "Bernardo O’Higgins",
        "Libertador General Bernardo O'Higgins Region",
        "O'Higgins Region"
      ],
      region_id: 434
    },

    {
      id: "CLLL",
      display: "Los Lagos",
      names: [
        "Los Lagos",
        "Los Lagos Region"
      ],
      region_id: 440
    },

    {
      id: "CLLR",
      display: "Los Ríos",
      names: [
        "Los Ríos",
        "Los Rios",
        "Los Ríos Region",
        "Los Rios Region"
      ],
      region_id: 439
    },

    {
      id: "CLMA",
      display: "Magallanes y Antártica Chilena",
      names: [
        "Magallanes y Antártica Chilena",
        "Magallanes y Antartica Chilena",
        "Magallanes",
        "Magallanes and Antártica Chilena",
        "Magallanes and Antartica Chilena",
        "Magallanes Region"
      ],
      region_id: 442
    },

    {
      id: "CLML",
      display: "Maule",
      names: [
        "Maule",
        "Maule Region"
      ],
      region_id: 435
    },

    {
      id: "CLNB",
      display: "Ñuble",
      names: [
        "Ñuble",
        "Nuble",
        "Ñuble Region",
        "Nuble Region"
      ],
      region_id: 436
    },

    {
      id: "CLRM",
      display: "Región Metropolitana de Santiago",
      names: [
        "Región Metropolitana de Santiago",
        "Region Metropolitana de Santiago",
        "Región Metropolitana",
        "Region Metropolitana",
        "Metropolitana",
        "Santiago Metropolitan Region",
        "Metropolitan Region",
        "Santiago"
      ],
      region_id: 433
    },

    {
      id: "CLTA",
      display: "Tarapacá",
      names: [
        "Tarapacá",
        "Tarapaca",
        "Tarapacá Region",
        "Tarapaca Region"
      ],
      region_id: 428
    },

    {
      id: "CLVS",
      display: "Valparaíso",
      names: [
        "Valparaíso",
        "Valparaiso",
        "Valparaíso Region",
        "Valparaiso Region"
      ],
      region_id: 432
    }
  ]
};