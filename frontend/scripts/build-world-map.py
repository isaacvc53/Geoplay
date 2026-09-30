#!/usr/bin/env python3
"""
Genera public/data/world-map.json a partir de scripts/world.svg (MapSVG).

Uso (desde frontend/):
    pip install svgpathtools
    python3 scripts/build-world-map.py

Salida: { width, height, countries: [{ id, name, slug, d, main? }] }
  - id:   código ISO 3166-1 alfa-2 del SVG (o UM-xx para islas menores de EE. UU.)
  - slug: nombre de archivo en public/data/countries/<slug>.js (ver SLUG_OVERRIDES)
  - d:    path completo del país
  - main: solo si el país tiene varios polígonos; path (absoluto) del polígono
          más grande, para la silueta del panel.
"""
import json, os, re, unicodedata, sys
from svgpathtools import parse_path

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'world.svg')
OUT = os.path.join(HERE, '..', 'public', 'data', 'world-map.json')

# Casos en los que el nombre del SVG no da el slug real de los archivos de datos.
SLUG_OVERRIDES = {
    'BA': 'bosnia', 'BF': 'burkina', 'CM': 'camerun', 'CF': 'central-african',
    'CD': 'democratic-republic-of-the-congo', 'CG': 'republic-of-the-congo',
    'LA': 'laos', 'PS': 'palestine', 'CZ': 'czechia', 'SZ': 'eswatini',
    'TL': 'east-timor', 'US': 'usa',
}

def slugify(name):
    n = unicodedata.normalize('NFD', name)
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', n.lower()))

def round_d(d, nd=2):
    return re.sub(r'-?\d+\.\d+(?:e-?\d+)?', lambda m: ('%.*f' % (nd, float(m.group())))
                  .rstrip('0').rstrip('.') or '0', d)

def main_subpath(d):
    subs = parse_path(d).continuous_subpaths()
    if len(subs) < 2:
        return None
    def area(p):
        x0, x1, y0, y1 = p.bbox()
        return (x1 - x0) * (y1 - y0)
    return round_d(max(subs, key=area).d())

svg = open(SRC, encoding='utf8').read()
w = float(re.search(r'\bwidth="([\d.]+)"', svg).group(1))
h = float(re.search(r'\bheight="([\d.]+)"', svg).group(1))
items = re.findall(r'<path\s+d="([^"]+)"\s+title="([^"]*)"\s+id="([^"]*)"', svg)

countries = []
for d, title, cid in items:
    name = re.sub(r'\s+', ' ', title).strip()
    entry = {'id': cid, 'name': name,
             'slug': SLUG_OVERRIDES.get(cid, slugify(name)), 'd': d}
    m = main_subpath(d)
    if m:
        entry['main'] = m
    countries.append(entry)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf8') as f:
    json.dump({'width': w, 'height': h, 'countries': countries}, f,
              ensure_ascii=False, separators=(',', ':'))
print(f'{len(countries)} países -> {os.path.relpath(OUT)} '
      f'({os.path.getsize(OUT)/1024:.0f} KB)', file=sys.stderr)
