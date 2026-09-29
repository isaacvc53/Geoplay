// data/countries/usa.js
// Based on the United States Admin Areas (level 1) SVG.

window.GEOTARIA_COUNTRY = {
  slug: "usa",
  lang: "en",
  kicker: "GeoPlay · USA",
  title: "How many states of the USA can you name?",
  subtitle: "Type a US state and the map will fill in.",
  total: 51,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/usa.svg",

  guessPlaceholder: "Type a state…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My states",
  giveUpLabel: "Give up",
  resetLabel: "Reset",

  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a state to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been guessed.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",

  completeMessage:
    "You've completed all 51 states of the USA! 🇺🇸",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/51. The missing states are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of the USA. Check your connection.",

  regions: [
    {
      id: "MA",
      display: "Massachusetts",
      names: ["Massachusetts"],
      region_id: null
    },
    {
      id: "MN",
      display: "Minnesota",
      names: ["Minnesota"],
      region_id: null
    },
    {
      id: "MT",
      display: "Montana",
      names: ["Montana"],
      region_id: null
    },
    {
      id: "ND",
      display: "North Dakota",
      names: ["North Dakota"],
      region_id: null
    },
    {
      id: "HI",
      display: "Hawaii",
      names: ["Hawaii"],
      region_id: null
    },
    {
      id: "ID",
      display: "Idaho",
      names: ["Idaho"],
      region_id: null
    },
    {
      id: "WA",
      display: "Washington",
      names: ["Washington"],
      region_id: null
    },
    {
      id: "AZ",
      display: "Arizona",
      names: ["Arizona"],
      region_id: null
    },
    {
      id: "CA",
      display: "California",
      names: ["California"],
      region_id: null
    },
    {
      id: "CO",
      display: "Colorado",
      names: ["Colorado"],
      region_id: null
    },
    {
      id: "NV",
      display: "Nevada",
      names: ["Nevada"],
      region_id: null
    },
    {
      id: "NM",
      display: "New Mexico",
      names: ["New Mexico"],
      region_id: null
    },
    {
      id: "OR",
      display: "Oregon",
      names: ["Oregon"],
      region_id: null
    },
    {
      id: "UT",
      display: "Utah",
      names: ["Utah"],
      region_id: null
    },
    {
      id: "WY",
      display: "Wyoming",
      names: ["Wyoming"],
      region_id: null
    },
    {
      id: "AR",
      display: "Arkansas",
      names: ["Arkansas"],
      region_id: null
    },
    {
      id: "IA",
      display: "Iowa",
      names: ["Iowa"],
      region_id: null
    },
    {
      id: "KS",
      display: "Kansas",
      names: ["Kansas"],
      region_id: null
    },
    {
      id: "MO",
      display: "Missouri",
      names: ["Missouri"],
      region_id: null
    },
    {
      id: "NE",
      display: "Nebraska",
      names: ["Nebraska"],
      region_id: null
    },
    {
      id: "OK",
      display: "Oklahoma",
      names: ["Oklahoma"],
      region_id: null
    },
    {
      id: "SD",
      display: "South Dakota",
      names: ["South Dakota"],
      region_id: null
    },
    {
      id: "LA",
      display: "Louisiana",
      names: ["Louisiana"],
      region_id: null
    },
    {
      id: "TX",
      display: "Texas",
      names: ["Texas"],
      region_id: null
    },
    {
      id: "CT",
      display: "Connecticut",
      names: ["Connecticut"],
      region_id: null
    },
    {
      id: "NH",
      display: "New Hampshire",
      names: ["New Hampshire"],
      region_id: null
    },
    {
      id: "RI",
      display: "Rhode Island",
      names: ["Rhode Island"],
      region_id: null
    },
    {
      id: "VT",
      display: "Vermont",
      names: ["Vermont"],
      region_id: null
    },
    {
      id: "AL",
      display: "Alabama",
      names: ["Alabama"],
      region_id: null
    },
    {
      id: "FL",
      display: "Florida",
      names: ["Florida"],
      region_id: null
    },
    {
      id: "GA",
      display: "Georgia",
      names: ["Georgia"],
      region_id: null
    },
    {
      id: "MS",
      display: "Mississippi",
      names: ["Mississippi"],
      region_id: null
    },
    {
      id: "SC",
      display: "South Carolina",
      names: ["South Carolina"],
      region_id: null
    },
    {
      id: "IL",
      display: "Illinois",
      names: ["Illinois"],
      region_id: null
    },
    {
      id: "IN",
      display: "Indiana",
      names: ["Indiana"],
      region_id: null
    },
    {
      id: "KY",
      display: "Kentucky",
      names: ["Kentucky"],
      region_id: null
    },
    {
      id: "NC",
      display: "North Carolina",
      names: ["North Carolina"],
      region_id: null
    },
    {
      id: "OH",
      display: "Ohio",
      names: ["Ohio"],
      region_id: null
    },
    {
      id: "TN",
      display: "Tennessee",
      names: ["Tennessee"],
      region_id: null
    },
    {
      id: "VA",
      display: "Virginia",
      names: ["Virginia"],
      region_id: null
    },
    {
      id: "WI",
      display: "Wisconsin",
      names: ["Wisconsin"],
      region_id: null
    },
    {
      id: "WV",
      display: "West Virginia",
      names: ["West Virginia"],
      region_id: null
    },
    {
      id: "DE",
      display: "Delaware",
      names: ["Delaware"],
      region_id: null
    },
    {
      id: "DC",
      display: "District of Columbia",
      names: ["District of Columbia", "Washington, D.C.", "Washington DC", "DC"],
      region_id: null
    },
    {
      id: "MD",
      display: "Maryland",
      names: ["Maryland"],
      region_id: null
    },
    {
      id: "NJ",
      display: "New Jersey",
      names: ["New Jersey"],
      region_id: null
    },
    {
      id: "NY",
      display: "New York",
      names: ["New York"],
      region_id: null
    },
    {
      id: "PA",
      display: "Pennsylvania",
      names: ["Pennsylvania"],
      region_id: null
    },
    {
      id: "ME",
      display: "Maine",
      names: ["Maine"],
      region_id: null
    },
    {
      id: "MI",
      display: "Michigan",
      names: ["Michigan"],
      region_id: null
    },
    {
      id: "AK",
      display: "Alaska",
      names: ["Alaska"],
      region_id: null
    }
  ]
};