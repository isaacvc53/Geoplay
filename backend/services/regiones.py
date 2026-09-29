from sqlalchemy.orm import selectinload

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName
from utils.normalize import normalizar
# NOTA: este archivo es services/regiones.py (el service), no confundir con
# routes/regiones.py (el router), que tiene el mismo nombre de fichero.


def service_conseguir_regions(nombre_pais):
    with SessionLocal() as db:
        return (
            db.query(Region)
            .join(Country)
            .filter(Country.slug == nombre_pais)
            .all()
        )


def service_crear_region(nueva_region):
    with SessionLocal() as db:
        country_id = (
            db.query(Country.id)
            .filter(Country.slug == nueva_region.pais)
            .scalar()
        )
        if not country_id:
            return None

        nueva_region_db = Region(country_id=country_id)
        db.add(nueva_region_db)
        db.commit()
        db.refresh(nueva_region_db)
        return nueva_region_db


def _buscar_region(db, nombre_pais, nombre_region):
    return (
        db.query(Region)
        .join(Country)
        .join(Region.names)
        .filter(
            Country.slug == nombre_pais,
            RegionName.name == nombre_region,
        )
        .first()
    )


def service_eliminar_region(nombre_pais, nombre_region):
    with SessionLocal() as db:
        region_actual = _buscar_region(db, nombre_pais, nombre_region)
        if not region_actual:
            return None

        db.delete(region_actual)
        db.commit()
        return {"mensaje": "Región eliminada"}


def service_modificar_region(nombre_pais, nombre_region, datos_nuevos):
    """Mueve la región al país indicado en datos_nuevos.pais (slug).
    (Antes este método no modificaba nada.)"""
    with SessionLocal() as db:
        region_actual = _buscar_region(db, nombre_pais, nombre_region)
        if not region_actual:
            return None

        nuevo_country_id = (
            db.query(Country.id).filter(Country.slug == datos_nuevos.pais).scalar()
        )
        if not nuevo_country_id:
            return None

        region_actual.country_id = nuevo_country_id
        db.commit()
        db.refresh(region_actual)
        return region_actual


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
    objetivo = normalizar(nombre_intentado)
    if not objetivo:
        return None

    with SessionLocal() as db:
        resultados = (
            db.query(RegionName, Region)
            .join(Region, RegionName.region_id == Region.id)
            .join(Country, Region.country_id == Country.id)
            .filter(Country.slug == nombre_pais)
            .all()
        )

    # 1) Exacto: siempre tiene prioridad.
    exact_regions = {}
    for region_name, region in resultados:
        if normalizar(region_name.name) == objetivo:
            exact_regions[region.id] = region_name.name

    if len(exact_regions) == 1:
        region_id, matched_name = next(iter(exact_regions.items()))
        return {"region_id": region_id, "name": matched_name}

    # 2) Parcial: todas las palabras escritas deben encajar.
    partial_regions = {}
    for region_name, region in resultados:
        if _tokens_match(objetivo, region_name.name):
            partial_regions[region.id] = region_name.name

    # Solo aceptamos el parcial cuando identifica una única región.
    if len(partial_regions) == 1:
        region_id, matched_name = next(iter(partial_regions.items()))
        return {"region_id": region_id, "name": matched_name}

    return None


def service_listar_regiones_con_nombres(nombre_pais: str):
    """Para que el frontend cargue el tablero: todas las regiones + sus nombres válidos.

    selectinload(Region.names) trae los nombres en UNA query aparte (2 en total)
    en vez de una query de lazy-load por región (N+1).
    """
    with SessionLocal() as db:
        regiones = (
            db.query(Region)
            .options(selectinload(Region.names))
            .join(Country, Region.country_id == Country.id)
            .filter(Country.slug == nombre_pais)
            .all()
        )

        return [
            {
                "region_id": r.id,
                "names": [rn.name for rn in r.names],
            }
            for r in regiones
        ]
