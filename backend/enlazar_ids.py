"""
Enlaza con la BD los ficheros JS de los países sembrados con seed_provincias.py:
pone el `id` del país (lo necesita el juego para guardar el progreso) y rellena
los `region_id` que existan. Usa fill_region_ids.py, el mismo de siempre, pero
para los 135 países de una vez.

Trabaja sobre COPIAS: no toca tus ficheros originales. Flujo (desde ~/geoplay):

    docker compose cp frontend/public/data/countries backend:/tmp/countries
    docker compose cp backend/enlazar_ids.py backend:/app/enlazar_ids.py
    docker compose exec backend python enlazar_ids.py
    docker compose cp backend:/tmp/countries_out/. frontend/public/data/countries/

(`backend/` ya tiene fill_region_ids.py dentro del contenedor; si no, cópialo igual.)

Solo imprime los avisos (regiones que no ha podido enlazar) y un resumen.
    --paises España Japón   solo estos
    --origen / --salida     cambian las carpetas (por defecto /tmp/countries y /tmp/countries_out)
"""

import argparse
import contextlib
import io
from pathlib import Path

from fill_region_ids import rellenar_region_ids
from seed_provincias import PROVINCIAS


def main():
    ap = argparse.ArgumentParser(description="Enlaza los JS de países con la BD.")
    ap.add_argument("--paises", nargs="+", help="Solo estos países (nombre en español).")
    ap.add_argument("--origen", default="/tmp/countries")
    ap.add_argument("--salida", default="/tmp/countries_out")
    args = ap.parse_args()

    origen, salida = Path(args.origen), Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)

    hechos, con_avisos, fallos = 0, [], []
    for nombre, datos in PROVINCIAS.items():
        if args.paises and nombre not in args.paises:
            continue
        src = origen / f"{datos['archivo']}.js"
        if not src.exists():
            fallos.append((nombre, f"no existe {src}"))
            continue

        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                rellenar_region_ids(str(src), nombre, str(salida / src.name))
        except Exception as e:  # p. ej. el país no está en la BD
            fallos.append((nombre, str(e)))
            continue

        hechos += 1
        avisos = [l for l in buf.getvalue().splitlines() if l.startswith("  - ")]
        if avisos:
            con_avisos.append((nombre, avisos))

    for nombre, avisos in con_avisos:
        print(f"\n[{nombre}] regiones sin region_id ({len(avisos)}):")
        for a in avisos[:10]:
            print("  ", a)
        if len(avisos) > 10:
            print(f"   ... y {len(avisos) - 10} más")

    print(f"\nEnlazados: {hechos} países ({len(con_avisos)} con avisos).")
    if fallos:
        print("Fallos:")
        for nombre, motivo in fallos:
            print(f"  - {nombre}: {motivo}")


if __name__ == "__main__":
    main()
