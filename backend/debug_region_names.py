"""
Diagnóstico: lista todas las regiones de un país tal como están en BD,
con sus region_id y todos sus RegionName. Útil para ver por qué un
nombre del JS no hace match (p. ej. Bogotá en Colombia).

USO:
    python debug_region_names.py Colombia
"""

import sys

from database.connection import SessionLocal
from models.country_db import Country


def main(nombre_pais):
    db = SessionLocal()
    try:
        country = db.query(Country).filter(Country.nombre == nombre_pais).first()
        if not country:
            print(f"No existe el país '{nombre_pais}' en la tabla countries")
            return

        print(f"País: {country.nombre} (id={country.id})")
        print(f"Total regiones en BD: {len(country.regiones)}\n")

        for region in country.regiones:
            nombres = [rn.name for rn in region.names]
            print(f"  region_id={region.id}  ->  {nombres}")

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python debug_region_names.py <NombrePais>")
        sys.exit(1)
    main(sys.argv[1])
