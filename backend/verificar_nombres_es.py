"""
Verifica que TODOS los nombres de nombres_es_regiones.json son aceptados por la BD.
Solo lee, no modifica nada.

Para cada país del JSON comprueba que:
  - el país existe en la BD (mismo fallback por slug/nombre que seed_nombres_es.py),
  - la región principal (clave del JSON) se encuentra,
  - cada nombre en español existe en ESA región (en cualquier idioma) y no
    pertenece a otra región del mismo país.

USO (desde backend/, dentro del contenedor):
    python verificar_nombres_es.py
    python verificar_nombres_es.py --paises turkey sri-lanka
    python verificar_nombres_es.py --detalle        # lista cada nombre que falla
"""

import argparse

from database.connection import SessionLocal
from models.region_db import Region
from seed_nombres_es import cargar, buscar_pais
from utils.normalize import normalizar


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--paises", nargs="+")
    ap.add_argument("--detalle", action="store_true")
    args = ap.parse_args()

    datos = cargar("nombres_es_regiones.json")
    try:
        metas = cargar("paises_meta.json")
        metas_por_slug = {m["slug_archivo"]: n for n, m in metas.items()}
    except FileNotFoundError:
        metas_por_slug = {}

    db = SessionLocal()
    tot = ok = 0
    no_pais, sin_region, faltan, conflictos = [], [], [], []
    try:
        for slug in args.paises or list(datos):
            pais = buscar_pais(db, slug, metas_por_slug)
            if pais is None:
                no_pais.append(slug)
                continue

            regiones = db.query(Region).filter(Region.country_id == pais.id).all()
            propietario, por_region = {}, {}
            for r in regiones:
                ks = {normalizar(n.name) for n in r.names}
                por_region[r.id] = ks
                for k in ks:
                    propietario.setdefault(k, set()).add(r.id)

            for principal, nombres in datos[slug].items():
                rid = next(iter(propietario.get(normalizar(principal), [])), None)
                if rid is None:
                    sin_region.append((slug, principal))
                    continue
                for nombre in nombres:
                    k = normalizar(nombre)
                    tot += 1
                    if k in por_region[rid]:
                        ok += 1
                    elif propietario.get(k):
                        conflictos.append((slug, nombre, principal))
                    else:
                        faltan.append((slug, nombre, principal))
    finally:
        db.close()

    print(f"Nombres comprobados: {tot}")
    print(f"  aceptados por la BD:            {ok}")
    print(f"  pertenecen a OTRA región:       {len(conflictos)}")
    print(f"  no están en la BD:              {len(faltan)}")
    print(f"Regiones del JSON no encontradas: {len(sin_region)}")
    print(f"Países del JSON no encontrados:   {len(no_pais)}")

    if no_pais:
        print("\nPaíses no encontrados: " + ", ".join(no_pais))
    if sin_region:
        print("\nRegiones no encontradas (revisa el nombre principal):")
        for s, n in sin_region:
            print(f"  {s}: {n}")
    if args.detalle:
        if conflictos:
            print("\nNombres que ya son de otra región:")
            for s, n, p in conflictos:
                print(f"  {s}: '{n}' (quería ir a {p})")
        if faltan:
            print("\nNombres que no están en la BD:")
            for s, n, p in faltan:
                print(f"  {s}: '{n}' (de {p})")


if __name__ == "__main__":
    main()
