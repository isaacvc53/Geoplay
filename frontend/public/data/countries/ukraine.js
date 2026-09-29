// data/countries/ukraine.js
// Based on the Ukraine Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "ukraine",
  lang: "en",
  kicker: "GeoPlay · Ukraine",
  title: "How many regions of Ukraine can you name?",
  subtitle: "Type a Ukrainian region and the map will fill in.",
  total: 27,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/ukraine.svg",

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
    "You've completed all 27 regions of Ukraine! 🇺🇦",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Ukraine. Check your connection.",

  regions: [
    {
      id: "UA05",
      display: "Vinnytska",
      names: ["Vinnytska", "Vinnytsia"],
      region_id: null
    },
    {
      id: "UA07",
      display: "Volynska",
      names: ["Volynska", "Volyn"],
      region_id: null
    },
    {
      id: "UA09",
      display: "Luhanska",
      names: ["Luhanska", "Luhansk"],
      region_id: null
    },
    {
      id: "UA12",
      display: "Dnipropetrovska",
      names: ["Dnipropetrovska", "Dnipropetrovsk", "Dnipropetrovsk Oblast"],
      region_id: null
    },
    {
      id: "UA14",
      display: "Donetska",
      names: ["Donetska", "Donetsk"],
      region_id: null
    },
    {
      id: "UA18",
      display: "Zhytomyrska",
      names: ["Zhytomyrska", "Zhytomyr"],
      region_id: null
    },
    {
      id: "UA21",
      display: "Zakarpatska",
      names: ["Zakarpatska", "Zakarpattia", "Transcarpathia"],
      region_id: null
    },
    {
      id: "UA23",
      display: "Zaporizka",
      names: ["Zaporizka", "Zaporizhzhia", "Zaporizhzhia Oblast"],
      region_id: null
    },
    {
      id: "UA26",
      display: "Ivano-Frankivska",
      names: ["Ivano-Frankivska", "Ivano-Frankivsk"],
      region_id: null
    },
    {
      id: "UA30",
      display: "Kyivska",
      names: ["Kyivska", "Kyiv City", "Kyiv"],
      region_id: null
    },
    {
      id: "UA32",
      display: "Kyivska",
      names: ["Kyivska", "Kyiv Oblast", "Kyiv Region"],
      region_id: null
    },
    {
      id: "UA35",
      display: "Kirovohradska",
      names: ["Kirovohradska", "Kirovohrad"],
      region_id: null
    },
    {
      id: "UA40",
      display: "Sevastopilska",
      names: ["Sevastopilska", "Sevastopol"],
      region_id: null
    },
    {
      id: "UA43",
      display: "Avtonomna Respublika Krym",
      names: [
        "Avtonomna Respublika Krym",
        "Autonomous Republic of Crimea",
        "Crimea",
        "Crimean Peninsula"
      ],
      region_id: null
    },
    {
      id: "UA46",
      display: "Lvivska",
      names: ["Lvivska", "Lviv"],
      region_id: null
    },
    {
      id: "UA48",
      display: "Mykolaivska",
      names: ["Mykolaivska", "Mykolaiv"],
      region_id: null
    },
    {
      id: "UA51",
      display: "Odeska",
      names: ["Odeska", "Odesa", "Odessa"],
      region_id: null
    },
    {
      id: "UA53",
      display: "Poltavska",
      names: ["Poltavska", "Poltava"],
      region_id: null
    },
    {
      id: "UA56",
      display: "Rivnenska",
      names: ["Rivnenska", "Rivne"],
      region_id: null
    },
    {
      id: "UA59",
      display: "Sumska",
      names: ["Sumska", "Sumy"],
      region_id: null
    },
    {
      id: "UA61",
      display: "Ternopilska",
      names: ["Ternopilska", "Ternopil"],
      region_id: null
    },
    {
      id: "UA63",
      display: "Kharkivska",
      names: ["Kharkivska", "Kharkiv"],
      region_id: null
    },
    {
      id: "UA65",
      display: "Khersonska",
      names: ["Khersonska", "Kherson"],
      region_id: null
    },
    {
      id: "UA68",
      display: "Khmelnytska",
      names: ["Khmelnytska", "Khmelnytskyi"],
      region_id: null
    },
    {
      id: "UA71",
      display: "Cherkaska",
      names: ["Cherkaska", "Cherkasy"],
      region_id: null
    },
    {
      id: "UA74",
      display: "Chernihivska",
      names: ["Chernihivska", "Chernihiv"],
      region_id: null
    },
    {
      id: "UA77",
      display: "Chernivetska",
      names: ["Chernivetska", "Chernivtsi"],
      region_id: null
    }
  ]
};