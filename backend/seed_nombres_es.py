"""
Añade nombres en español (language "es") a las regiones ya sembradas con
seed_provincias.py, para que el juego acepte "Chechenia", "Baviera", "Cantón",
"Toscana", "Tokio"... además del nombre inglés/local.

Lee nombres_es_regiones.json (en la misma carpeta que este script):

    { "russia": { "Chechnya": ["Chechenia", "República de Chechenia"], ... },
      "china":  { "Guangdong": ["Cantón", ...], ... } }

    - clave de primer nivel = slug del fichero .js del país (el de paises_meta.json)
    - clave de segundo nivel = nombre principal de la región tal como la sembró
      seed_provincias.py (el primero de su lista, en inglés/local)

NO DESTRUCTIVO E IDEMPOTENTE:
- No crea países ni regiones, solo inserta filas en region_names.
- Si la región ya tiene ese nombre (sin tildes/mayúsculas) no lo repite.
- Si el nombre ya pertenece a OTRA región del mismo país, lo descarta y avisa
  (haría ambigua la comprobación del juego).
- Se puede ejecutar varias veces y por tandas: añade países al JSON y repite.

USO (desde backend/):
    python seed_nombres_es.py --dry-run                    # simula todo
    python seed_nombres_es.py                              # aplica todo
    python seed_nombres_es.py --paises russia japan        # solo estos slugs
    python seed_nombres_es.py --silencioso
"""

import argparse
import json
from pathlib import Path

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName
from utils.normalize import normalizar

AQUI = Path(__file__).parent
IDIOMA = "es"
MAX_LEN = 100  # RegionName.name es String(100)


def cargar(nombre):
    with open(AQUI / nombre, encoding="utf-8") as f:
        return json.load(f)


def buscar_pais(db, slug, metas_por_slug):
    pais = db.query(Country).filter(Country.slug == slug).first()
    if pais:
        return pais
    # Por si el país quedó sembrado con otro slug: se busca por su nombre en español.
    nombre = metas_por_slug.get(slug)
    if nombre:
        return db.query(Country).filter(Country.nombre == nombre).first()
    return None


def procesar_pais(db, slug, regiones_es, pais, dry_run, verbose, informe):
    regiones = db.query(Region).filter(Region.country_id == pais.id).all()

    propietario = {}   # nombre normalizado -> id de región dueña
    por_region = {}    # id de región -> set(nombres normalizados)
    for r in regiones:
        claves = {normalizar(n.name) for n in r.names}
        por_region[r.id] = claves
        for c in claves:
            propietario.setdefault(c, r.id)

    añadidos_total = 0
    for principal, nombres in regiones_es.items():
        rid = propietario.get(normalizar(principal))
        if rid is None:
            informe["sin_region"].append((slug, principal))
            continue

        conocidos = por_region[rid]
        añadidos = []
        for nombre in nombres:
            nombre = (nombre or "").strip()
            clave = normalizar(nombre)
            if not clave or len(nombre) > MAX_LEN or clave in conocidos:
                continue
            dueño = propietario.get(clave)
            if dueño is not None and dueño != rid:
                informe["conflictos"].append((slug, nombre, principal))
                continue
            if not dry_run:
                db.add(RegionName(region_id=rid, language=IDIOMA, name=nombre))
            conocidos.add(clave)
            propietario[clave] = rid
            añadidos.append(nombre)

        añadidos_total += len(añadidos)
        if verbose and añadidos:
            print(f"  {principal}: + {', '.join(añadidos)}")

    if not dry_run:
        db.commit()
    informe["nombres_añadidos"] += añadidos_total
    if verbose:
        print(f"[{slug}] {añadidos_total} nombres en español {'por añadir' if dry_run else 'añadidos'}")


def main():
    ap = argparse.ArgumentParser(description="Añade nombres en español a las regiones ya sembradas.")
    ap.add_argument("--paises", nargs="+", help="Slugs a procesar (p. ej. russia china). Por defecto, todos los del JSON.")
    ap.add_argument("--dry-run", action="store_true", help="Simula, no guarda nada.")
    ap.add_argument("--silencioso", action="store_true", help="Log mínimo.")
    args = ap.parse_args()

    datos = cargar("nombres_es_regiones.json")
    try:
        metas = cargar("paises_meta.json")
        metas_por_slug = {m["slug_archivo"]: nombre for nombre, m in metas.items()}
    except FileNotFoundError:
        metas_por_slug = {}

    slugs = args.paises or list(datos.keys())
    informe = {"pais_no_encontrado": [], "sin_region": [], "conflictos": [], "nombres_añadidos": 0}

    db = SessionLocal()
    try:
        for slug in slugs:
            regiones_es = datos.get(slug)
            if regiones_es is None:
                print(f"Aviso: '{slug}' no está en nombres_es_regiones.json, se omite")
                continue
            pais = buscar_pais(db, slug, metas_por_slug)
            if pais is None:
                informe["pais_no_encontrado"].append(slug)
                continue
            procesar_pais(db, slug, regiones_es, pais, args.dry_run, not args.silencioso, informe)

        if args.dry_run:
            db.rollback()
            print("\nDry-run: no se ha guardado nada.")
        print(f"\nTotal de nombres en español {'por añadir' if args.dry_run else 'añadidos'}: {informe['nombres_añadidos']}")

        if informe["pais_no_encontrado"]:
            print("\nPaíses que no están en la BD (siémbralos antes con seed_provincias.py):")
            print("  " + ", ".join(informe["pais_no_encontrado"]))
        if informe["sin_region"]:
            print("\nRegiones del JSON que no se encontraron en la BD (revisa el nombre principal):")
            for slug, nombre in informe["sin_region"]:
                print(f"  {slug}: {nombre}")
        if informe["conflictos"]:
            print("\nNombres descartados por pertenecer ya a otra región del mismo país:")
            for slug, nombre, region in informe["conflictos"]:
                print(f"  {slug}: '{nombre}' (quería ir a {region})")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
