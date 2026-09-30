"""
Seed de regiones para los 197 países, leyendo los datos de tres ficheros JSON
que van en la misma carpeta que este script (backend/):

    paises_meta.json    -> nombre (es), slug del fichero, capital y continente de cada país
    regiones_base.json  -> regiones de cada país, extraídas de frontend/public/data/countries/*.js
                           (id del SVG, nombre principal y variantes ya existentes)
    nombres_es.json     -> nombre en español / inglés común / alias extra de cada región
                           (lo que tú y yo vamos completando por países)

Mismo patrón que seed_sudamerica.py: cada país es un `Country`, cada división
una `Region`, y cada nombre válido un `RegionName`.

IDEMPOTENTE Y NO DESTRUCTIVO:
- Si el país ya existe (se busca por slug y luego por nombre) no se duplica.
- Si una región ya existe (algún nombre suyo coincide, sin tildes/mayúsculas)
  NO se crea otra: solo se le añaden los nombres que le falten. Así puedes
  pasar este script sobre países ya sembrados (Chile, España...) para
  enriquecerlos con español/inglés/alias.
- Un alias que ya pertenece a OTRA región del mismo país se descarta y se
  avisa, porque haría ambigua la comprobación del juego.

IMPORTANTE (slug): el frontend llama a /regions/check con el slug del fichero
.js (p. ej. "usa", "czechia", "burkina"), y el backend filtra por Country.slug.
Por eso aquí el slug de la BD es siempre el del fichero. Si un país ya estaba
sembrado con otro slug (p. ej. "united-states"), se corrige y se avisa.

USO:
    python seed_mundo.py --dry-run                          # simula todo
    python seed_mundo.py --paises Chile "Estados Unidos"    # solo estos
    python seed_mundo.py --continente "África"              # un continente
    python seed_mundo.py --solo-revisados                   # solo países con español ya revisado
    python seed_mundo.py --silencioso                       # log mínimo
"""

import argparse
import json
import unicodedata
import re
from pathlib import Path

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName

AQUI = Path(__file__).parent
MAX_LEN = 100  # RegionName.name es String(100)


def cargar(nombre):
    with open(AQUI / nombre, encoding="utf-8") as f:
        return json.load(f)


def normalizar(texto):
    """Mismo criterio que utils/normalize.py (lo que usa /regions/check)."""
    texto = (texto or "").strip().lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"[-_/.,'’()]+", " ", texto)
    return " ".join(texto.split())


def construir_nombres(region_base, override):
    """Devuelve (es, en, [alias]) ya limpios y sin duplicados."""
    display = region_base.get("display") or (region_base.get("names") or [None])[0]
    es = override.get("es") or display
    en = override.get("en") or display

    vistos = {normalizar(es), normalizar(en)}
    alias = []
    candidatos = list(override.get("alias", [])) + list(region_base.get("names", []))
    if display:
        candidatos.append(display)
    for c in candidatos:
        clave = normalizar(c)
        if clave and clave not in vistos:
            vistos.add(clave)
            alias.append(c)
    return es, en, alias


def buscar_pais(db, nombre, slug):
    pais = db.query(Country).filter(Country.slug == slug).first()
    if pais:
        return pais
    return db.query(Country).filter(Country.nombre == nombre).first()


def nombres_por_region(db, country_id):
    """{region_id: set(nombres normalizados)} y {nombre normalizado: region_id}."""
    por_region, por_nombre = {}, {}
    for region in db.query(Region).filter(Region.country_id == country_id).all():
        claves = {normalizar(rn.name) for rn in region.names}
        por_region[region.id] = claves
        for c in claves:
            por_nombre.setdefault(c, region.id)
    return por_region, por_nombre


def seed_pais(db, nombre_es, meta, base, extra, dry_run, verbose, informe):
    slug = meta["slug_archivo"]
    pais = buscar_pais(db, nombre_es, slug)
    creado = pais is None

    if creado:
        if not dry_run:
            pais = Country(
                nombre=nombre_es, slug=slug,
                capital=meta["capital"], continente=meta["continente"],
            )
            db.add(pais)
            db.flush()
    elif pais.slug != slug:
        informe["slugs_corregidos"].append((nombre_es, pais.slug, slug))
        if not dry_run:
            pais.slug = slug

    if verbose:
        print(f"[{nombre_es}] país {'creado' if creado else 'ya existía'} (slug: {slug})")

    regiones = base.get("regions", []) if base else []
    if not regiones:
        informe["sin_regiones"].append(nombre_es)
        if verbose:
            print(f"[{nombre_es}] sin regiones en regiones_base.json")
        if not dry_run:
            db.commit()
        return

    por_region, por_nombre = ({}, {}) if (creado or pais is None) else nombres_por_region(db, pais.id)
    overrides = extra.get("regiones", {}) if extra else {}
    revisado = bool(extra and extra.get("_revisado"))
    if not revisado:
        informe["sin_revisar"].append(nombre_es)

    nuevas = enriquecidas = 0
    for reg in regiones:
        es, en, alias = construir_nombres(reg, overrides.get(reg["id"], {}))
        todos = [(es, "es"), (en, "en")] + [(a, "es") for a in alias]
        todos = [(n, l) for n, l in todos if n and len(n) <= MAX_LEN]

        # ¿Ya existe esta región? (algún nombre coincide con uno guardado)
        region_id = next((por_nombre[normalizar(n)] for n, _ in todos if normalizar(n) in por_nombre), None)

        if region_id is None:
            nuevas += 1
            if dry_run:
                if verbose:
                    print(f"  + {es} / {en}" + (f"  (alias: {', '.join(alias)})" if alias else "") + "  -> se crearía")
                continue
            region = Region(country_id=pais.id)
            db.add(region)
            db.flush()
            region_id = region.id
            por_region[region_id] = set()

        existentes = por_region.setdefault(region_id, set())
        añadidos = []
        for nombre, idioma in todos:
            clave = normalizar(nombre)
            if clave in existentes:
                continue
            dueño = por_nombre.get(clave)
            if dueño is not None and dueño != region_id:
                informe["alias_en_conflicto"].append((nombre_es, nombre, es))
                continue
            añadidos.append(nombre)
            if not dry_run:
                db.add(RegionName(region_id=region_id, language=idioma, name=nombre))
            existentes.add(clave)
            por_nombre[clave] = region_id

        if añadidos and region_id and not (dry_run and region_id is None):
            if nuevas == 0 or region_id not in (None,):
                pass
        if añadidos:
            enriquecidas += 1 if region_id is not None and not (dry_run and False) else 0

    if not dry_run:
        db.commit()
    if verbose:
        print(f"  {len(regiones)} regiones: {nuevas} nuevas, {enriquecidas} con nombres añadidos")


def main():
    ap = argparse.ArgumentParser(description="Seed de regiones de los 197 países.")
    ap.add_argument("--paises", nargs="+", help="Nombre (es) tal cual en paises_meta.json. Por defecto, todos.")
    ap.add_argument("--continente", help="Limita a un continente (Europa, Asia, África, América del Norte, América Central, América del Sur, El Caribe, Oceanía).")
    ap.add_argument("--solo-revisados", action="store_true", help="Solo países con '_revisado': true en nombres_es.json.")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--silencioso", action="store_true")
    args = ap.parse_args()

    metas = cargar("paises_meta.json")
    bases = cargar("regiones_base.json")
    extras = cargar("nombres_es.json")

    objetivos = args.paises or list(metas.keys())
    informe = {"slugs_corregidos": [], "sin_regiones": [], "sin_revisar": [], "alias_en_conflicto": []}

    db = SessionLocal()
    try:
        for nombre in objetivos:
            meta = metas.get(nombre)
            if not meta:
                print(f"Aviso: '{nombre}' no está en paises_meta.json, se omite")
                continue
            if args.continente and meta["continente"] != args.continente:
                continue
            extra = extras.get(meta["slug_archivo"])
            if args.solo_revisados and not (extra and extra.get("_revisado")):
                continue
            seed_pais(db, nombre, meta, bases.get(meta["slug_archivo"]), extra,
                      args.dry_run, not args.silencioso, informe)

        if args.dry_run:
            db.rollback()
            print("\nDry-run: no se ha guardado nada.")
        else:
            print("\nSeed completado.")

        if informe["slugs_corregidos"]:
            print("\nSlugs corregidos al del fichero .js:")
            for n, a, b in informe["slugs_corregidos"]:
                print(f"  {n}: {a} -> {b}")
        if informe["alias_en_conflicto"]:
            print("\nNombres descartados por estar ya en otra región del mismo país (revísalos):")
            for p, n, r in informe["alias_en_conflicto"]:
                print(f"  {p}: '{n}' (de {r})")
        if informe["sin_regiones"]:
            print(f"\nPaíses sin regiones en regiones_base.json ({len(informe['sin_regiones'])}): {', '.join(informe['sin_regiones'])}")
        if informe["sin_revisar"]:
            print(f"\nPaíses con español SIN revisar ({len(informe['sin_revisar'])}): se usó el nombre del fichero como 'es'.")
    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
