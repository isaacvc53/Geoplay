#!/usr/bin/env python3
"""
Genera, para los países de un "lote", los tres ficheros que necesita Geotaria:
    frontend/public/data/geo/<slug>.svg          (mapa de regiones, Natural Earth)
    frontend/public/data/countries/<slug>.js     (datos del juego, region_id: null)
    backend/seed_<lote>.py                       (seed de regiones para la BD)

Uso (desde frontend/):
    python tools/make_country.py lote1 --shp "RUTA/ne_10m_admin_1_states_provinces" [--out RUTA_SALIDA]

--shp es el shapefile de Natural Earth SIN la extensión (descomprime antes el .zip).
Solo usa la librería estándar (lector propio en neshp.py) + build_country_svgs.py de esta misma carpeta.
Cada región se selecciona por su código iso_3166_2 de Natural Earth.
"""
import os, sys, math, importlib, collections
from xml.sax.saxutils import quoteattr

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_country_svgs as B
from neshp import read_dbf, read_shp

SIZE = 1000.0

def load_feats(shp_base, iso):
    recs, shapes = read_dbf(shp_base + '.dbf'), read_shp(shp_base + '.shp')
    out = []
    for r, rings_raw in zip(recs, shapes):
        if r['adm0_a3'] != iso: continue
        rings = []
        for pts in rings_raw:
            pts = list(pts)
            if len(pts) > 1 and pts[0] == pts[-1]: pts.pop()
            if len(pts) >= 3: rings.append(pts)
        out.append(dict(code=r['iso_3166_2'], n=r['name'], gn=r.get('gn_name', ''), polys=B.group_rings(rings)))
    return out

def build_svg(cfg, shp_base):
    feats = load_feats(shp_base, cfg['iso'])
    # Natural Earth a veces trae name/iso_3166_2 DESORDENADOS respecto a la geometría (pasa en Guyana); gn_name sí suele coincidir.
    # cfg['match'] = 'gn_name' -> la región se selecciona por su 4.º elemento (gn_name de NE) en vez de por el código ISO.
    use_gn = cfg.get('match') == 'gn_name'
    by_key = collections.defaultdict(list)
    for f in feats: by_key[f['gn'] if use_gn else f['code']].append(f)
    regions, used = {}, set()
    for tup in cfg['regions']:
        code, display = tup[0], tup[1]; sel = tup[3] if (use_gn and len(tup) > 3) else code
        if sel not in by_key: raise SystemExit(f"[{cfg['slug']}] {code} ({display}): no existe '{sel}' en Natural Earth")
        used.add(sel); regions[code] = B.weld_antimeridian(B.union(by_key[sel]))
        if not use_gn:   # aviso: ¿el gn_name de esa geometría se parece al nombre que le damos?
            norm = lambda s: ''.join(c for c in __import__('unicodedata').normalize('NFD', s.lower()) if c.isalnum())
            gn = norm(by_key[sel][0]['gn']); names = [norm(display)] + [norm(a) for a in tup[2]]
            if gn and not any(n and (n in gn or gn in n) for n in names):
                print(f"   ⚠ [{cfg['slug']}] {code} «{display}» pero su geometría en NE es «{by_key[sel][0]['gn']}»: posible desajuste (usa match='gn_name')")
    unused = sorted({k for k in by_key} - used)
    proj = B.equirect(cfg['lat0'])
    pr = {c: [[[proj(*p) for p in ring] for ring in poly] for poly in polys] for c, polys in regions.items()}
    xs = [x for polys in pr.values() for poly in polys for ring in poly for x, _ in ring]
    ys = [y for polys in pr.values() for poly in polys for ring in poly for _, y in ring]
    x0, y0, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
    k = SIZE / max(w, h); W, H = round(w * k, 1), round(h * k, 1)
    titles = {tup[0]: tup[1] for tup in cfg['regions']}
    paths = []
    for c, polys in pr.items():
        d = []
        for poly in polys:
            for ring in poly:
                pts, last = [], None
                for x, y in ring:
                    q = ((x - x0) * k, (y - y0) * k)
                    if last is None or math.hypot(q[0] - last[0], q[1] - last[1]) >= 0.05: pts.append(q); last = q
                pts = B.simplify(pts, cfg.get('tol', 0.15))
                pts = [(round(x, 1), round(y, 1)) for x, y in pts]
                if len(pts) < 3 or abs(B.ring_area(pts)) < 0.02: continue
                d.append('M' + 'L'.join(f'{x:g} {y:g}' for x, y in pts) + 'Z')
        if not d: raise SystemExit(f"[{cfg['slug']}] {c}: sin geometría")
        paths.append(f'  <path id={quoteattr(c)} title={quoteattr(titles[c])} d="{"".join(d)}"/>')
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n<!-- Map data: Natural Earth (naturalearthdata.com), public domain. -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}" width="{W:g}" height="{H:g}" fill="#6f9c76" stroke="#ffffff" '
           'stroke-linecap="round" stroke-linejoin="round" stroke-width=".5">\n <g id="features">\n' + '\n'.join(paths) + '\n </g>\n</svg>\n')
    return svg, unused

def variants(display, extra, suffixes):
    names = [display]
    def add(n):
        if n and n not in names: names.append(n)
    for e in extra: add(e)
    base = list(names)
    for n in base:
        if n.startswith('Saint '): add('St ' + n[6:]); add('St. ' + n[6:])
    for n in list(names):
        for s in suffixes: add(f'{n} {s}')
    return names

def js_text(cfg):
    n = len(cfg['regions']); en, adj = cfg['en'], cfg['adj']; sing, plur = cfg['sing'], cfg['plur']
    q = lambda s: '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
    L = ['window.GEOTARIA_COUNTRY = {', f'  slug: {q(cfg["slug"])},', '  lang: "en",', f'  kicker: {q("GeoPlay · " + en)},',
         f'  title: {q(f"How many {adj} {plur} can you name?")},', f'  subtitle: {q(f"Type a {adj} {sing} and the map will fill in.")},',
         f'  total: {n},', '  quizSeconds: 15 * 60,', '', f'  geoFile: {q("../data/geo/" + cfg["slug"] + ".svg")},', '',
         f'  guessPlaceholder: {q(f"Type a {sing}…")},', '  submitLabel: "Check",', '  pauseLabel: "Pause",', '  resumeLabel: "Resume",', '',
         f'  missingLabel: {q(cfg.get("missing", f"My {plur}"))},', '  giveUpLabel: "Give up",', '  resetLabel: "Reset",', '',
         '  hintText: "Drag the map · scroll to zoom",', f'  hintTextRevealed: {q(f"Hover over a {sing} to see its name")},', '',
         '  correctPrefix: "Correct! ",', '  notFoundMessage: "Not found or ambiguous name.",',
         '  alreadyFoundMessage: "That one has already been guessed.",', '  noneFoundMessage: "You haven\'t guessed any yet.",', '',
         '  pausedMessage: "The quiz is paused.",', f'  completeMessage: {q(f"Congratulations! You named all {n} {adj} {plur}.")},',
         '  timeUpMessage: "Time\'s up.",', f'  giveUpMessage: {q(f"Quiz ended. Here are the {plur} you didn\'t find.")},',
         '  readyMessage: "Map ready — start typing!",', '  readyLocalMessage: "Map ready in local mode.",',
         f'  loadErrorMessage: {q(f"Could not load the {en} map.")},', '', '  regions: [']
    items = []
    for tup in cfg['regions']:
        code, display, extra = tup[:3]
        names = variants(display, extra, cfg.get('suffixes', []))
        items.append('    {\n      id: %s,\n      display: %s,\n      names: [\n%s\n      ],\n      region_id: null\n    }' %
                     (q(code), q(display), ',\n'.join('        ' + q(x) for x in names)))
    return '\n'.join(L) + '\n' + ',\n'.join(items) + '\n  ]\n};\n'

def seed_text(lote, cfgs):
    out = ['"""', f'Seed de provincias/regiones — {lote} (generado con tools/make_country.py).', '',
           'Reutiliza seed_pais() de seed_provincias.py: mismo formato, mismo idioma ("en"), idempotente', '(si el país YA tiene regiones, se omite).',
           'Requiere que el país exista en MUNDO (seed_paises_mundo.py); si no está en la BD, se crea.', '',
           'USO (desde backend/):', f'    python seed_{lote}.py                       # todos los del lote',
           f'    python seed_{lote}.py --paises Panamá Guyana', f'    python seed_{lote}.py --dry-run', '',
           'Después, para enlazar cada .js con la BD (rellena los region_id: null):',
           '    python fill_region_ids.py ../frontend/public/data/countries/<slug>.js "<País>"', '"""', '',
           'import argparse', '', 'from database.connection import SessionLocal', 'from seed_provincias import seed_pais', '',
           f'PROVINCIAS_{lote.upper()} = {{']
    for c in cfgs:
        out.append(f'    "{c["es"]}": {{')
        out.append(f'        "archivo": "{c["slug"]}",')
        out.append('        "regiones": [')
        for tup in c['regions']:
            code, display, extra = tup[:3]
            names = variants(display, extra, c.get('suffixes', []))
            out.append('            [' + ', '.join('"' + x.replace('"', '\\"') + '"' for x in names) + '],')
        out.append('        ],'); out.append('    },')
    out += ['}', '', '',
            'def main():', '    parser = argparse.ArgumentParser(description="Seed de regiones (' + lote + ')")',
            '    parser.add_argument("--paises", nargs="+", help="Solo estos países (nombre en español).")',
            '    parser.add_argument("--dry-run", action="store_true", help="Simula, no guarda nada.")',
            '    args = parser.parse_args()', '',
            f'    seleccion = {{n: d for n, d in PROVINCIAS_{lote.upper()}.items() if not args.paises or n in args.paises}}',
            '    for n in set(args.paises or []) - set(seleccion):', '        print(f"Aviso: \'{n}\' no está en este lote, se omite")', '',
            '    db = SessionLocal()', '    total = 0', '    try:', '        for nombre, datos in seleccion.items():',
            '            total += seed_pais(db, nombre, datos)', '        if args.dry_run:', '            db.rollback()',
            '            print(f"\\nDry-run: se crearían {total} regiones. No se ha guardado nada.")', '        else:', '            db.commit()',
            '            print(f"\\nSeed completado: {total} regiones nuevas.")', '    except Exception as e:', '        db.rollback()',
            '        print(f"Error durante el seed: {e}")', '        raise', '    finally:', '        db.close()', '', '',
            'if __name__ == "__main__":', '    main()', '']
    return '\n'.join(out)

def main(argv):
    if '--shp' not in argv or not argv or argv[0].startswith('--'):
        raise SystemExit(__doc__)
    lote = argv[0]; shp = argv[argv.index('--shp') + 1]
    out = argv[argv.index('--out') + 1] if '--out' in argv else os.path.abspath(os.path.join(HERE, '..', '..'))
    cfgs = importlib.import_module('lotes.' + lote).COUNTRIES
    geo, cdir = [os.path.join(out, 'frontend', 'public', 'data', d) for d in ('geo', 'countries')]
    for d in (geo, cdir, os.path.join(out, 'backend')): os.makedirs(d, exist_ok=True)
    for cfg in cfgs:
        svg, unused = build_svg(cfg, shp)
        open(os.path.join(geo, cfg['slug'] + '.svg'), 'w', encoding='utf-8', newline='\n').write(svg)
        open(os.path.join(cdir, cfg['slug'] + '.js'), 'w', encoding='utf-8', newline='\n').write(js_text(cfg))
        print(f"{cfg['slug']:14s} {len(cfg['regions']):3d} regiones, svg {len(svg)/1024:5.1f} KB" + (f"  | NE sin usar: {unused}" if unused else ''))
    open(os.path.join(out, 'backend', f'seed_{lote}.py'), 'w', encoding='utf-8', newline='\n').write(seed_text(lote, cfgs))

if __name__ == '__main__':
    main(sys.argv[1:])
