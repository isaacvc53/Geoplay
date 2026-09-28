// Datos del quiz "Los 197 países" (extraídos de paises-del-mundo.html).
// Las claves de ALIAS e ISO_POR_PAIS van SIN tildes (pasan por normalizar()).

export const CONTINENTES = {
  europa: { nombre: "Europa", paises: ["Albania","Alemania","Andorra","Austria","Bélgica","Bielorrusia","Bosnia y Herzegovina","Bulgaria","Chipre","Croacia","Dinamarca","Eslovaquia","Eslovenia","España","Estonia","Finlandia","Francia","Grecia","Hungría","Irlanda","Islandia","Italia","Kosovo","Letonia","Liechtenstein","Lituania","Luxemburgo","Macedonia del Norte","Malta","Moldavia","Mónaco","Montenegro","Noruega","Países Bajos","Polonia","Portugal","Reino Unido","República Checa","Rumanía","Rusia","San Marino","Serbia","Suecia","Suiza","Ucrania","Vaticano"] },
  asia: { nombre: "Asia", paises: ["Afganistán","Arabia Saudita","Armenia","Azerbaiyán","Baréin","Bangladés","Bután","Brunéi","Camboya","Catar","China","Corea del Norte","Corea del Sur","Emiratos Árabes Unidos","Filipinas","Georgia","India","Indonesia","Irak","Irán","Israel","Japón","Jordania","Kazajistán","Kirguistán","Kuwait","Laos","Líbano","Malasia","Maldivas","Mongolia","Myanmar","Nepal","Omán","Pakistán","Palestina","Singapur","Siria","Sri Lanka","Tailandia","Taiwán","Tayikistán","Timor Oriental","Turkmenistán","Turquía","Uzbekistán","Vietnam","Yemen"] },
  africa: { nombre: "África", paises: ["Angola","Argelia","Benín","Botsuana","Burkina Faso","Burundi","Cabo Verde","Camerún","Chad","Comoras","Costa de Marfil","Egipto","Eritrea","Esuatini","Etiopía","Gabón","Gambia","Ghana","Guinea","Guinea-Bisáu","Guinea Ecuatorial","Kenia","Lesoto","Liberia","Libia","Madagascar","Malaui","Malí","Marruecos","Mauricio","Mauritania","Mozambique","Namibia","Níger","Nigeria","República Centroafricana","República del Congo","República Democrática del Congo","Ruanda","Santo Tomé y Príncipe","Senegal","Seychelles","Sierra Leona","Somalia","Sudáfrica","Sudán","Sudán del Sur","Tanzania","Togo","Túnez","Uganda","Yibuti","Zambia","Zimbabue"] },
  america: { nombre: "América", paises: ["Antigua y Barbuda","Argentina","Bahamas","Barbados","Belice","Bolivia","Brasil","Canadá","Chile","Colombia","Costa Rica","Cuba","Dominica","Ecuador","El Salvador","Estados Unidos","Granada","Guatemala","Guyana","Haití","Honduras","Jamaica","México","Nicaragua","Panamá","Paraguay","Perú","República Dominicana","San Cristóbal y Nieves","San Vicente y las Granadinas","Santa Lucía","Surinam","Trinidad y Tobago","Uruguay","Venezuela"] },
  oceania: { nombre: "Oceanía", paises: ["Australia","Fiyi","Islas Marshall","Islas Salomón","Kiribati","Micronesia","Nauru","Nueva Zelanda","Palaos","Papúa Nueva Guinea","Samoa","Tonga","Tuvalu","Vanuatu"] }
};

// Alias comunes -> nombre exacto de las listas de arriba (claves ya normalizadas).
export const ALIAS = {
  "eeuu":"estados unidos", "usa":"estados unidos", "ee uu":"estados unidos",
  "uk":"reino unido", "gran bretana":"reino unido", "inglaterra":"reino unido",
  "holanda":"paises bajos",
  "chequia":"republica checa",
  "birmania":"myanmar",
  "suazilandia":"esuatini", "swazilandia":"esuatini",
  "macedonia":"macedonia del norte",
  "emiratos":"emiratos arabes unidos", "emiratos arabes":"emiratos arabes unidos",
  "congo brazzaville":"republica del congo",
  "congo kinshasa":"republica democratica del congo", "rd congo":"republica democratica del congo", "rdc":"republica democratica del congo",
  "timor este":"timor oriental", "timor leste":"timor oriental",
  "bosnia":"bosnia y herzegovina",
  "santa sede":"vaticano",
  "corea sur":"corea del sur",
  "corea norte":"corea del norte"
};

// ISO-2 por país (clave normalizada); solo para la banderita de flagcdn.com.
export const ISO_POR_PAIS = {
  "albania":"al","alemania":"de","andorra":"ad","austria":"at","belgica":"be","bielorrusia":"by",
  "bosnia y herzegovina":"ba","bulgaria":"bg","chipre":"cy","croacia":"hr","dinamarca":"dk","eslovaquia":"sk",
  "eslovenia":"si","espana":"es","estonia":"ee","finlandia":"fi","francia":"fr","grecia":"gr","hungria":"hu",
  "irlanda":"ie","islandia":"is","italia":"it","kosovo":"xk","letonia":"lv","liechtenstein":"li","lituania":"lt",
  "luxemburgo":"lu","macedonia del norte":"mk","malta":"mt","moldavia":"md","monaco":"mc","montenegro":"me",
  "noruega":"no","paises bajos":"nl","polonia":"pl","portugal":"pt","reino unido":"gb","republica checa":"cz",
  "rumania":"ro","rusia":"ru","san marino":"sm","serbia":"rs","suecia":"se","suiza":"ch","ucrania":"ua",
  "vaticano":"va","afganistan":"af","arabia saudita":"sa","armenia":"am","azerbaiyan":"az","barein":"bh",
  "banglades":"bd","butan":"bt","brunei":"bn","camboya":"kh","catar":"qa","china":"cn","corea del norte":"kp",
  "corea del sur":"kr","emiratos arabes unidos":"ae","filipinas":"ph","georgia":"ge","india":"in","indonesia":"id",
  "irak":"iq","iran":"ir","israel":"il","japon":"jp","jordania":"jo","kazajistan":"kz","kirguistan":"kg",
  "kuwait":"kw","laos":"la","libano":"lb","malasia":"my","maldivas":"mv","mongolia":"mn","myanmar":"mm",
  "nepal":"np","oman":"om","pakistan":"pk","palestina":"ps","singapur":"sg","siria":"sy","sri lanka":"lk",
  "tailandia":"th","taiwan":"tw","tayikistan":"tj","timor oriental":"tl","turkmenistan":"tm","turquia":"tr",
  "uzbekistan":"uz","vietnam":"vn","yemen":"ye","angola":"ao","argelia":"dz","benin":"bj","botsuana":"bw",
  "burkina faso":"bf","burundi":"bi","cabo verde":"cv","camerun":"cm","chad":"td","comoras":"km",
  "costa de marfil":"ci","egipto":"eg","eritrea":"er","esuatini":"sz","etiopia":"et","gabon":"ga","gambia":"gm",
  "ghana":"gh","guinea":"gn","guineabisau":"gw","guinea ecuatorial":"gq","kenia":"ke","lesoto":"ls","liberia":"lr",
  "libia":"ly","madagascar":"mg","malaui":"mw","mali":"ml","marruecos":"ma","mauricio":"mu","mauritania":"mr",
  "mozambique":"mz","namibia":"na","niger":"ne","nigeria":"ng","republica centroafricana":"cf",
  "republica del congo":"cg","republica democratica del congo":"cd","ruanda":"rw","santo tome y principe":"st",
  "senegal":"sn","seychelles":"sc","sierra leona":"sl","somalia":"so","sudafrica":"za","sudan":"sd",
  "sudan del sur":"ss","tanzania":"tz","togo":"tg","tunez":"tn","uganda":"ug","yibuti":"dj","zambia":"zm",
  "zimbabue":"zw","antigua y barbuda":"ag","argentina":"ar","bahamas":"bs","barbados":"bb","belice":"bz",
  "bolivia":"bo","brasil":"br","canada":"ca","chile":"cl","colombia":"co","costa rica":"cr","cuba":"cu",
  "dominica":"dm","ecuador":"ec","el salvador":"sv","estados unidos":"us","granada":"gd","guatemala":"gt",
  "guyana":"gy","haiti":"ht","honduras":"hn","jamaica":"jm","mexico":"mx","nicaragua":"ni","panama":"pa",
  "paraguay":"py","peru":"pe","republica dominicana":"do","san cristobal y nieves":"kn",
  "san vicente y las granadinas":"vc","santa lucia":"lc","surinam":"sr","trinidad y tobago":"tt","uruguay":"uy",
  "venezuela":"ve","australia":"au","fiyi":"fj","islas marshall":"mh","islas salomon":"sb","kiribati":"ki",
  "micronesia":"fm","nauru":"nr","nueva zelanda":"nz","palaos":"pw","papua nueva guinea":"pg","samoa":"ws",
  "tonga":"to","tuvalu":"tv","vanuatu":"vu"
};
