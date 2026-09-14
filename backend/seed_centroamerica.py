"""
Seed de departamentos/provincias/distritos para países de Centroamérica.

Mismo patrón que seed_sudamerica.py: cada país es un `Country` real, y
sus divisiones son `Region` con nombres multilingües en `RegionName`.

DISEÑO ABIERTO:
- Añade, corrige o completa países en el diccionario CENTROAMERICA sin
  tocar nada de la lógica de abajo.
- Un país con `"provincias": []` se crea igualmente (placeholder),
  pero sin detalle todavía — cómodo para ir completando poco a poco.
- Es idempotente: si ejecutas el script dos veces, no duplica países
  ni provincias ya insertadas (comprueba por nombre en español).

NOTA sobre Panamá: se incluyen solo las 10 provincias. Las 3 comarcas
indígenas (Guna Yala, Emberá-Wounaan, Ngäbe-Buglé) no están porque no
sabía si tu juego las cuenta como región de pleno derecho o no —
añádelas a la lista de "provincias" de Panamá si las necesitas, con
el mismo formato {"es": ..., "en": ...}.

USO:
    python seed_centroamerica.py                            # todos los países
    python seed_centroamerica.py --paises Guatemala Panama   # solo estos
    python seed_centroamerica.py --dry-run                  # simula, no escribe en BD
    python seed_centroamerica.py --silencioso                # log mínimo
"""

import argparse

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName


# ---------------------------------------------------------------------------
# DATOS — edita aquí. "es"/"en" son los nombres validados por el juego.
# ---------------------------------------------------------------------------

CENTROAMERICA = {
    "Guatemala": {
        "slug": "guatemala",
        "capital": "Ciudad de Guatemala",
        "provincias": [
            {"es": "Alta Verapaz", "en": "Alta Verapaz"},
            {"es": "Baja Verapaz", "en": "Baja Verapaz"},
            {"es": "Chimaltenango", "en": "Chimaltenango"},
            {"es": "Chiquimula", "en": "Chiquimula"},
            {"es": "El Progreso", "en": "El Progreso"},
            {"es": "Escuintla", "en": "Escuintla"},
            {"es": "Guatemala", "en": "Guatemala", "alias": ["Ciudad de Guatemala"]},
            {"es": "Huehuetenango", "en": "Huehuetenango"},
            {"es": "Izabal", "en": "Izabal"},
            {"es": "Jalapa", "en": "Jalapa"},
            {"es": "Jutiapa", "en": "Jutiapa"},
            {"es": "Petén", "en": "Peten"},
            {"es": "Quetzaltenango", "en": "Quetzaltenango"},
            {"es": "Quiché", "en": "Quiche", "alias": ["El Quiché", "El Quiche"]},
            {"es": "Retalhuleu", "en": "Retalhuleu"},
            {"es": "Sacatepéquez", "en": "Sacatepequez"},
            {"es": "San Marcos", "en": "San Marcos"},
            {"es": "Santa Rosa", "en": "Santa Rosa"},
            {"es": "Sololá", "en": "Solola"},
            {"es": "Suchitepéquez", "en": "Suchitepequez"},
            {"es": "Totonicapán", "en": "Totonicapan"},
            {"es": "Zacapa", "en": "Zacapa"},
        ],
    },
    "Belice": {
        "slug": "belize",
        "capital": "Belmopán",
        "provincias": [
            {"es": "Belice", "en": "Belize"},
            {"es": "Cayo", "en": "Cayo"},
            {"es": "Corozal", "en": "Corozal"},
            {"es": "Orange Walk", "en": "Orange Walk"},
            {"es": "Stann Creek", "en": "Stann Creek"},
            {"es": "Toledo", "en": "Toledo"},
        ],
    },
    "Honduras": {
        "slug": "honduras",
        "capital": "Tegucigalpa",
        "provincias": [
            {"es": "Atlántida", "en": "Atlantida"},
            {"es": "Choluteca", "en": "Choluteca"},
            {"es": "Colón", "en": "Colon"},
            {"es": "Comayagua", "en": "Comayagua"},
            {"es": "Copán", "en": "Copan"},
            {"es": "Cortés", "en": "Cortes"},
            {"es": "El Paraíso", "en": "El Paraiso"},
            {"es": "Francisco Morazán", "en": "Francisco Morazan", "alias": ["Tegucigalpa"]},
            {"es": "Gracias a Dios", "en": "Gracias a Dios"},
            {"es": "Intibucá", "en": "Intibuca"},
            {"es": "Islas de la Bahía", "en": "Bay Islands", "alias": ["Islas de la Bahia"]},
            {"es": "La Paz", "en": "La Paz"},
            {"es": "Lempira", "en": "Lempira"},
            {"es": "Ocotepeque", "en": "Ocotepeque"},
            {"es": "Olancho", "en": "Olancho"},
            {"es": "Santa Bárbara", "en": "Santa Barbara"},
            {"es": "Valle", "en": "Valle"},
            {"es": "Yoro", "en": "Yoro"},
        ],
    },
    "El Salvador": {
        "slug": "el-salvador",
        "capital": "San Salvador",
        "provincias": [
            {"es": "Ahuachapán", "en": "Ahuachapan"},
            {"es": "Cabañas", "en": "Cabanas"},
            {"es": "Chalatenango", "en": "Chalatenango"},
            {"es": "Cuscatlán", "en": "Cuscatlan"},
            {"es": "La Libertad", "en": "La Libertad"},
            {"es": "La Paz", "en": "La Paz"},
            {"es": "La Unión", "en": "La Union"},
            {"es": "Morazán", "en": "Morazan"},
            {"es": "San Miguel", "en": "San Miguel"},
            {"es": "San Salvador", "en": "San Salvador"},
            {"es": "San Vicente", "en": "San Vicente"},
            {"es": "Santa Ana", "en": "Santa Ana"},
            {"es": "Sonsonate", "en": "Sonsonate"},
            {"es": "Usulután", "en": "Usulutan"},
        ],
    },
    "Nicaragua": {
        "slug": "nicaragua",
        "capital": "Managua",
        "provincias": [
            {"es": "Boaco", "en": "Boaco"},
            {"es": "Carazo", "en": "Carazo"},
            {"es": "Chinandega", "en": "Chinandega"},
            {"es": "Chontales", "en": "Chontales"},
            {"es": "Estelí", "en": "Esteli"},
            {"es": "Granada", "en": "Granada"},
            {"es": "Jinotega", "en": "Jinotega"},
            {"es": "León", "en": "Leon"},
            {"es": "Madriz", "en": "Madriz"},
            {"es": "Managua", "en": "Managua"},
            {"es": "Masaya", "en": "Masaya"},
            {"es": "Matagalpa", "en": "Matagalpa"},
            {"es": "Nueva Segovia", "en": "Nueva Segovia"},
            {"es": "Río San Juan", "en": "Rio San Juan"},
            {"es": "Rivas", "en": "Rivas"},
            {
                "es": "Costa Caribe Norte",
                "en": "North Caribbean Coast",
                "alias": ["RACCN", "Región Autónoma de la Costa Caribe Norte"],
            },
            {
                "es": "Costa Caribe Sur",
                "en": "South Caribbean Coast",
                "alias": ["RACCS", "Región Autónoma de la Costa Caribe Sur"],
            },
        ],
    },
    "Costa Rica": {
        "slug": "costa-rica",
        "capital": "San José",
        "provincias": [
            {"es": "San José", "en": "San Jose"},
            {"es": "Alajuela", "en": "Alajuela"},
            {"es": "Cartago", "en": "Cartago"},
            {"es": "Heredia", "en": "Heredia"},
            {"es": "Guanacaste", "en": "Guanacaste"},
            {"es": "Puntarenas", "en": "Puntarenas"},
            {"es": "Limón", "en": "Limon"},
        ],
    },
    "Panamá": {
        "slug": "panama",
        "capital": "Ciudad de Panamá",
        "provincias": [
            {"es": "Bocas del Toro", "en": "Bocas del Toro"},
            {"es": "Chiriquí", "en": "Chiriqui"},
            {"es": "Coclé", "en": "Cocle"},
            {"es": "Colón", "en": "Colon"},
            {"es": "Darién", "en": "Darien"},
            {"es": "Herrera", "en": "Herrera"},
            {"es": "Los Santos", "en": "Los Santos"},
            {"es": "Panamá", "en": "Panama", "alias": ["Ciudad de Panamá"]},
            {"es": "Panamá Oeste", "en": "West Panama"},
            {"es": "Veraguas", "en": "Veraguas"},
        ],
    },
}

CONTINENTE = "América Central"


# ---------------------------------------------------------------------------
# LÓGICA — no debería hacer falta tocar esto para añadir países/provincias
# ---------------------------------------------------------------------------

def get_or_create_country(db, nombre, slug, capital):
    country = db.query(Country).filter(Country.nombre == nombre).first()
    if country:
        if not country.slug:
            country.slug = slug  # migra países ya sembrados sin slug todavía
        return country, False

    country = Country(nombre=nombre, slug=slug, capital=capital, continente=CONTINENTE)
    db.add(country)
    db.flush()  # asigna id sin hacer commit todavía
    return country, True


def get_existing_region_names(db, country_id):
    """Nombres (es) de regiones ya creadas para este país — para no duplicar."""
    existentes = set()
    for region in db.query(Region).filter(Region.country_id == country_id).all():
        for rn in region.names:
            existentes.add(rn.name)
    return existentes


def seed_country(db, nombre_pais, datos, dry_run=False, verbose=True):
    country, creado = get_or_create_country(
        db, nombre_pais, datos["slug"], datos["capital"]
    )
    if verbose:
        estado = "creado" if creado else "ya existía"
        print(f"[{nombre_pais}] país {estado}")

    if not datos["provincias"]:
        if verbose:
            print(f"[{nombre_pais}] sin provincias definidas todavía (placeholder)")
        if not dry_run:
            db.commit()
        return

    existentes = get_existing_region_names(db, country.id) if not dry_run else set()

    for provincia in datos["provincias"]:
        nombre_es = provincia["es"]
        nombre_en = provincia.get("en", nombre_es)
        alias = provincia.get("alias", [])  # nombres cortos/coloquiales aceptados como respuesta

        if nombre_es in existentes:
            if verbose:
                print(f"  - {nombre_es}: ya existe, se omite")
            continue

        if dry_run:
            extra = f" (alias: {', '.join(alias)})" if alias else ""
            print(f"  - {nombre_es} / {nombre_en}{extra}: se insertaría")
            continue

        region = Region(country_id=country.id)
        db.add(region)
        db.flush()

        db.add(RegionName(region_id=region.id, language="es", name=nombre_es))
        db.add(RegionName(region_id=region.id, language="en", name=nombre_en))
        for nombre_alias in alias:
            db.add(RegionName(region_id=region.id, language="es", name=nombre_alias))

        if verbose:
            extra = f" (alias: {', '.join(alias)})" if alias else ""
            print(f"  - {nombre_es} / {nombre_en}{extra}: insertado")

    if not dry_run:
        db.commit()


def main():
    parser = argparse.ArgumentParser(
        description="Seed de departamentos/provincias de países de Centroamérica."
    )
    parser.add_argument(
        "--paises",
        nargs="+",
        help="Limita el seed a estos países (nombre exacto, tal cual en el diccionario). Por defecto, todos.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra lo que se insertaría, sin escribir en la base de datos.",
    )
    parser.add_argument(
        "--silencioso",
        action="store_true",
        help="Reduce el log al mínimo.",
    )
    args = parser.parse_args()

    paises_a_procesar = args.paises if args.paises else list(CENTROAMERICA.keys())

    db = SessionLocal()
    try:
        for nombre_pais in paises_a_procesar:
            datos = CENTROAMERICA.get(nombre_pais)
            if not datos:
                print(f"Aviso: '{nombre_pais}' no está en CENTROAMERICA, se omite")
                continue

            seed_country(
                db,
                nombre_pais,
                datos,
                dry_run=args.dry_run,
                verbose=not args.silencioso,
            )

        if args.dry_run:
            db.rollback()
            print("\nDry-run: no se ha guardado nada en la base de datos.")
        else:
            print("\nSeed de Centroamérica completado.")

    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
