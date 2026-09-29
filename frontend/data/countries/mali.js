window.GEOTARIA_COUNTRY = {
  slug: "mali",
  lang: "en",
  kicker: "GeoPlay · Country",
  title: "How many regions of Mali can you name?",
  subtitle: "Type a Malian region and the map will fill in.",
  total: 10,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/mali.svg",

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

  completeMessage: "You've completed all 10 regions of Mali! 🇲🇱",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Mali. Check your connection.",

  regions: [
    {
      id: "ML1",
      name: "Kayes",
      names: ["Kayes", "Kayes Region"]
    },
    {
      id: "ML2",
      name: "Koulikoro",
      names: ["Koulikoro", "Koulikoro Region"]
    },
    {
      id: "ML3",
      name: "Sikasso",
      names: ["Sikasso", "Sikasso Region"]
    },
    {
      id: "ML4",
      name: "Ségou",
      names: ["Ségou", "Segou", "Ségou Region", "Segou Region"]
    },
    {
      id: "ML5",
      name: "Mopti",
      names: ["Mopti", "Mopti Region"]
    },
    {
      id: "ML6",
      name: "Tombouctou",
      names: [
        "Tombouctou",
        "Timbuktu",
        "Tombouctou Region",
        "Timbuktu Region"
      ]
    },
    {
      id: "ML7",
      name: "Gao",
      names: ["Gao", "Gao Region"]
    },
    {
      id: "ML8",
      name: "Kidal",
      names: ["Kidal", "Kidal Region"]
    },
    {
      id: "ML9",
      name: "Menaka",
      names: ["Menaka", "Ménaka", "Menaka Region", "Ménaka Region"]
    },
    {
      id: "MLBKO",
      name: "Bamako",
      names: [
        "Bamako",
        "Bamako District",
        "District of Bamako"
      ]
    }
  ]
};