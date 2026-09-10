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

    nueva_region_db = Region(
        country_id=country_id
    )

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
            RegionName.name == nombre_region
        )
        .first()
    )

    if region_actual:
        db.delete(region_actual)
        db.commit()
        db.close()

        return {"mensaje": "Región eliminada"}

    db.close()


def service_modificar_region(
    nombre_pais,
    nombre_region,
    datos_nuevos
):
    db = SessionLocal()

    region_actual = (
        db.query(Region)
        .join(Country)
        .join(Region.names)
        .filter(
            Country.nombre == nombre_pais,
            RegionName.name == nombre_region
        )
        .first()
    )

    if region_actual:
        # Aquí posteriormente modificaremos el RegionName
        db.commit()
        db.refresh(region_actual)
        db.close()

        return region_actual

    db.close()


def service_comprobar_nombre(nombre_pais: str, nombre_intentado: str):
    """Busca si nombre_intentado corresponde a alguna región del país dado."""
    db = SessionLocal()

    objetivo = normalizar(nombre_intentado)

    resultados = (
        db.query(RegionName, Region)
        .join(Region, RegionName.region_id == Region.id)
        .join(Country, Region.country_id == Country.id)
        .filter(Country.nombre == nombre_pais)
        .all()
    )

    encontrado = None
    for region_name, region in resultados:
        if normalizar(region_name.name) == objetivo:
            encontrado = {"region_id": region.id, "name": region_name.name}
            break

    db.close()

    return encontrado


def service_listar_regiones_con_nombres(nombre_pais: str):
    """Para que el frontend cargue el tablero: todas las regiones + sus nombres válidos."""
    db = SessionLocal()

    regiones = (
        db.query(Region)
        .join(Country, Region.country_id == Country.id)
        .filter(Country.nombre == nombre_pais)
        .all()
    )

    # importante: leer r.names AQUÍ, mientras la sesión sigue abierta
    # (si cerramos antes de acceder a la relación, SQLAlchemy lanza DetachedInstanceError)
    resultado = [
        {
            "region_id": r.id,
            "names": [rn.name for rn in r.names],
        }
        for r in regiones
    ]

    db.close()

    return resultado