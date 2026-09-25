// data/countries/china.js
// Based on the SimpleMaps China Admin Areas (level 1) SVG.
// The SVG uses IDs such as CNAH and stores region names in the name attribute.

window.GEOTARIA_COUNTRY = {
  slug: "china",
  lang: "en",
  kicker: "GeoPlay · China",
  title: "How many Chinese provinces can you name?",
  subtitle: "Type a Chinese province or region and the map will fill in.",
  total: 34,
  quizSeconds: 15 * 60,

  geoFile: "../data/geo/china.svg",

  guessPlaceholder: "Type a province…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My provinces",
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
    "You've completed all 34 regions of China! 🇨🇳",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/{total}. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of China. Check your connection.",

  regions: [
    {
      id: "CNAH",
      display: "Anhui",
      names: [
        "Anhui",
        "Anhui Province"
      ],
      region_id: null
    },

    {
      id: "CNBJ",
      display: "Beijing",
      names: [
        "Beijing",
        "Beijing Municipality"
      ],
      region_id: null
    },

    {
      id: "CNCQ",
      display: "Chongqing",
      names: [
        "Chongqing",
        "Chongqing Municipality"
      ],
      region_id: null
    },

    {
      id: "CNFJ",
      display: "Fujian",
      names: [
        "Fujian",
        "Fujian Province"
      ],
      region_id: null
    },

    {
      id: "CNGD",
      display: "Guangdong",
      names: [
        "Guangdong",
        "Guangdong Province"
      ],
      region_id: null
    },

    {
      id: "CNGS",
      display: "Gansu",
      names: [
        "Gansu",
        "Gansu Province"
      ],
      region_id: null
    },

    {
      id: "CNGX",
      display: "Guangxi",
      names: [
        "Guangxi",
        "Guangxi Zhuang Autonomous Region"
      ],
      region_id: null
    },

    {
      id: "CNGZ",
      display: "Guizhou",
      names: [
        "Guizhou",
        "Guizhou Province"
      ],
      region_id: null
    },

    {
      id: "CNHA",
      display: "Henan",
      names: [
        "Henan",
        "Henan Province"
      ],
      region_id: null
    },

    {
      id: "CNHB",
      display: "Hubei",
      names: [
        "Hubei",
        "Hubei Province"
      ],
      region_id: null
    },

    {
      id: "CNHE",
      display: "Hebei",
      names: [
        "Hebei",
        "Hebei Province"
      ],
      region_id: null
    },

    {
      id: "CNHI",
      display: "Hainan",
      names: [
        "Hainan",
        "Hainan Province"
      ],
      region_id: null
    },

    {
      id: "CNHK",
      display: "Hong Kong",
      names: [
        "Hong Kong",
        "Hong Kong SAR",
        "Hong Kong Special Administrative Region"
      ],
      region_id: null
    },

    {
      id: "CNHL",
      display: "Heilongjiang",
      names: [
        "Heilongjiang",
        "Heilongjiang Province",
        "Heilungkiang"
      ],
      region_id: null
    },

    {
      id: "CNHN",
      display: "Hunan",
      names: [
        "Hunan",
        "Hunan Province"
      ],
      region_id: null
    },

    {
      id: "CNJL",
      display: "Jilin",
      names: [
        "Jilin",
        "Jilin Province",
        "Kirin"
      ],
      region_id: null
    },

    {
      id: "CNJS",
      display: "Jiangsu",
      names: [
        "Jiangsu",
        "Jiangsu Province"
      ],
      region_id: null
    },

    {
      id: "CNJX",
      display: "Jiangxi",
      names: [
        "Jiangxi",
        "Jiangxi Province"
      ],
      region_id: null
    },

    {
      id: "CNLN",
      display: "Liaoning",
      names: [
        "Liaoning",
        "Liaoning Province"
      ],
      region_id: null
    },

    {
      id: "CNMO",
      display: "Macao",
      names: [
        "Macao",
        "Macau",
        "Macao SAR",
        "Macao Special Administrative Region"
      ],
      region_id: null
    },

    {
      id: "CNNM",
      display: "Inner Mongolia",
      names: [
        "Inner Mongolia",
        "Inner Mongolia Autonomous Region",
        "Nei Mongol"
      ],
      region_id: null
    },

    {
      id: "CNNX",
      display: "Ningxia",
      names: [
        "Ningxia",
        "Ningxia Hui Autonomous Region"
      ],
      region_id: null
    },

    {
      id: "CNQH",
      display: "Qinghai",
      names: [
        "Qinghai",
        "Qinghai Province"
      ],
      region_id: null
    },

    {
      id: "CNSC",
      display: "Sichuan",
      names: [
        "Sichuan",
        "Sichuan Province"
      ],
      region_id: null
    },

    {
      id: "CNSD",
      display: "Shandong",
      names: [
        "Shandong",
        "Shandong Province"
      ],
      region_id: null
    },

    {
      id: "CNSH",
      display: "Shanghai",
      names: [
        "Shanghai",
        "Shanghai Municipality"
      ],
      region_id: null
    },

    {
      id: "CNSN",
      display: "Shaanxi",
      names: [
        "Shaanxi",
        "Shaanxi Province"
      ],
      region_id: null
    },

    {
      id: "CNSX",
      display: "Shanxi",
      names: [
        "Shanxi",
        "Shanxi Province"
      ],
      region_id: null
    },

    {
      id: "CNTJ",
      display: "Tianjin",
      names: [
        "Tianjin",
        "Tianjin Municipality"
      ],
      region_id: null
    },

    {
      id: "CNTW",
      display: "Taiwan",
      names: [
        "Taiwan",
        "Taiwan Province"
      ],
      region_id: null
    },

    {
      id: "CNXJ",
      display: "Xinjiang",
      names: [
        "Xinjiang",
        "Xinjiang Uygur Autonomous Region",
        "Xinjiang Uyghur Autonomous Region"
      ],
      region_id: null
    },

    {
      id: "CNXZ",
      display: "Tibet",
      names: [
        "Tibet",
        "Tibet Autonomous Region",
        "Xizang",
        "Xizang Autonomous Region"
      ],
      region_id: null
    },

    {
      id: "CNYN",
      display: "Yunnan",
      names: [
        "Yunnan",
        "Yunnan Province"
      ],
      region_id: null
    },

    {
      id: "CNZJ",
      display: "Zhejiang",
      names: [
        "Zhejiang",
        "Zhejiang Province"
      ],
      region_id: null
    }
  ]
};