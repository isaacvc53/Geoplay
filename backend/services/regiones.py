from models.region_db import Region
from models.country_db import Country
from database.connection import SessionLocal
from models.region_name_db import RegionName
from utils.normalize import normalizar


def service_conseguir_regions(nombre_pais):
    db = SessionLocal()
    regions = (
        db.query(Region)
        .join(Country)
        .filter(Country.nombre == nombre_pais)
        .all()
    )
    db.close()
    return regions


def service_crear_region(nueva_region):
    db = SessionLocal()
    country_id = (
        db.query(Country.id)
        .filter(Country.nombre == nueva_region.pais)
        .scalar()
    )

    if not country_id:
        db.close()
        return None

    nueva_region_db = Region(country_id=country_id)
    db.add(nueva_region_db)
    db.commit()
    db.refresh(nueva_region_db)
    db.close()
    return nueva_region_db


def service_eliminar_region(nombre_pais, nombre_region):
    db = SessionLocal()
    region_actual = (
        db.query(Region)
        .join(Country)
        .join(Region.names)
        .filter(
            Country.nombre == nombre_pais,
            RegionName.name == nombre_region,
        )
        .first()
    )

    if region_actual:
        db.delete(region_actual)
        db.commit()
        db.close()
        return {"mensaje": "Región eliminada"}

    db.close()


def service_modificar_region(nombre_pais, nombre_region, datos_nuevos):
    db = SessionLocal()
    region_actual = (
        db.query(Region)
        .join(Country)
        .join(Region.names)
        .filter(
            Country.nombre == nombre_pais,
            RegionName.name == nombre_region,
        )
        .first()
    )

    if region_actual:
        db.commit()
        db.refresh(region_actual)
        db.close()
        return region_actual

    db.close()


def _tokens_match(guess: str, candidate: str) -> bool:
    """Acepta palabras completas o comienzos de palabra de >= 3 caracteres."""
    guess_tokens = normalizar(guess).split()
    candidate_tokens = normalizar(candidate).split()

    if not guess_tokens:
        return False

    for guessed_token in guess_tokens:
        if len(guessed_token) < 3:
            if guessed_token not in candidate_tokens:
                return False
            continue

        if not any(
            token == guessed_token or token.startswith(guessed_token)
            for token in candidate_tokens
        ):
            return False

    return True


def service_comprobar_nombre(nombre_pais: str, nombre_intentado: str):
    """Busca una región por nombre exacto o por palabras parciales no ambiguas."""
    db = SessionLocal()
    objetivo = normalizar(nombre_intentado)

    if not objetivo:
        db.close()
        return None

    resultados = (
        db.query(RegionName, Region)
        .join(Region, RegionName.region_id == Region.id)
        .join(Country, Region.country_id == Country.id)
        .filter(Country.nombre == nombre_pais)
        .all()
    )

    # 1) Exacto: siempre tiene prioridad.
    exact_regions = {}
    for region_name, region in resultados:
        if normalizar(region_name.name) == objetivo:
            exact_regions[region.id] = region_name.name

    if len(exact_regions) == 1:
        region_id, matched_name = next(iter(exact_regions.items()))
        db.close()
        return {"region_id": region_id, "name": matched_name}

    # 2) Parcial: todas las palabras escritas deben encajar.
    partial_regions = {}
    for region_name, region in resultados:
        if _tokens_match(objetivo, region_name.name):
            partial_regions[region.id] = region_name.name

    # Solo aceptamos el parcial cuando identifica un único país.
    if len(partial_regions) == 1:
        region_id, matched_name = next(iter(partial_regions.items()))
        db.close()
        return {"region_id": region_id, "name": matched_name}

    db.close()
    return None


def service_listar_regiones_con_nombres(nombre_pais: str):
    """Para que el frontend cargue el tablero: todas las regiones + sus nombres válidos."""
    db = SessionLocal()

    regiones = (
        db.query(Region)
        .join(Country, Region.country_id == Country.id)
        .filter(Country.nombre == nombre_pais)
        .all()
    )

    resultado = [
        {
            "region_id": r.id,
            "names": [rn.name for rn in r.names],
        }
        for r in regiones
    ]

    db.close()
    return resultado
