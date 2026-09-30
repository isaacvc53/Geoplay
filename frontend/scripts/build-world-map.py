#!/usr/bin/env python3
"""
Genera public/data/world-map.json a partir de scripts/worldUltra.svg
(SVG Map Generator de amCharts: paths M/L/Z ya proyectados).

Uso (desde frontend/):
    python3 scripts/build-world-map.py        # no necesita dependencias

Salida: { width, height, projection, graticule, countries: [{ id, name, slug, d, main? }] }
  - width/height: caja de la ESFERA del mapa (contorno completo de la proyección) más
    un margen. El viewBox que declara worldUltra.svg (1655x851) está mal y recorta
    el mapa, así que aquí se ignora.
  - projection: { type, rotate, scale, translate } de la proyección real del SVG, para
    que el canvas dibuje con d3 el contorno de la esfera y la cuadrícula. Se identificó
    ajustando ~20 candidatas (Natural Earth, Robinson, Winkel, Eckert, ...) contra
    centroides de world-atlas y puntos extremos exactos: es d3.geoEqualEarth() con el
    meridiano central en ~12,65°E (error medio ~0,1 px en un mapa de ~1600 px).
    Constantes en PROJ_* más abajo. Si se regenera el SVG con otra proyección o
    rotación, hay que volver a ajustarlas.
  - graticule: '' (obsoleto; la cuadrícula la genera el canvas con d3.geoGraticule10).
  - id:   código ISO 3166-1 alfa-2 del SVG (o UM-xx para islas menores de EE. UU.)
  - slug: nombre de archivo en public/data/countries/<slug>.js (ver SLUG_OVERRIDES)
  - d:    path completo del país (coordenadas desplazadas, 2 decimales)
  - main: solo si el país tiene varios polígonos; path del polígono más grande,
          para la silueta del panel.
"""
import json, math, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'worldUltra.svg')
OUT = os.path.join(HERE, '..', 'public', 'data', 'world-map.json')
MARGIN = 10  # unidades de SVG alrededor del contorno de la esfera (aire del marco)

# Proyección del SVG, en coordenadas CRUDAS del archivo (antes de desplazar).
PROJ_TYPE = 'equalEarth'   # d3.geoEqualEarth()
PROJ_CENTER_LON = 12.65    # meridiano central (°E): d3 .rotate([-12.65, 0])
PROJ_SCALE = 305.73        # escala de d3 (px por unidad de la proyección)
PROJ_TX = 827.59          # x del meridiano central
PROJ_TY = 442.51          # y del ecuador

# Casos en los que el nombre del SVG no da el slug real de los archivos de datos.
SLUG_OVERRIDES = {
    'BA': 'bosnia', 'BF': 'burkina', 'CM': 'camerun', 'CF': 'central-african',
    'CD': 'democratic-republic-of-the-congo', 'CG': 'republic-of-the-congo',
    'LA': 'laos', 'PS': 'palestine', 'CZ': 'czechia', 'SZ': 'eswatini',
    'TL': 'east-timor', 'US': 'usa',
    # worldUltra.svg usa nombres modernos; se conserva el slug del mapa anterior
    # para no romper los archivos de datos ya existentes.
    'TR': 'turkey', 'MK': 'macedonia', 'BN': 'brunei-darussalam',
    'BQ': 'bonaire-saint-eustachius-and-saba',
}

# Erratas del SVG en el nombre que se muestra.
NAME_OVERRIDES = {'BQ': 'Bonaire, Saint Eustachius and Saba'}


def slugify(name):
    n = unicodedata.normalize('NFD', name)
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', n.lower()))


NUM = r'-?\d+(?:\.\d+)?'


def polygons(d):
    """Lista de polígonos [(x, y), ...] de un path de solo M/L/Z absolutos."""
    polys = []
    for sub in re.split(r'(?=M)', d):
        pts = [(float(a), float(b)) for a, b in re.findall(rf'({NUM}),({NUM})', sub)]
        if pts:
            polys.append(pts)
    return polys


def to_d(polys, dx, dy):
    parts = []
    for pts in polys:
        seg = ['M%s,%s' % (fmt(pts[0][0] + dx), fmt(pts[0][1] + dy))]
        seg += ['L%s,%s' % (fmt(x + dx), fmt(y + dy)) for x, y in pts[1:]]
        parts.append(''.join(seg) + 'Z')
    return ''.join(parts)


def fmt(v):
    return ('%.2f' % v).rstrip('0').rstrip('.') or '0'


def bbox_area(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


svg = open(SRC, encoding='utf8').read()
items = re.findall(
    r'<path\s+d="([^"]+)"\s+class="[^"]*"\s+id="([^"]*)"\s+title="([^"]*)"', svg)
if not items:
    sys.exit('No se encontraron paths en worldUltra.svg')

parsed = [(cid, re.sub(r'\s+', ' ', title).strip(), polygons(d)) for d, cid, title in items]

allpts = [p for _, _, polys in parsed for poly in polys for p in poly]
min_x = min(p[0] for p in allpts)
max_x = max(p[0] for p in allpts)
min_y = min(p[1] for p in allpts)
max_y = max(p[1] for p in allpts)
# Semiancho / semialto del contorno de la esfera (d3.geoEqualEarth: Šavrič et al. 2018).
_A1, _A2, _A3, _A4, _M = 1.340264, -0.081106, 0.000893, 0.003796, math.sqrt(3) / 2


def ee_y(phi):
    l = math.asin(_M * math.sin(phi))
    l2 = l * l
    return l * (_A1 + _A2 * l2 + l2 ** 3 * (_A3 + _A4 * l2))


half_w = PROJ_SCALE * math.pi / (_M * _A1)   # lon ±180° en el ecuador
half_h = PROJ_SCALE * ee_y(math.pi / 2)      # polos
# Desplazamiento: esfera con su esquina (0,0) + MARGIN.
dx = MARGIN + half_w - PROJ_TX
dy = MARGIN + half_h - PROJ_TY
width = round(2 * half_w + 2 * MARGIN, 2)
height = round(2 * half_h + 2 * MARGIN, 2)
projection = {
    'type': PROJ_TYPE,
    'rotate': PROJ_CENTER_LON,
    'scale': PROJ_SCALE,
    'translate': [round(MARGIN + half_w, 2), round(MARGIN + half_h, 2)],
}

countries = []
for cid, name, polys in parsed:
    name = NAME_OVERRIDES.get(cid, name)
    entry = {'id': cid, 'name': name,
             'slug': SLUG_OVERRIDES.get(cid, slugify(name)),
             'd': to_d(polys, dx, dy)}
    if len(polys) > 1:
        entry['main'] = to_d([max(polys, key=bbox_area)], dx, dy)
    countries.append(entry)

# Los países grandes se dibujan primero y los pequeños encima: así un enclave o una
# isla dentro de la caja de otro país (Lesoto, San Marino, ...) nunca queda tapado.
def path_area(d):
    pts = [p for poly in polygons(d) for p in poly]
    return (max(p[0] for p in pts) - min(p[0] for p in pts)) * (max(p[1] for p in pts) - min(p[1] for p in pts))

countries.sort(key=lambda c: (-path_area(c['d']), c['id']))

seen = {}
for c in countries:
    seen.setdefault(c['slug'], []).append(c['id'])
dups = {s: ids for s, ids in seen.items() if len(ids) > 1}
if dups:
    print('AVISO: slugs repetidos:', dups, file=sys.stderr)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf8') as f:
    json.dump({'width': width, 'height': height, 'projection': projection, 'graticule': '',
               'countries': countries}, f,
              ensure_ascii=False, separators=(',', ':'))
print(f'{len(countries)} países, mapa {width}x{height} -> {os.path.relpath(OUT)} '
      f'({os.path.getsize(OUT)/1024:.0f} KB)', file=sys.stderr)
