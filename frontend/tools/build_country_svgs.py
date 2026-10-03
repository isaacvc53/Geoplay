#!/usr/bin/env python3
"""
Genera mapas de regiones (SVG) a partir de Natural Earth (dominio público) para el juego de países.

Fuente:  frontend/public/data/world-admin1.topojson   (ya sale de Natural Earth admin-1, ver tools/build_world_admin1.py)
Salida:  frontend/public/data/geo/<slug>.svg
Los `id` de cada <path> son EXACTAMENTE los `id` de las regiones de frontend/public/data/countries/<slug>.js,
así que el juego los enlaza sin tocar nada.

Uso (desde la carpeta frontend/):
    python tools/build_country_svgs.py                       # los países que el topojson resuelve bien
    python tools/build_country_svgs.py russia canada         # solo algunos
    python tools/build_country_svgs.py --shp RUTA/ne_10m_admin_1_states_provinces [slugs...]
        # lee el shapefile ORIGINAL de Natural Earth (sin la simplificación del topojson): más detalle, y es
        # imprescindible para san-marino y maldives. Necesita `pip install pyshp` (el mismo que build_world_admin1.py).
Sin --shp no hay dependencias externas (solo la librería estándar de Python 3).
"""
import json, math, os, re, sys, collections
from xml.sax.saxutils import quoteattr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))           # frontend/
DATA = os.path.join(ROOT, 'public', 'data')
TOPO = os.path.join(DATA, 'world-admin1.topojson')
SIZE = 1000.0                                              # lado mayor del viewBox (el trazo es non-scaling, no importa)

# ───────────────────────── lectura de Natural Earth ─────────────────────────
# Cada fuente devuelve lo mismo: lista de dict(n=nombre_en, t=tipo, c=ISO3, polys=[[anillo_ext, *huecos], ...]) en lon/lat.
def ring_area(pts):
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1])) / 2

def point_in(pt, ring):
    x, y = pt; c = False
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c

def group_rings(rings):
    """Anillos sueltos -> polígonos [ext, *huecos]. En NE/ESRI los exteriores van en sentido horario (área < 0)."""
    outers = [[r] for r in rings if ring_area(r) < 0]
    for h in (r for r in rings if ring_area(r) >= 0):
        for o in outers:
            if point_in(h[0], o[0]): o.append(h); break
    return outers

def load_topojson(path, iso):
    t = json.load(open(path, encoding='utf-8'))
    sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']; arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    def arc(i): return arcs[i] if i >= 0 else arcs[~i][::-1]
    def ring(r):
        pts = []
        for i in r:
            p = arc(i); pts.extend(p if not pts else p[1:])
        return pts
    out = []
    for g in t['objects']['regiones']['geometries']:
        p = g['properties']
        if p['c'] != iso: continue
        polys = [g['arcs']] if g['type'] == 'Polygon' else (g['arcs'] if g['type'] == 'MultiPolygon' else [])
        out.append(dict(n=p['n'], t=p['t'], c=p['c'], polys=[[ring(r) for r in poly] for poly in polys]))
    return out

def load_shapefile(base, iso):
    """Shapefile original de Natural Earth admin-1 (campos: adm0_a3, name, name_en, type_en). Requiere pyshp."""
    try: import shapefile
    except ImportError: raise SystemExit('Falta pyshp:  pip install pyshp')
    r = shapefile.Reader(base, encoding='utf-8')
    names = [f[0] for f in r.fields[1:]]; out = []
    for i, rec in enumerate(r.records()):
        d = dict(zip(names, rec))
        if d.get('adm0_a3') != iso: continue
        shp = r.shape(i); parts = list(shp.parts) + [len(shp.points)]
        rings = []
        for a, b in zip(parts, parts[1:]):
            pts = [tuple(p[:2]) for p in shp.points[a:b]]
            if len(pts) > 1 and pts[0] == pts[-1]: pts.pop()
            if len(pts) >= 3: rings.append(pts)
        out.append(dict(n=d.get('name_en') or d.get('name'), t=d.get('type_en') or '', c=iso, polys=group_rings(rings)))
    return out

def union(feats):
    """Une varias unidades en una sola forma: las aristas compartidas (A->B en una y B->A en la vecina) se cancelan."""
    if len(feats) == 1: return feats[0]['polys']
    edges = collections.Counter()
    for f in feats:
        for poly in f['polys']:
            for ring in poly:
                for a, b in zip(ring, ring[1:] + ring[:1]): edges[(a, b)] += 1
    left = [e for e, c in edges.items() if c > edges.get((e[1], e[0]), 0)]
    out_from = collections.defaultdict(list)
    for a, b in left: out_from[a].append(b)
    rings = []
    for a, b in left:
        if b not in out_from.get(a, ()): continue          # ya consumida
        out_from[a].remove(b); ring = [a]; cur = b
        while cur != a:
            ring.append(cur)
            if not out_from.get(cur): break
            cur = out_from[cur].pop()
        rings.append(ring)
    return group_rings(rings)

def hull_buffer(polys, r_deg):
    """Casco convexo con margen r_deg alrededor de TODAS las islas de una región (atolones: la tierra es un puntito)."""
    pts = {p for poly in polys for ring in poly for p in ring}
    def hull(P):
        P = sorted(set(P))
        if len(P) < 3: return P
        def cr(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
        lo, up = [], []
        for p in P:
            while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
            lo.append(p)
        for p in reversed(P):
            while len(up) >= 2 and cr(up[-2], up[-1], p) <= 0: up.pop()
            up.append(p)
        return lo[:-1] + up[:-1]                            # antihorario (y arriba)
    h = hull(pts); cl = math.cos(math.radians(sum(y for _, y in h) / len(h)))
    circ = [(r_deg / cl * math.cos(a * math.pi / 8), r_deg * math.sin(a * math.pi / 8)) for a in range(16)]
    big = hull([(x + dx, y + dy) for x, y in h for dx, dy in circ])
    return [[big[::-1]]]                                    # exterior en sentido horario, como el resto

def simplify(pts, tol):
    """Douglas-Peucker para un anillo cerrado (en píxeles del viewBox)."""
    if len(pts) < 8 or tol <= 0: return pts
    def dist(p, a, b):
        dx, dy = b[0]-a[0], b[1]-a[1]; d = dx*dx + dy*dy
        if d == 0: return math.hypot(p[0]-a[0], p[1]-a[1])
        return abs(dx*(a[1]-p[1]) - dy*(a[0]-p[0])) / math.sqrt(d)
    def dp(P):
        keep = [False]*len(P); keep[0] = keep[-1] = True; stack = [(0, len(P)-1)]
        while stack:
            i, j = stack.pop(); m, k = 0, -1
            for q in range(i+1, j):
                d = dist(P[q], P[i], P[j])
                if d > m: m, k = d, q
            if k >= 0 and m > tol: keep[k] = True; stack += [(i, k), (k, j)]
        return [p for p, kp in zip(P, keep) if kp]
    far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0]-pts[0][0], pts[i][1]-pts[0][1]))
    a = dp(pts[:far+1]); b = dp(pts[far:] + [pts[0]])
    out = a[:-1] + b[:-1]
    return out if len(out) >= 3 else pts

def _cut_run(ring, sign):
    """Único tramo consecutivo (cíclico) de vértices sobre el meridiano ±180 -> (i_ini, i_fin) o None."""
    n = len(ring); flag = [sign * x >= 179.99999 for x, _ in ring]
    starts = [i for i in range(n) if flag[i] and not flag[i - 1]]
    if len(starts) != 1 or sum(flag) < 2: return None
    i = starts[0]; j = i
    while flag[(j + 1) % n]: j = (j + 1) % n
    return i, j

def weld_antimeridian(polys):
    """Natural Earth parte en dos lo que cruza los 180° (Chukotka, isla Wrangel): se sueldan para no dejar una línea de borde falsa."""
    polys = [list(p) for p in polys]
    changed = True
    while changed:
        changed = False
        for a in range(len(polys)):
            ra = _cut_run(polys[a][0], +1)
            if not ra: continue
            for b in range(len(polys)):
                rb = _cut_run(polys[b][0], -1) if b != a else None
                if not rb: continue
                A, B = polys[a][0], polys[b][0]
                (i_s, i_e), (j_s, j_e) = ra, rb
                if abs(A[i_s][1] - B[j_e][1]) > 1e-3 or abs(A[i_e][1] - B[j_s][1]) > 1e-3: continue
                def outside(R, s_, e_):   # vértices fuera del tramo, empezando justo después de su final
                    n = len(R); out = []; k = (e_ + 1) % n
                    while k != s_: out.append(R[k]); k = (k + 1) % n
                    return out
                ring = outside(A, i_s, i_e) + [A[i_s]] + outside(B, j_s, j_e) + [A[i_e]]
                new = [ring] + polys[a][1:] + polys[b][1:]
                polys = [p for k, p in enumerate(polys) if k not in (a, b)] + [new]
                changed = True; break
            if changed: break
    return polys

# ───────────────────────── proyecciones ─────────────────────────
def albers(lon0, lat0, lat1, lat2):
    r = math.radians; n = (math.sin(r(lat1)) + math.sin(r(lat2))) / 2
    C = math.cos(r(lat1)) ** 2 + 2 * n * math.sin(r(lat1))
    rho0 = math.sqrt(C - 2 * n * math.sin(r(lat0))) / n
    def f(lon, lat):
        d = (lon - lon0 + 180) % 360 - 180                 # así Chukotka (cruza los 180°) queda pegada
        rho = math.sqrt(C - 2 * n * math.sin(r(lat))) / n; th = n * r(d)
        return rho * math.sin(th), -(rho0 - rho * math.cos(th))   # y hacia abajo (SVG)
    return f

def equirect(lat0):
    k = math.cos(math.radians(lat0))
    return lambda lon, lat: (lon * k, -lat)

# ───────────────────────── configuración por país ─────────────────────────
# regiones: id -> lista de selectores (nombre NE, tipo NE o None). Se fusionan si hay varios.
def by_name(d): return {i: [(n, None)] for i, n in d.items()}

RUSIA = {  # id (ISO 3166-2) -> (nombre NE, tipo NE). Crimea y Sebastopol no se incluyen (el .js declara 83 regiones).
'RU-AD':('Republic of Adygea','Republic'),'RU-ALT':('Altai Republic','Territory'),'RU-AL':('Altai Republic','Republic'),'RU-AMU':('Amur','Region'),
'RU-ARK':('Arkhangelsk','Region'),'RU-AST':('Astrakhan','Region'),'RU-BA':('Bashkortostan','Republic'),'RU-BEL':('Belgorod','Region'),
'RU-BRY':('Bryansk','Region'),'RU-BU':('Republic of Buryatia','Republic'),'RU-CE':('Chechen Republic','Republic'),'RU-CHE':('Chelyabinsk','Region'),
'RU-CHU':('Chukotka Autonomous Okrug','Autonomous Province'),'RU-CU':('Chuvash Republic','Republic'),'RU-DA':('Republic of Dagestan','Republic'),
'RU-IN':('Republic of Ingushetia','Republic'),'RU-IRK':('Irkutsk','Region'),'RU-IVA':('Ivanovo','Region'),'RU-YEV':('Jewish','Autonomous Region'),
'RU-KB':('Kabardino-Balkaria','Republic'),'RU-KGD':('Kaliningrad','Region'),'RU-KL':('Republic of Kalmykia','Republic'),'RU-KLU':('Kaluga','Region'),
'RU-KAM':('Kamchatka Krai','Region'),'RU-KC':('Karachay-Cherkess Republic','Republic'),'RU-KR':('Karelia','Republic'),'RU-KEM':('Kemerovo','Region'),
'RU-KHA':('Khabarovsk Krai','Territory'),'RU-KK':('Republic of Khakassia','Republic'),'RU-KHM':('Khanty-Mansi Autonomous Okrug','Autonomous Province'),
'RU-KIR':('Kirov','Region'),'RU-KO':('Komi Republic','Republic'),'RU-KOS':('Kostroma','Region'),'RU-KDA':('Krasnodar Krai','Territory'),
'RU-KYA':('Krasnoyarsk Krai','Territory'),'RU-KGN':('Kurgan','Region'),'RU-KRS':('Kursk','Region'),'RU-LEN':('Leningrad','Region'),
'RU-LIP':('Lipetsk','Region'),'RU-MAG':('Magadan','Region'),'RU-ME':('Mari El Republic','Republic'),'RU-MO':('Republic of Mordovia','Republic'),
'RU-MOW':('Moscow','Federal City'),'RU-MOS':('Moscow','Region'),'RU-MUR':('Murmansk','Region'),'RU-NEN':('Nenets Autonomous Okrug','Autonomous Province'),
'RU-NIZ':('Nizhny Novgorod','Region'),'RU-SE':('Republic of North Ossetia-Alania','Republic'),'RU-NGR':('Novgorod','Region'),'RU-NVS':('Novosibirsk','Region'),
'RU-OMS':('Omsk','Region'),'RU-ORE':('Orenburg','Region'),'RU-ORL':('Oryol','Region'),'RU-PNZ':('Penza','Region'),'RU-PER':('Perm Krai','Territory'),
'RU-PRI':('Primorsky Krai','Territory'),'RU-PSK':('Pskov','Region'),'RU-ROS':('Rostov','Region'),'RU-RYA':('Ryazan','Region'),
'RU-SPE':('Saint Petersburg','Federal City'),'RU-SA':('Sakha Republic','Autonomous Province'),'RU-SAK':('Sakhalin','Region'),'RU-SAM':('Samara','Region'),
'RU-SAR':('Saratov','Region'),'RU-SMO':('Smolensk','Region'),'RU-STA':('Stavropol Krai','Territory'),'RU-SVE':('Sverdlovsk','Region'),
'RU-TAM':('Tambov','Region'),'RU-TA':('Republic of Tatarstan','Republic'),'RU-TOM':('Tomsk','Region'),'RU-TUL':('Tula','Region'),'RU-TY':('Tuva Republic','Republic'),
'RU-TVE':('Tver','Region'),'RU-TYU':('Tyumen','Region'),'RU-UD':('Udmurt Republic','Republic'),'RU-ULY':('Ulyanovsk','Region'),'RU-VLA':('Vladimir','Region'),
'RU-VGG':('Volgograd','Region'),'RU-VLG':('Vologda','Region'),'RU-VOR':('Voronezh','Region'),'RU-YAN':('Yamalo-Nenets Autonomous Okrug','Autonomous Province'),
'RU-YAR':('Yaroslavl','Region'),'RU-ZAB':('Zabaykalsky Krai','Region')}

# Reino Unido: las 12 regiones NUTS 1 (ids del .js) = unión de las unidades administrativas de Natural Earth
UK = {
'UKC':'Northumberland|North Tyneside|South Tyneside|Sunderland|Durham|Hartlepool|Redcar and Cleveland|Stockton-on-Tees|Darlington|Middlesbrough|Gateshead|Newcastle upon Tyne',
'UKD':'Cheshire West and Chester|Cumbria|Halton|Knowsley|Liverpool|Sefton|Merseyside|Lancashire|Blackpool|Cheshire East|Wigan|Stockport|Warrington|Blackburn with Darwen|Salford|Bolton|Trafford|Manchester|Oldham|Rochdale|Tameside|Bury',
'UKE':'North Yorkshire|East Riding of Yorkshire|Kingston upon Hull|North Lincolnshire|North East Lincolnshire|York|Doncaster|Rotherham|Sheffield|Calderdale|Kirklees|Leeds|Bradford|Wakefield|Barnsley',
'UKF':'Lincolnshire|Rutland|Nottinghamshire|Northamptonshire|Leicestershire|Derbyshire|Nottingham|Leicester|Derby',
'UKG':'Shropshire|Herefordshire|Stoke-on-Trent|Telford and Wrekin|Staffordshire|Worcestershire|Warwickshire|Solihull|Coventry|Birmingham|Sandwell|Dudley|Walsall|Wolverhampton',
'UKH':'Norfolk|Suffolk|Essex|Southend-on-Sea|Thurrock|Hertfordshire|Cambridgeshire|Luton|Central Bedfordshire|Bedford|Peterborough',
'UKI':'Wandsworth|Merton|Westminster|Kensington and Chelsea|Hounslow|Ealing|Hammersmith and Fulham|Richmond upon Thames|London|Tower Hamlets|Enfield|Barnet|Waltham Forest|Redbridge|Havering|Bexley|Sutton|Hillingdon|Brent|Harrow|Camden|Islington|Lambeth|Southwark|Croydon|Lewisham|Haringey|Kingston upon Thames|Newham|Greenwich|Hackney|Barking and Dagenham|Bromley',
'UKJ':'Kent|Medway|East Sussex|Brighton and Hove|West Sussex|Hampshire|Portsmouth|Southampton|Isle of Wight|Milton Keynes|Buckinghamshire|Oxfordshire|West Berkshire|Wokingham|Bracknell Forest|Windsor and Maidenhead|Slough|Reading|Surrey',
'UKK':'Gloucestershire|Dorset|Bournemouth|Poole|Devon|Torbay|Plymouth|Cornwall|Somerset|North Somerset|Bristol|South Gloucestershire|Isles of Scilly|Swindon|Bath and North East Somerset|Wiltshire',
'UKL':'Flintshire|Wrexham|Powys|Monmouthshire|Newport|Cardiff|Vale of Glamorgan|Bridgend|Neath Port Talbot|Swansea|Carmarthenshire|Pembrokeshire|Ceredigion|Gwynedd|Conwy|Denbighshire|Anglesey|Caerphilly|Rhondda Cynon Taf|Blaenau Gwent|Torfaen|Merthyr Tydfil',
'UKM':'Scottish Borders|Dumfries and Galloway|Clackmannanshire|Stirling|Falkirk|West Lothian|Edinburgh|Midlothian|East Lothian|South Ayrshire|North Ayrshire|Inverclyde|Renfrewshire|West Dunbartonshire|Argyll and Bute|Highland|Moray|Aberdeenshire|Aberdeen|Angus|Dundee|Perth and Kinross|Fife|Outer Hebrides|Orkney Islands|Shetland Islands|North Lanarkshire|East Dunbartonshire|Glasgow|East Renfrewshire|East Ayrshire|South Lanarkshire',
'UKN':'Derry|Strabane|Fermanagh|Dungannon and South Tyrone|Armagh|Newry and Mourne|Limavady|Coleraine|Moyle|Larne|Carrickfergus|Newtownabbey|Belfast|North Down|Ards|Down|Magherafelt|Omagh|Mid Ulster|Craigavon|Banbridge|Antrim|Lisburn|Ballymoney|Ballymena|Castlereagh'}

COUNTRIES = {
 'russia': dict(iso='RUS', proj=albers(100, 50, 52, 64), regions={i: [v] for i, v in RUSIA.items()}),
 'canada': dict(iso='CAN', proj=albers(-96, 50, 50, 70), regions=by_name({
    'CA-AB':'Alberta','CA-BC':'British Columbia','CA-MB':'Manitoba','CA-NB':'New Brunswick','CA-NL':'Newfoundland and Labrador','CA-NS':'Nova Scotia',
    'CA-NT':'Northwest Territories','CA-NU':'Nunavut','CA-ON':'Ontario','CA-PE':'Prince Edward Island','CA-QC':'Quebec','CA-SK':'Saskatchewan','CA-YT':'Yukon'})),
 # Australia: Jervis Bay se funde con ACT. Macquarie y Lord Howe se dejan fuera (a cientos de km: encogerían el mapa).
 'australia': dict(iso='AUS', proj=albers(134, -25, -18, -36), regions={
    'AU-ACT':[('Australian Capital Territory',None),('Jervis Bay Territory',None)],'AU-NSW':[('New South Wales',None)],'AU-NT':[('Northern Territory',None)],
    'AU-QLD':[('Queensland',None)],'AU-SA':[('South Australia',None)],'AU-TAS':[('Tasmania',None)],'AU-VIC':[('Victoria',None)],'AU-WA':[('Western Australia',None)]}),
 'maldives': dict(iso='MDV', proj=equirect(4), needs_shp=True, hull=0.035, regions=by_name({
    'MV-01':'Addu Atoll','MV-29':'Gnaviyani Atoll','MV-28':'Gaafu Dhaalu Atoll','MV-27':'Gaafu Alif Atoll','MV-00':'Alif Dhaal Atoll','MV-26':'Kaafu Atoll',
    'MV-02':'Alif Alif Atoll','MV-20':'Baa Atoll','MV-03':'Lhaviyani Atoll','MV-13':'Raa Atoll','MV-24':'Shaviyani Atoll','MV-05':'Laamu Atoll','MV-08':'Thaa Atoll',
    'MV-17':'Dhaalu Atoll','MV-12':'Meemu Atoll','MV-14':'Faafu Atoll','MV-04':'Vaavu Atoll','MV-MLE':'Malé','MV-25':'Noonu Atoll','MV-23':'Haa Dhaalu Atoll',
    'MV-07':'Haa Alif Atoll'})),
 'san-marino': dict(iso='SMR', proj=equirect(43.94), needs_shp=True, regions=by_name({
    'SM01':'Acquaviva','SM02':'Borgo Maggiore','SM03':'Chiesanuova','SM04':'Domagnano','SM05':'Faetano','SM06':'Fiorentino','SM07':'Montegiardino',
    'SM08':'San Marino','SM09':'Serravalle'})),
 'united-kingdom': dict(iso='GBR', proj=albers(-3, 54, 50, 60), regions={i: [(n, None) for n in v.split('|')] for i, v in UK.items()}),
}

# ───────────────────────── construcción ─────────────────────────
def js_regions(slug):
    p = os.path.join(DATA, 'countries', slug + '.js')
    if not os.path.exists(p): return None
    t = open(p, encoding='utf-8').read(); body = t[t.find('regions:'):]
    return [(m.group(1), m.group(2)) for m in re.finditer(r'\{\s*id:\s*"([^"]+)",\s*display:\s*"([^"]*)"', body)]

def build(slug, cfg, shp):
    feats = load_shapefile(shp, cfg['iso']) if shp else load_topojson(TOPO, cfg['iso'])
    used, regions = set(), {}
    for rid, sels in cfg['regions'].items():
        gs = []
        for n, t in sels:
            hit = [f for f in feats if f['n'] == n and (t is None or f['t'] == t)]
            if not hit: raise SystemExit(f'[{slug}] {rid}: no hay en Natural Earth ninguna unidad "{n}" ({t})')
            gs += hit
        used |= {id(g) for g in gs}
        polys = weld_antimeridian(union(gs))
        regions[rid] = hull_buffer(polys, cfg['hull']) if cfg.get('hull') else polys
    left = [f['n'] for f in feats if id(f) not in used]
    # proyección y encuadre
    proj = cfg['proj']
    pr = {rid: [[[proj(*p) for p in ring] for ring in poly] for poly in polys] for rid, polys in regions.items()}
    xs = [x for polys in pr.values() for poly in polys for ring in poly for x, _ in ring]
    ys = [y for polys in pr.values() for poly in polys for ring in poly for _, y in ring]
    x0, y0, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
    k = SIZE / max(w, h); W, H = round(w * k, 1), round(h * k, 1)
    titles = dict(js_regions(slug) or [])
    out = []
    for rid, polys in pr.items():
        d = []
        for poly in polys:
            for ring in poly:
                pts, last = [], None
                for x, y in ring:
                    q = ((x - x0) * k, (y - y0) * k)
                    if last is None or math.hypot(q[0] - last[0], q[1] - last[1]) >= 0.05: pts.append(q); last = q
                pts = simplify(pts, cfg.get('tol', 0.25 if shp else 0))
                pts = [(round(x, 1), round(y, 1)) for x, y in pts]
                if len(pts) < 3 or abs(ring_area(pts)) < 0.02: continue
                d.append('M' + 'L'.join(f'{x:g} {y:g}' for x, y in pts) + 'Z')
        if not d: raise SystemExit(f'[{slug}] {rid}: la región se queda sin geometría (¿falta --shp?)')
        out.append(f'  <path id={quoteattr(rid)} title={quoteattr(titles.get(rid, rid))} d="{"".join(d)}"/>')
    svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n<!-- Map data: Natural Earth (naturalearthdata.com), public domain. -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}" width="{W:g}" height="{H:g}" fill="#6f9c76" stroke="#ffffff" '
           f'stroke-linecap="round" stroke-linejoin="round" stroke-width=".5">\n <g id="features">\n' + '\n'.join(out) + '\n </g>\n</svg>\n')
    return svg, left, len(out)

def main(argv):
    shp = None
    if '--shp' in argv:
        i = argv.index('--shp'); shp = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    ok = True
    for slug in (argv or list(COUNTRIES)):
        if slug not in COUNTRIES: raise SystemExit(f'país desconocido: {slug} (disponibles: {", ".join(COUNTRIES)})')
        if COUNTRIES[slug].get('needs_shp') and not shp:
            print(f'{slug:15s} SALTADO: el topojson es demasiado tosco para este país; usa --shp RUTA/ne_10m_admin_1_states_provinces'); continue
        svg, left, n = build(slug, COUNTRIES[slug], shp)
        path = os.path.join(DATA, 'geo', slug + '.svg')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w', encoding='utf-8', newline='\n').write(svg)
        # comprobación: cada id del .js debe tener su <path>, sin repetidos ni sobrantes
        want = [i for i, _ in (js_regions(slug) or [])]
        have = set(COUNTRIES[slug]['regions'])
        miss, extra = [i for i in want if i not in have], [i for i in have if want and i not in want]
        dup = [i for i, c in collections.Counter(want).items() if c > 1]
        print(f'{slug:15s} {n:3d} regiones, {len(svg)/1024:6.1f} KB' + (f'  | sin usar de NE: {left}' if left else ''))
        if miss: ok = False; print('   ✗ ids del .js sin <path>:', miss)
        if extra: ok = False; print('   ✗ <path> que el .js no conoce:', extra)
        if dup: ok = False; print('   ✗ ids repetidos en el .js:', dup)
    sys.exit(0 if ok else 1)

if __name__ == '__main__':
    main(sys.argv[1:])
