window.GEOTARIA_COUNTRY = {
  slug: "bosnia",
  lang: "en",
  kicker: "GeoPlay · Bosnia and Herzegovina",
  title: "How many administrative regions can you name?",
  subtitle: "Type an administrative region and the map will fill in.",
  total: 3,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/bosnia.svg",

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
  completeMessage: "Congratulations! You named all 3 administrative regions.",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz ended. Here are the regions you didn't find.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the Bosnia and Herzegovina map.",

  regions: [
    {
      id: "BABIH",
      display: "Federacija Bosne i Hercegovine",
      names: [
        "Federacija Bosne i Hercegovine",
        "Federation of Bosnia and Herzegovina",
        "Federation of Bosnia and Herzegovina Entity",
        "FBiH"
      ],
      region_id: null
    },
    {
      id: "BABRC",
      display: "Brčko distrikt",
      names: [
        "Brčko distrikt",
        "Brcko distrikt",
        "Brčko District",
        "Brcko District",
        "Brčko"
      ],
      region_id: null
    },
    {
      id: "BASRP",
      display: "Republika Srpska",
      names: [
        "Republika Srpska",
        "Republika Srpska Entity",
        "Serb Republic",
        "Republika Srpska Entity of Bosnia and Herzegovina"
      ],
      region_id: null
    }
  ]
};