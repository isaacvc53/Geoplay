// data/countries/russia.js
// Based on the Russia Admin Areas (level 1) SVG.
// Note: this SVG has 83 federal subjects (Crimea and Sevastopol are not included).

window.GEOTARIA_COUNTRY = {
  slug: "russia",
  lang: "en",
  kicker: "GeoPlay · Russia",
  title: "How many regions of Russia can you name?",
  subtitle: "Type a Russian region and the map will fill in.",
  total: 83,
  quizSeconds: 30 * 60,

  geoFile: "../data/geo/russia.svg",

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
    "You've completed all 83 regions of Russia! 🇷🇺",

  timeUpMessage: "Time's up.",

  giveUpMessage:
    "Quiz finished: {count}/83. The missing regions are highlighted; hover over them to see their names.",

  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",

  loadErrorMessage:
    "Could not load the map of Russia. Check your connection.",

  regions: [
    {
      id: "RU-AD",
      display: "Adygea",
      names: ["Adygea", "Republic of Adygea", "Adygeya", "Республика Адыгея"],
      region_id: null
    },
    {
      id: "RU-ALT",
      display: "Altai Krai",
      names: ["Altai Krai", "Altai Territory", "Altai Kray", "Алтайский край"],
      region_id: null
    },
    {
      id: "RU-AL",
      display: "Altai Republic",
      names: ["Altai Republic", "Republic of Altai", "Gorno-Altai", "Республика Алтай"],
      region_id: null
    },
    {
      id: "RU-AMU",
      display: "Amur Oblast",
      names: ["Amur", "Amur Oblast", "Amur Region", "Амурская область"],
      region_id: null
    },
    {
      id: "RU-ARK",
      display: "Arkhangelsk Oblast",
      names: ["Arkhangelsk", "Arkhangelsk Oblast", "Arkhangelsk Region", "Archangel", "Архангельская область"],
      region_id: null
    },
    {
      id: "RU-AST",
      display: "Astrakhan Oblast",
      names: ["Astrakhan", "Astrakhan Oblast", "Astrakhan Region", "Астраханская область"],
      region_id: null
    },
    {
      id: "RU-BA",
      display: "Bashkortostan",
      names: ["Bashkortostan", "Bashkiria", "Republic of Bashkortostan", "Республика Башкортостан"],
      region_id: null
    },
    {
      id: "RU-BEL",
      display: "Belgorod Oblast",
      names: ["Belgorod", "Belgorod Oblast", "Belgorod Region", "Белгородская область"],
      region_id: null
    },
    {
      id: "RU-BRY",
      display: "Bryansk Oblast",
      names: ["Bryansk", "Bryansk Oblast", "Bryansk Region", "Брянская область"],
      region_id: null
    },
    {
      id: "RU-BU",
      display: "Buryatia",
      names: ["Buryatia", "Republic of Buryatia", "Республика Бурятия"],
      region_id: null
    },
    {
      id: "RU-CE",
      display: "Chechnya",
      names: ["Chechnya", "Chechen Republic", "Чеченская республика"],
      region_id: null
    },
    {
      id: "RU-CHE",
      display: "Chelyabinsk Oblast",
      names: ["Chelyabinsk", "Chelyabinsk Oblast", "Chelyabinsk Region", "Челябинская область"],
      region_id: null
    },
    {
      id: "RU-CHU",
      display: "Chukotka",
      names: ["Chukotka", "Chukotka Autonomous Okrug", "Chukotka Okrug", "Chukchi", "Чукотский автономный округ"],
      region_id: null
    },
    {
      id: "RU-CU",
      display: "Chuvashia",
      names: ["Chuvashia", "Chuvash Republic", "Чувашская республика"],
      region_id: null
    },
    {
      id: "RU-DA",
      display: "Dagestan",
      names: ["Dagestan", "Republic of Dagestan", "Республика Дагестан"],
      region_id: null
    },
    {
      id: "RU-IN",
      display: "Ingushetia",
      names: ["Ingushetia", "Republic of Ingushetia", "Республика Ингушетия"],
      region_id: null
    },
    {
      id: "RU-IRK",
      display: "Irkutsk Oblast",
      names: ["Irkutsk", "Irkutsk Oblast", "Irkutsk Region", "Иркутская область"],
      region_id: null
    },
    {
      id: "RU-IVA",
      display: "Ivanovo Oblast",
      names: ["Ivanovo", "Ivanovo Oblast", "Ivanovo Region", "Ивановская область"],
      region_id: null
    },
    {
      id: "RU-YEV",
      display: "Jewish Autonomous Oblast",
      names: ["Jewish Autonomous Oblast", "Jewish Oblast", "Jewish Autonomous Region", "Birobidzhan", "Еврейская автономная область"],
      region_id: null
    },
    {
      id: "RU-KB",
      display: "Kabardino-Balkaria",
      names: ["Kabardino-Balkaria", "Kabardino Balkaria", "Kabardino-Balkar Republic", "Kabardia", "Кабардино-Балкарская республика"],
      region_id: null
    },
    {
      id: "RU-KGD",
      display: "Kaliningrad Oblast",
      names: ["Kaliningrad", "Kaliningrad Oblast", "Kaliningrad Region", "Калининградская область"],
      region_id: null
    },
    {
      id: "RU-KL",
      display: "Kalmykia",
      names: ["Kalmykia", "Republic of Kalmykia", "Республика Калмыкия"],
      region_id: null
    },
    {
      id: "RU-KLU",
      display: "Kaluga Oblast",
      names: ["Kaluga", "Kaluga Oblast", "Kaluga Region", "Калужская область"],
      region_id: null
    },
    {
      id: "RU-KAM",
      display: "Kamchatka Krai",
      names: ["Kamchatka Krai", "Kamchatka Territory", "Kamchatka", "Камчатский край"],
      region_id: null
    },
    {
      id: "RU-KC",
      display: "Karachay-Cherkessia",
      names: ["Karachay-Cherkessia", "Karachay Cherkessia", "Karachaevo-Cherkessia", "Karachay-Cherkess Republic", "Карачаево-Черкесская республика"],
      region_id: null
    },
    {
      id: "RU-KR",
      display: "Karelia",
      names: ["Karelia", "Republic of Karelia", "Республика Карелия"],
      region_id: null
    },
    {
      id: "RU-KEM",
      display: "Kemerovo Oblast",
      names: ["Kemerovo", "Kemerovo Oblast", "Kemerovo Region", "Kuzbass", "Кемеровская область"],
      region_id: null
    },
    {
      id: "RU-KHA",
      display: "Khabarovsk Krai",
      names: ["Khabarovsk Krai", "Khabarovsk Territory", "Khabarovsk", "Хабаровский край"],
      region_id: null
    },
    {
      id: "RU-KK",
      display: "Khakassia",
      names: ["Khakassia", "Republic of Khakassia", "Республика Хакасия"],
      region_id: null
    },
    {
      id: "RU-KHM",
      display: "Khanty-Mansi Autonomous Okrug",
      names: ["Khanty-Mansi", "Khanty Mansi", "Khanty-Mansiysk", "Khanty-Mansi Autonomous Okrug", "KhMAO", "Yugra", "Ханты-Мансийский автономный округ"],
      region_id: null
    },
    {
      id: "RU-KIR",
      display: "Kirov Oblast",
      names: ["Kirov", "Kirov Oblast", "Kirov Region", "Кировская область"],
      region_id: null
    },
    {
      id: "RU-KO",
      display: "Komi",
      names: ["Komi", "Komi Republic", "Republic of Komi", "Республика Коми"],
      region_id: null
    },
    {
      id: "RU-KOS",
      display: "Kostroma Oblast",
      names: ["Kostroma", "Kostroma Oblast", "Kostroma Region", "Костромская область"],
      region_id: null
    },
    {
      id: "RU-KDA",
      display: "Krasnodar Krai",
      names: ["Krasnodar Krai", "Krasnodar Territory", "Krasnodar", "Kuban", "Краснодарский край"],
      region_id: null
    },
    {
      id: "RU-KYA",
      display: "Krasnoyarsk Krai",
      names: ["Krasnoyarsk Krai", "Krasnoyarsk Territory", "Krasnoyarsk", "Красноярский край"],
      region_id: null
    },
    {
      id: "RU-KGN",
      display: "Kurgan Oblast",
      names: ["Kurgan", "Kurgan Oblast", "Kurgan Region", "Курганская область"],
      region_id: null
    },
    {
      id: "RU-KRS",
      display: "Kursk Oblast",
      names: ["Kursk", "Kursk Oblast", "Kursk Region", "Курская область"],
      region_id: null
    },
    {
      id: "RU-LEN",
      display: "Leningrad Oblast",
      names: ["Leningrad Oblast", "Leningrad Region", "Leningrad", "Ленинградская область"],
      region_id: null
    },
    {
      id: "RU-LIP",
      display: "Lipetsk Oblast",
      names: ["Lipetsk", "Lipetsk Oblast", "Lipetsk Region", "Липецкая область"],
      region_id: null
    },
    {
      id: "RU-MAG",
      display: "Magadan Oblast",
      names: ["Magadan", "Magadan Oblast", "Magadan Region", "Магаданская область"],
      region_id: null
    },
    {
      id: "RU-ME",
      display: "Mari El",
      names: ["Mari El", "Mari-El", "Mari El Republic", "Republic of Mari El", "Республика Марий Эл"],
      region_id: null
    },
    {
      id: "RU-MO",
      display: "Mordovia",
      names: ["Mordovia", "Republic of Mordovia", "Республика Мордовия"],
      region_id: null
    },
    {
      id: "RU-MOW",
      display: "Moscow",
      names: ["Moscow", "Moscow City", "City of Moscow", "Москва"],
      region_id: null
    },
    {
      id: "RU-MOS",
      display: "Moscow Oblast",
      names: ["Moscow Oblast", "Moscow Region", "Moskovskaya Oblast", "Московская область"],
      region_id: null
    },
    {
      id: "RU-MUR",
      display: "Murmansk Oblast",
      names: ["Murmansk", "Murmansk Oblast", "Murmansk Region", "Мурманская область"],
      region_id: null
    },
    {
      id: "RU-NEN",
      display: "Nenets Autonomous Okrug",
      names: ["Nenets", "Nenets Autonomous Okrug", "Nenets Okrug", "Ненецкий автономный округ"],
      region_id: null
    },
    {
      id: "RU-NIZ",
      display: "Nizhny Novgorod Oblast",
      names: ["Nizhny Novgorod", "Nizhny Novgorod Oblast", "Nizhny Novgorod Region", "Nizhniy Novgorod", "Nizhegorod", "Нижегородская область"],
      region_id: null
    },
    {
      id: "RU-SE",
      display: "North Ossetia–Alania",
      names: ["North Ossetia", "North Ossetia-Alania", "North Ossetia Alania", "Alania", "Республика Северная Осетия — Алания"],
      region_id: null
    },
    {
      id: "RU-NGR",
      display: "Novgorod Oblast",
      names: ["Novgorod", "Novgorod Oblast", "Novgorod Region", "Veliky Novgorod", "Новгородская область"],
      region_id: null
    },
    {
      id: "RU-NVS",
      display: "Novosibirsk Oblast",
      names: ["Novosibirsk", "Novosibirsk Oblast", "Novosibirsk Region", "Новосибирская область"],
      region_id: null
    },
    {
      id: "RU-OMS",
      display: "Omsk Oblast",
      names: ["Omsk", "Omsk Oblast", "Omsk Region", "Омская область"],
      region_id: null
    },
    {
      id: "RU-ORE",
      display: "Orenburg Oblast",
      names: ["Orenburg", "Orenburg Oblast", "Orenburg Region", "Оренбургская область"],
      region_id: null
    },
    {
      id: "RU-ORL",
      display: "Oryol Oblast",
      names: ["Oryol", "Oryol Oblast", "Oryol Region", "Orel", "Орловская область"],
      region_id: null
    },
    {
      id: "RU-PNZ",
      display: "Penza Oblast",
      names: ["Penza", "Penza Oblast", "Penza Region", "Пензенская область"],
      region_id: null
    },
    {
      id: "RU-PER",
      display: "Perm Krai",
      names: ["Perm Krai", "Perm Territory", "Perm", "Пермский край"],
      region_id: null
    },
    {
      id: "RU-PRI",
      display: "Primorsky Krai",
      names: ["Primorsky Krai", "Primorsky Territory", "Primorsky", "Primorskiy", "Primorye", "Приморский край"],
      region_id: null
    },
    {
      id: "RU-PSK",
      display: "Pskov Oblast",
      names: ["Pskov", "Pskov Oblast", "Pskov Region", "Псковская область"],
      region_id: null
    },
    {
      id: "RU-ROS",
      display: "Rostov Oblast",
      names: ["Rostov", "Rostov Oblast", "Rostov Region", "Ростовская область"],
      region_id: null
    },
    {
      id: "RU-RYA",
      display: "Ryazan Oblast",
      names: ["Ryazan", "Ryazan Oblast", "Ryazan Region", "Рязанская область"],
      region_id: null
    },
    {
      id: "RU-SPE",
      display: "Saint Petersburg",
      names: ["Saint Petersburg", "St Petersburg", "St. Petersburg", "Sankt-Peterburg", "Petersburg", "Санкт-Петербург"],
      region_id: null
    },
    {
      id: "RU-SA",
      display: "Sakha (Yakutia)",
      names: ["Sakha", "Yakutia", "Sakha Republic", "Republic of Sakha", "Sakha (Yakutia)", "Yakutiya", "Республика Саха (Якутия)"],
      region_id: null
    },
    {
      id: "RU-SAK",
      display: "Sakhalin Oblast",
      names: ["Sakhalin", "Sakhalin Oblast", "Sakhalin Region", "Сахалинская область"],
      region_id: null
    },
    {
      id: "RU-SAM",
      display: "Samara Oblast",
      names: ["Samara", "Samara Oblast", "Samara Region", "Самарская область"],
      region_id: null
    },
    {
      id: "RU-SAR",
      display: "Saratov Oblast",
      names: ["Saratov", "Saratov Oblast", "Saratov Region", "Саратовская область"],
      region_id: null
    },
    {
      id: "RU-SMO",
      display: "Smolensk Oblast",
      names: ["Smolensk", "Smolensk Oblast", "Smolensk Region", "Смоленская область"],
      region_id: null
    },
    {
      id: "RU-STA",
      display: "Stavropol Krai",
      names: ["Stavropol Krai", "Stavropol Territory", "Stavropol", "Ставропольский край"],
      region_id: null
    },
    {
      id: "RU-SVE",
      display: "Sverdlovsk Oblast",
      names: ["Sverdlovsk", "Sverdlovsk Oblast", "Sverdlovsk Region", "Свердловская область"],
      region_id: null
    },
    {
      id: "RU-TAM",
      display: "Tambov Oblast",
      names: ["Tambov", "Tambov Oblast", "Tambov Region", "Тамбовская область"],
      region_id: null
    },
    {
      id: "RU-TA",
      display: "Tatarstan",
      names: ["Tatarstan", "Republic of Tatarstan", "Республика Татарстан"],
      region_id: null
    },
    {
      id: "RU-TOM",
      display: "Tomsk Oblast",
      names: ["Tomsk", "Tomsk Oblast", "Tomsk Region", "Томская область"],
      region_id: null
    },
    {
      id: "RU-TUL",
      display: "Tula Oblast",
      names: ["Tula", "Tula Oblast", "Tula Region", "Тульская область"],
      region_id: null
    },
    {
      id: "RU-TY",
      display: "Tuva",
      names: ["Tuva", "Tyva", "Republic of Tuva", "Tyva Republic", "Республика Тыва"],
      region_id: null
    },
    {
      id: "RU-TVE",
      display: "Tver Oblast",
      names: ["Tver", "Tver Oblast", "Tver Region", "Тверская область"],
      region_id: null
    },
    {
      id: "RU-TYU",
      display: "Tyumen Oblast",
      names: ["Tyumen", "Tyumen Oblast", "Tyumen Region", "Тюменская область"],
      region_id: null
    },
    {
      id: "RU-UD",
      display: "Udmurtia",
      names: ["Udmurtia", "Udmurt Republic", "Republic of Udmurtia", "Удмуртская республика"],
      region_id: null
    },
    {
      id: "RU-ULY",
      display: "Ulyanovsk Oblast",
      names: ["Ulyanovsk", "Ulyanovsk Oblast", "Ulyanovsk Region", "Ульяновская область"],
      region_id: null
    },
    {
      id: "RU-VLA",
      display: "Vladimir Oblast",
      names: ["Vladimir", "Vladimir Oblast", "Vladimir Region", "Владимирская область"],
      region_id: null
    },
    {
      id: "RU-VGG",
      display: "Volgograd Oblast",
      names: ["Volgograd", "Volgograd Oblast", "Volgograd Region", "Волгоградская область"],
      region_id: null
    },
    {
      id: "RU-VLG",
      display: "Vologda Oblast",
      names: ["Vologda", "Vologda Oblast", "Vologda Region", "Вологодская область"],
      region_id: null
    },
    {
      id: "RU-VOR",
      display: "Voronezh Oblast",
      names: ["Voronezh", "Voronezh Oblast", "Voronezh Region", "Воронежская область"],
      region_id: null
    },
    {
      id: "RU-YAN",
      display: "Yamalo-Nenets Autonomous Okrug",
      names: ["Yamalo-Nenets", "Yamalo Nenets", "Yamal", "Yamalo-Nenets Autonomous Okrug", "YNAO", "Ямало-Ненецкий автономный округ"],
      region_id: null
    },
    {
      id: "RU-YAR",
      display: "Yaroslavl Oblast",
      names: ["Yaroslavl", "Yaroslavl Oblast", "Yaroslavl Region", "Ярославская область"],
      region_id: null
    },
    {
      id: "RU-ZAB",
      display: "Zabaykalsky Krai",
      names: ["Zabaykalsky Krai", "Zabaykalsky Territory", "Zabaykalsky", "Zabaykalye", "Zabaikalsky Krai", "Zabaikalye", "Transbaikal", "Transbaikalia", "Забайкальский край"],
      region_id: null
    }
  ]
};