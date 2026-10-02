# Genera frontend/public/data/world-admin1.topojson a partir de Natural Earth (admin-1, 10m).
# Uso (desde una carpeta con ne/ y Geoplay/): python3 build_world_admin1.py   (necesita pyshp y `npm i mapshaper`)
import json, subprocess, collections, shapefile, os
SHP='ne/ne_10m_admin_1_states_provinces'
META=json.load(open('Geoplay/backend/paises_meta.json',encoding='utf-8'))
ISO2CONT={'Europa':'europa','Asia':'asia','África':'africa','Oceanía':'oceania'}
iso2={v['iso'].upper():(k,ISO2CONT.get(v['continente'],'america')) for k,v in META.items()}
# Territorios que no están en paises_meta.json -> (continente, nombre en español)
EXTRA={'ESB':('europa','Dhekelia'),'SOL':('africa','Somalilandia'),'SAH':('africa','Sáhara Occidental'),'MAF':('america','San Martín'),
'SXM':('america','Sint Maarten'),'USG':('america','Guantánamo'),'GIB':('europa','Gibraltar'),'HKG':('asia','Hong Kong'),'CYN':('europa','Chipre del Norte'),
'KAS':('asia','Siachen'),'KAB':('asia','Baikonur'),'WSB':('europa','Akrotiri'),'ATA':('otros','Antártida'),'NCL':('oceania','Nueva Caledonia'),
'CUW':('america','Curazao'),'ABW':('america','Aruba'),'TCA':('america','Islas Turcas y Caicos'),'SPM':('america','San Pedro y Miquelón'),
'GRL':('america','Groenlandia'),'PCN':('oceania','Islas Pitcairn'),'PYF':('oceania','Polinesia Francesa'),'ATF':('otros','Tierras Australes Francesas'),
'UMI':('oceania','Islas menores de EE. UU.'),'MSR':('america','Montserrat'),'VIR':('america','Islas Vírgenes de EE. UU.'),'BLM':('america','San Bartolomé'),
'PRI':('america','Puerto Rico'),'AIA':('america','Anguila'),'VGB':('america','Islas Vírgenes Británicas'),'CYM':('america','Islas Caimán'),
'BMU':('america','Bermudas'),'HMD':('otros','Islas Heard y McDonald'),'SHN':('africa','Santa Elena'),'JEY':('europa','Jersey'),'GGY':('europa','Guernsey'),
'IMN':('europa','Isla de Man'),'ALD':('europa','Åland'),'FRO':('europa','Islas Feroe'),'IOA':('oceania','Territorios del océano Índico'),
'IOT':('asia','Territorio Británico del Océano Índico'),'NFK':('oceania','Isla Norfolk'),'COK':('oceania','Islas Cook'),'WLF':('oceania','Wallis y Futuna'),
'SGS':('america','Georgia del Sur'),'FLK':('america','Islas Malvinas'),'NIU':('oceania','Niue'),'ASM':('oceania','Samoa Americana'),'GUM':('oceania','Guam'),
'MNP':('oceania','Islas Marianas del Norte'),'CSI':('oceania','Islas del Mar del Coral'),'NZL':('oceania','Nueva Zelanda'),'PGA':('asia','Islas Spratly'),
'CLP':('america','Isla Clipperton'),'MAC':('asia','Macao')}
# Nombre en inglés de los territorios que no están en paises_meta.json (y retoques de nombres de NE)
EN_FIX={'Macau S.A.R':'Macau','Hong Kong S.A.R.':'Hong Kong','Macedonia':'North Macedonia','Swaziland':'Eswatini','Aland':'Åland',
'Republic of Serbia':'Serbia','United Republic of Tanzania':'Tanzania','Ivory Coast':'Ivory Coast','Spratly Is.':'Spratly Islands',
'Indian Ocean Territories':'Indian Ocean Territories','The Bahamas':'Bahamas','Vatican':'Vatican City'}
EN_ISO={v['iso'].upper():v['en'] for v in META.values()}
# Nombres en inglés de las regiones fundidas (Natural Earth trae el nombre local)
EN_OVR={'Lombardia':'Lombardy','Piemonte':'Piedmont',"Valle d'Aosta":'Aosta Valley','Trentino-Alto Adige':'Trentino-South Tyrol','Toscana':'Tuscany',
'Sardegna':'Sardinia','Sicily':'Sicily','Apulia':'Apulia','Bretagne':'Brittany','Normandie':'Normandy','Corse':'Corsica','Occitanie':'Occitania',
'Guyane française':'French Guiana','Île-de-France':'Île-de-France','País Vasco':'Basque Country','Cataluña':'Catalonia','Andalucía':'Andalusia',
'Aragón':'Aragon','Islas Baleares':'Balearic Islands','Canary Is.':'Canary Islands','Foral de Navarra':'Navarre','Valenciana':'Valencia',
'Castilla y León':'Castile and León','Castilla-La Mancha':'Castilla-La Mancha','Murcia':'Murcia','Asturias':'Asturias','Galicia':'Galicia',
'Autonomous Region in Muslim Mindanao (ARMM)':'Bangsamoro','Davao (Region XI)':'Davao','Zamboanga Peninsula (Region IX)':'Zamboanga Peninsula',
'MIMAROPA (Region IV-B)':'Mimaropa','Dinagat Islands (Region XIII)':'Caraga','Northern Mindanao (Region X)':'Northern Mindanao',
'SOCCSKSARGEN (Region XII)':'Soccsksargen','Eastern Visayas (Region VIII)':'Eastern Visayas','Central Luzon (Region III)':'Central Luzon',
'CALABARZON (Region IV-A)':'Calabarzon','Bicol (Region V)':'Bicol','National Capital Region':'Metro Manila','Ilocos (Region I)':'Ilocos',
'Cagayan Valley (Region II)':'Cagayan Valley','Central Visayas (Region VII)':'Central Visayas','Western Visayas (Region VI)':'Western Visayas',
'Cordillera Administrative Region (CAR)':'Cordillera'}
# Países que Natural Earth trocea en niveles inferiores: se funden por el campo `region` (= primer nivel oficial)
MERGE={'ITA','ESP','FRA','PHL'}
import unicodedata
def nk(t): return ''.join(c for c in unicodedata.normalize('NFD',(t or '').lower()) if unicodedata.category(c)!='Mn').strip()
NES=json.load(open('Geoplay/backend/nombres_es_regiones.json',encoding='utf-8'))   # slug -> {nombre EN: [variantes ES]}
NES={slug:{nk(k):v for k,v in d.items()} for slug,d in NES.items()}
ISO2SLUG={}
for v in META.values(): ISO2SLUG[v['iso'].upper()]=[v['slug_front'],v['slug_archivo']]
r=shapefile.Reader(SHP); F=[f[0] for f in r.fields[1:]]; ix={n:i for i,n in enumerate(F)}
rows=[dict(zip(F,x)) for x in r.records()]
# 1) mapshaper: añade campos calculados y funde los países de MERGE
out=[]
for i,x in enumerate(rows):
    a2,a3=x['iso_a2'],x['adm0_a3']
    if a2 in iso2 and a3!='NZL' or (a2 in iso2 and x['admin']!='New Zealand'): es,cont=iso2[a2]
    else: cont,es=EXTRA.get(a3,('otros',x['admin']))
    if a3 in EXTRA and a2 not in iso2: cont,es=EXTRA[a3]
    if x['admin']=='New Zealand': cont,es=('oceania','Nueva Zelanda')
    ce_en=EN_FIX.get(x['admin'],EN_ISO.get(a2) if (a2 in EN_ISO and x['admin']!='New Zealand') else x['admin'])
    merge=a3 in MERGE
    name=x['region'] if merge else x['name']
    es_name=(x['region'] if merge else (x['name_es'] or x['name'])) or x['admin']
    nes=(EN_OVR.get(x['region'],x['region']) if merge else (x['name_en'] or x['name'])) or es_name   # nombre mostrado: inglés
    alias=set(filter(None,[name,es_name,x['name_en'],x['name_local']]+(x['name_alt'] or '').split('|')))
    if merge: alias={name}   # fundidas: los alias de la provincia que quedó de muestra no valen
    for slug in ISO2SLUG.get(a2,[]):
        for key in (name,x['name'],x['name_en']):
            alias.update(NES.get(slug,{}).get(nk(key),[]))
    out.append(dict(i=i,k=(a3+'|'+x['region']) if merge else str(x['ne_id']),n=nes,en=name,c=a3,ce=ce_en,z=cont,t=x['type_en'] or '',a='|'.join(sorted(alias))))
json.dump(out,open('attrs.json','w',encoding='utf-8'),ensure_ascii=False)
# 2) simplificar, pegar atributos, fundir y exportar TopoJSON (requiere: npm i mapshaper)
M=['npx','mapshaper']
subprocess.run(M+['-i',SHP+'.shp','encoding=utf8','-filter-fields','ne_id','-simplify','6%','keep-shapes','-o','tmp.json','format=geojson'],check=True)
g=json.load(open('tmp.json'))
for f,x in zip(g['features'],out):
    al=[s for s in x['a'].split('|') if s and s!=x['n']]
    f['properties']={'k':x['k'],'n':x['n'],'c':x['c'],'ce':x['ce'],'z':x['z'],'t':x['t'],'a':'|'.join(al)}
json.dump(g,open('tmp2.json','w'),ensure_ascii=False)
subprocess.run(M+['tmp2.json','-dissolve','k','copy-fields=n,c,ce,z,t,a','-rename-layers','regiones','-o','world-admin1.topojson','format=topojson','quantization=20000'],check=True)
