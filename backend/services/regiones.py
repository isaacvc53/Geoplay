from models.region_db import region
from models.country_db import Country
from database.connection import SessionLocal




def service_conseguir_regions(nombre_pais):
    db = SessionLocal()

    regions = (
        db.query(region)
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

    nueva_region_db = region(
        nombre=nueva_region.nombre,
        country_id=country_id
    )

    db.add(nueva_region_db)
    db.commit()
    db.refresh(nueva_region_db)

    db.close()

    return nueva_region_db
    



def service_eliminar_region(nombre_pais,nombre_region):

    db = SessionLocal()

    region = db.query(region).join(Country).filter(
    Country.nombre == nombre_pais,
    region.nombre == nombre_region
    ).first()

    
    if region:
        db.delete(region)
        db.commit()
        db.close()

        return {"mensaje": "region eliminada"}

    db.close()

def service_modificar_region(nombre_pais, nombre_region, datos_nuevos):
    db = SessionLocal()

    region_actual = db.query(region).join(Country).filter(
        Country.nombre == nombre_pais,
        region.nombre == nombre_region
    ).first()

    if region_actual:
        region_actual.nombre = datos_nuevos.nombre

        db.commit()
        db.refresh(region_actual)
        db.close()

        return region_actual

    db.close()