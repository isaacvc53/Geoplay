// data/countries/poland.js
// Based on the Poland Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "poland",
  lang: "en",
  kicker: "GeoPlay · Poland",
  title: "How many voivodeships of Poland can you name?",
  subtitle: "Type a Polish voivodeship and the map will fill in.",
  total: 16,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/poland.svg",

  guessPlaceholder: "Type a voivodeship…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My voivodeships",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a voivodeship to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 16 voivodeships of Poland! 🇵🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing voivodeships are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Poland. Check your connection.",

  regions: [
    {
      id: "PL02",
      display: "Lower Silesian",
      names: ["Lower Silesian", "Lower Silesia", "Lower Silesian Voivodeship", "Dolnośląskie", "Dolnoslaskie"],
      region_id: null
    },
    {
      id: "PL04",
      display: "Kuyavian-Pomeranian",
      names: ["Kuyavian-Pomeranian", "Kuyavian Pomeranian", "Kuyavia-Pomerania", "Kuyavian-Pomeranian Voivodeship", "Kujawsko-Pomorskie"],
      region_id: null
    },
    {
      id: "PL06",
      display: "Lublin",
      names: ["Lublin", "Lublin Voivodeship", "Lubelskie"],
      region_id: null
    },
    {
      id: "PL08",
      display: "Lubusz",
      names: ["Lubusz", "Lubusz Voivodeship", "Lubuskie"],
      region_id: null
    },
    {
      id: "PL10",
      display: "Łódź",
      names: ["Łódź", "Lodz", "Łódź Voivodeship", "Lodz Voivodeship", "Łódzkie", "Lodzkie"],
      region_id: null
    },
    {
      id: "PL12",
      display: "Lesser Poland",
      names: ["Lesser Poland", "Lesser Poland Voivodeship", "Małopolska", "Malopolska", "Małopolskie", "Malopolskie"],
      region_id: null
    },
    {
      id: "PL14",
      display: "Masovian",
      names: ["Masovian", "Masovia", "Masovian Voivodeship", "Mazowieckie"],
      region_id: null
    },
    {
      id: "PL16",
      display: "Opole",
      names: ["Opole", "Opole Voivodeship", "Opolskie"],
      region_id: null
    },
    {
      id: "PL18",
      display: "Subcarpathian",
      names: ["Subcarpathian", "Subcarpathia", "Subcarpathian Voivodeship", "Podkarpackie"],
      region_id: null
    },
    {
      id: "PL20",
      display: "Podlachian",
      names: ["Podlachian", "Podlaskie", "Podlachia", "Podlaskie Voivodeship", "Podlachian Voivodeship"],
      region_id: null
    },
    {
      id: "PL22",
      display: "Pomeranian",
      names: ["Pomeranian", "Pomerania", "Pomeranian Voivodeship", "Pomorskie"],
      region_id: null
    },
    {
      id: "PL24",
      display: "Silesian",
      names: ["Silesian", "Silesia", "Silesian Voivodeship", "Śląskie", "Slaskie"],
      region_id: null
    },
    {
      id: "PL26",
      display: "Świętokrzyskie",
      names: ["Świętokrzyskie", "Swietokrzyskie", "Holy Cross", "Holy Cross Voivodeship", "Świętokrzyskie Voivodeship", "Swietokrzyskie Voivodeship"],
      region_id: null
    },
    {
      id: "PL28",
      display: "Warmian-Masurian",
      names: ["Warmian-Masurian", "Warmian Masurian", "Warmia-Masuria", "Warmian-Masurian Voivodeship", "Warmińsko-Mazurskie"],
      region_id: null
    },
    {
      id: "PL30",
      display: "Greater Poland",
      names: ["Greater Poland", "Greater Poland Voivodeship", "Wielkopolska", "Wielkopolskie"],
      region_id: null
    },
    {
      id: "PL32",
      display: "West Pomeranian",
      names: ["West Pomeranian", "West Pomerania", "West Pomeranian Voivodeship", "Zachodniopomorskie"],
      region_id: null
    }
  ]
};
