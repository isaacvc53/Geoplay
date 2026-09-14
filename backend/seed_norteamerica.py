"""
Seed de estados/provincias para países de Norteamérica (México, Estados
Unidos y Canadá).

Mismo patrón que seed_sudamerica.py: cada país es un `Country` real, y
sus divisiones son `Region` con nombres multilingües en `RegionName`.

DISEÑO ABIERTO:
- Añade, corrige o completa países en el diccionario NORTEAMERICA sin
  tocar nada de la lógica de abajo.
- Un país con `"provincias": []` se crea igualmente (placeholder),
  pero sin detalle todavía — cómodo para ir completando poco a poco.
- Es idempotente: si ejecutas el script dos veces, no duplica países
  ni provincias ya insertadas (comprueba por nombre en español).

NOTA sobre Estados Unidos: se incluyen los 50 estados. Washington D.C.
no está en la lista porque no es un estado — si tu juego quiere
contarlo como región adivinable (como se hizo con Bogotá D.C. en
Colombia), añade una entrada más con
{"es": "Distrito de Columbia", "en": "District of Columbia", "alias": ["Washington D.C.", "Washington DC", "D.C.", "DC"]}
y ajusta el "total" en el JS del frontend de 50 a 51.

USO:
    python seed_norteamerica.py                              # todos los países
    python seed_norteamerica.py --paises Mexico "Estados Unidos"  # solo estos
    python seed_norteamerica.py --dry-run                    # simula, no escribe en BD
    python seed_norteamerica.py --silencioso                  # log mínimo
"""

import argparse

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName


# ---------------------------------------------------------------------------
# DATOS — edita aquí. "es"/"en" son los nombres validados por el juego.
# ---------------------------------------------------------------------------

NORTEAMERICA = {
    "México": {
        "slug": "mexico",
        "capital": "Ciudad de México",
        "provincias": [
            {"es": "Aguascalientes", "en": "Aguascalientes"},
            {"es": "Baja California", "en": "Baja California"},
            {"es": "Baja California Sur", "en": "Baja California Sur"},
            {"es": "Campeche", "en": "Campeche"},
            {"es": "Chiapas", "en": "Chiapas"},
            {"es": "Chihuahua", "en": "Chihuahua"},
            {
                "es": "Ciudad de México",
                "en": "Mexico City",
                "alias": ["CDMX", "Distrito Federal", "DF"],
            },
            {"es": "Coahuila", "en": "Coahuila"},
            {"es": "Colima", "en": "Colima"},
            {"es": "Durango", "en": "Durango"},
            {"es": "Guanajuato", "en": "Guanajuato"},
            {"es": "Guerrero", "en": "Guerrero"},
            {"es": "Hidalgo", "en": "Hidalgo"},
            {"es": "Jalisco", "en": "Jalisco"},
            {"es": "México", "en": "State of Mexico", "alias": ["Estado de México", "Edomex"]},
            {"es": "Michoacán", "en": "Michoacan"},
            {"es": "Morelos", "en": "Morelos"},
            {"es": "Nayarit", "en": "Nayarit"},
            {"es": "Nuevo León", "en": "Nuevo Leon"},
            {"es": "Oaxaca", "en": "Oaxaca"},
            {"es": "Puebla", "en": "Puebla"},
            {"es": "Querétaro", "en": "Queretaro"},
            {"es": "Quintana Roo", "en": "Quintana Roo"},
            {"es": "San Luis Potosí", "en": "San Luis Potosi"},
            {"es": "Sinaloa", "en": "Sinaloa"},
            {"es": "Sonora", "en": "Sonora"},
            {"es": "Tabasco", "en": "Tabasco"},
            {"es": "Tamaulipas", "en": "Tamaulipas"},
            {"es": "Tlaxcala", "en": "Tlaxcala"},
            {"es": "Veracruz", "en": "Veracruz"},
            {"es": "Yucatán", "en": "Yucatan"},
            {"es": "Zacatecas", "en": "Zacatecas"},
        ],
    },
    "Estados Unidos": {
        "slug": "united-states",
        "capital": "Washington D.C.",
        "provincias": [
            {"es": "Alabama", "en": "Alabama"},
            {"es": "Alaska", "en": "Alaska"},
            {"es": "Arizona", "en": "Arizona"},
            {"es": "Arkansas", "en": "Arkansas"},
            {"es": "California", "en": "California"},
            {"es": "Colorado", "en": "Colorado"},
            {"es": "Connecticut", "en": "Connecticut"},
            {"es": "Delaware", "en": "Delaware"},
            {"es": "Florida", "en": "Florida"},
            {"es": "Georgia", "en": "Georgia"},
            {"es": "Hawái", "en": "Hawaii"},
            {"es": "Idaho", "en": "Idaho"},
            {"es": "Illinois", "en": "Illinois"},
            {"es": "Indiana", "en": "Indiana"},
            {"es": "Iowa", "en": "Iowa"},
            {"es": "Kansas", "en": "Kansas"},
            {"es": "Kentucky", "en": "Kentucky"},
            {"es": "Luisiana", "en": "Louisiana"},
            {"es": "Maine", "en": "Maine"},
            {"es": "Maryland", "en": "Maryland"},
            {"es": "Massachusetts", "en": "Massachusetts"},
            {"es": "Míchigan", "en": "Michigan"},
            {"es": "Minnesota", "en": "Minnesota"},
            {"es": "Misisipi", "en": "Mississippi"},
            {"es": "Misuri", "en": "Missouri"},
            {"es": "Montana", "en": "Montana"},
            {"es": "Nebraska", "en": "Nebraska"},
            {"es": "Nevada", "en": "Nevada"},
            {"es": "Nuevo Hampshire", "en": "New Hampshire"},
            {"es": "Nueva Jersey", "en": "New Jersey"},
            {"es": "Nuevo México", "en": "New Mexico"},
            {"es": "Nueva York", "en": "New York"},
            {"es": "Carolina del Norte", "en": "North Carolina"},
            {"es": "Dakota del Norte", "en": "North Dakota"},
            {"es": "Ohio", "en": "Ohio"},
            {"es": "Oklahoma", "en": "Oklahoma"},
            {"es": "Oregón", "en": "Oregon"},
            {"es": "Pensilvania", "en": "Pennsylvania"},
            {"es": "Rhode Island", "en": "Rhode Island"},
            {"es": "Carolina del Sur", "en": "South Carolina"},
            {"es": "Dakota del Sur", "en": "South Dakota"},
            {"es": "Tennessee", "en": "Tennessee"},
            {"es": "Texas", "en": "Texas"},
            {"es": "Utah", "en": "Utah"},
            {"es": "Vermont", "en": "Vermont"},
            {"es": "Virginia", "en": "Virginia"},
            {"es": "Washington", "en": "Washington"},
            {"es": "Virginia Occidental", "en": "West Virginia"},
            {"es": "Wisconsin", "en": "Wisconsin"},
            {"es": "Wyoming", "en": "Wyoming"},
        ],
    },
    "Canadá": {
        "slug": "canada",
        "capital": "Ottawa",
        "provincias": [
            {"es": "Alberta", "en": "Alberta"},
            {"es": "Columbia Británica", "en": "British Columbia"},
            {"es": "Manitoba", "en": "Manitoba"},
            {"es": "Nuevo Brunswick", "en": "New Brunswick"},
            {"es": "Terranova y Labrador", "en": "Newfoundland and Labrador"},
            {"es": "Nueva Escocia", "en": "Nova Scotia"},
            {"es": "Ontario", "en": "Ontario"},
            {"es": "Isla del Príncipe Eduardo", "en": "Prince Edward Island"},
            {"es": "Quebec", "en": "Quebec"},
            {"es": "Saskatchewan", "en": "Saskatchewan"},
            {"es": "Territorios del Noroeste", "en": "Northwest Territories"},
            {"es": "Nunavut", "en": "Nunavut"},
            {"es": "Yukón", "en": "Yukon"},
        ],
    },
}

CONTINENTE = "América del Norte"


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
        description="Seed de estados/provincias de países de Norteamérica."
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

    paises_a_procesar = args.paises if args.paises else list(NORTEAMERICA.keys())

    db = SessionLocal()
    try:
        for nombre_pais in paises_a_procesar:
            datos = NORTEAMERICA.get(nombre_pais)
            if not datos:
                print(f"Aviso: '{nombre_pais}' no está en NORTEAMERICA, se omite")
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
            print("\nSeed de Norteamérica completado.")

    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
