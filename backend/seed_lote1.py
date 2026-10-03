"""
Seed de provincias/regiones — lote1 (generado con tools/make_country.py).

Reutiliza seed_pais() de seed_provincias.py: mismo formato, mismo idioma ("en"), idempotente
(si el país YA tiene regiones, se omite).
Requiere que el país exista en MUNDO (seed_paises_mundo.py); si no está en la BD, se crea.

USO (desde backend/):
    python seed_lote1.py                       # todos los del lote
    python seed_lote1.py --paises Panamá Guyana
    python seed_lote1.py --dry-run

Después, para enlazar cada .js con la BD (rellena los region_id: null):
    python fill_region_ids.py ../frontend/public/data/countries/<slug>.js "<País>"
"""

import argparse

from database.connection import SessionLocal
from seed_provincias import seed_pais

PROVINCIAS_LOTE1 = {
    "Panamá": {
        "archivo": "panama",
        "regiones": [
            ["Bocas del Toro"],
            ["Ngäbe-Buglé", "Ngöbe-Buglé", "Ngobe-Bugle", "Ngäbe Buglé", "Ngobe Bugle", "Ngäbe-Buglé Comarca"],
            ["Chiriquí", "Chiriqui"],
            ["Guna Yala", "Kuna Yala", "San Blas", "Guna Yala Comarca"],
            ["Emberá-Wounaan", "Embera-Wounaan", "Embera Wounaan", "Emberá", "Embera"],
            ["Darién", "Darien"],
            ["Panamá", "Panama", "Panama Province", "Provincia de Panamá"],
            ["Coclé", "Cocle"],
            ["Veraguas"],
            ["Colón", "Colon"],
            ["Los Santos"],
            ["Herrera"],
        ],
    },
    "Guyana": {
        "archivo": "guyana",
        "regiones": [
            ["Barima-Waini", "Barima Waini", "Region 1"],
            ["Pomeroon-Supenaam", "Pomeroon Supenaam", "Region 2"],
            ["Essequibo Islands-West Demerara", "Essequibo Islands West Demerara", "Essequibo Islands", "Region 3"],
            ["Demerara-Mahaica", "Demerara Mahaica", "Region 4"],
            ["Mahaica-Berbice", "Mahaica Berbice", "Region 5"],
            ["East Berbice-Corentyne", "East Berbice Corentyne", "Region 6"],
            ["Cuyuni-Mazaruni", "Cuyuni Mazaruni", "Region 7"],
            ["Potaro-Siparuni", "Potaro Siparuni", "Region 8"],
            ["Upper Takutu-Upper Essequibo", "Upper Takutu Upper Essequibo", "Upper Takutu", "Region 9"],
            ["Upper Demerara-Berbice", "Upper Demerara Berbice", "Region 10"],
        ],
    },
    "Barbados": {
        "archivo": "barbados",
        "regiones": [
            ["Christ Church", "Christ Church Parish"],
            ["Saint Andrew", "St Andrew", "St. Andrew", "Saint Andrew Parish", "St Andrew Parish", "St. Andrew Parish"],
            ["Saint George", "St George", "St. George", "Saint George Parish", "St George Parish", "St. George Parish"],
            ["Saint James", "St James", "St. James", "Saint James Parish", "St James Parish", "St. James Parish"],
            ["Saint John", "St John", "St. John", "Saint John Parish", "St John Parish", "St. John Parish"],
            ["Saint Joseph", "St Joseph", "St. Joseph", "Saint Joseph Parish", "St Joseph Parish", "St. Joseph Parish"],
            ["Saint Lucy", "St Lucy", "St. Lucy", "Saint Lucy Parish", "St Lucy Parish", "St. Lucy Parish"],
            ["Saint Michael", "St Michael", "St. Michael", "Saint Michael Parish", "St Michael Parish", "St. Michael Parish"],
            ["Saint Peter", "St Peter", "St. Peter", "Saint Peter Parish", "St Peter Parish", "St. Peter Parish"],
            ["Saint Philip", "St Philip", "St. Philip", "Saint Philip Parish", "St Philip Parish", "St. Philip Parish"],
            ["Saint Thomas", "St Thomas", "St. Thomas", "Saint Thomas Parish", "St Thomas Parish", "St. Thomas Parish"],
        ],
    },
    "Dominica": {
        "archivo": "dominica",
        "regiones": [
            ["Saint Andrew", "St Andrew", "St. Andrew", "Saint Andrew Parish", "St Andrew Parish", "St. Andrew Parish"],
            ["Saint David", "St David", "St. David", "Saint David Parish", "St David Parish", "St. David Parish"],
            ["Saint George", "St George", "St. George", "Saint George Parish", "St George Parish", "St. George Parish"],
            ["Saint John", "St John", "St. John", "Saint John Parish", "St John Parish", "St. John Parish"],
            ["Saint Joseph", "St Joseph", "St. Joseph", "Saint Joseph Parish", "St Joseph Parish", "St. Joseph Parish"],
            ["Saint Luke", "St Luke", "St. Luke", "Saint Luke Parish", "St Luke Parish", "St. Luke Parish"],
            ["Saint Mark", "St Mark", "St. Mark", "Saint Mark Parish", "St Mark Parish", "St. Mark Parish"],
            ["Saint Patrick", "St Patrick", "St. Patrick", "Saint Patrick Parish", "St Patrick Parish", "St. Patrick Parish"],
            ["Saint Paul", "St Paul", "St. Paul", "Saint Paul Parish", "St Paul Parish", "St. Paul Parish"],
            ["Saint Peter", "St Peter", "St. Peter", "Saint Peter Parish", "St Peter Parish", "St. Peter Parish"],
        ],
    },
    "Granada": {
        "archivo": "grenada",
        "regiones": [
            ["Saint Andrew", "St Andrew", "St. Andrew", "Saint Andrew Parish", "St Andrew Parish", "St. Andrew Parish"],
            ["Saint David", "St David", "St. David", "Saint David Parish", "St David Parish", "St. David Parish"],
            ["Saint George", "St George", "St. George", "Saint George Parish", "St George Parish", "St. George Parish"],
            ["Saint John", "St John", "St. John", "Saint John Parish", "St John Parish", "St. John Parish"],
            ["Saint Mark", "St Mark", "St. Mark", "Saint Mark Parish", "St Mark Parish", "St. Mark Parish"],
            ["Saint Patrick", "St Patrick", "St. Patrick", "Saint Patrick Parish", "St Patrick Parish", "St. Patrick Parish"],
            ["Carriacou and Petite Martinique", "Carriacou", "Petite Martinique", "Carriacou & Petite Martinique", "Carriacou and Petite Martinique Parish", "Carriacou Parish", "Petite Martinique Parish", "Carriacou & Petite Martinique Parish"],
        ],
    },
    "Santa Lucía": {
        "archivo": "saint-lucia",
        "regiones": [
            ["Anse la Raye", "Anse-la-Raye", "Anse la Raye Quarter", "Anse la Raye District", "Anse-la-Raye Quarter", "Anse-la-Raye District"],
            ["Castries", "Castries Quarter", "Castries District"],
            ["Choiseul", "Choiseul Quarter", "Choiseul District"],
            ["Dauphin", "Dauphin Quarter", "Dauphin District"],
            ["Dennery", "Dennery Quarter", "Dennery District"],
            ["Gros Islet", "Gros-Islet", "Gros Islet Quarter", "Gros Islet District", "Gros-Islet Quarter", "Gros-Islet District"],
            ["Laborie", "Laborie Quarter", "Laborie District"],
            ["Micoud", "Micoud Quarter", "Micoud District"],
            ["Praslin", "Praslin Quarter", "Praslin District"],
            ["Soufrière", "Soufriere", "Soufrière Quarter", "Soufrière District", "Soufriere Quarter", "Soufriere District"],
            ["Vieux Fort", "Vieux-Fort", "Vieux Fort Quarter", "Vieux Fort District", "Vieux-Fort Quarter", "Vieux-Fort District"],
        ],
    },
}


def main():
    parser = argparse.ArgumentParser(description="Seed de regiones (lote1)")
    parser.add_argument("--paises", nargs="+", help="Solo estos países (nombre en español).")
    parser.add_argument("--dry-run", action="store_true", help="Simula, no guarda nada.")
    args = parser.parse_args()

    seleccion = {n: d for n, d in PROVINCIAS_LOTE1.items() if not args.paises or n in args.paises}
    for n in set(args.paises or []) - set(seleccion):
        print(f"Aviso: '{n}' no está en este lote, se omite")

    db = SessionLocal()
    total = 0
    try:
        for nombre, datos in seleccion.items():
            total += seed_pais(db, nombre, datos)
        if args.dry_run:
            db.rollback()
            print(f"\nDry-run: se crearían {total} regiones. No se ha guardado nada.")
        else:
            db.commit()
            print(f"\nSeed completado: {total} regiones nuevas.")
    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
