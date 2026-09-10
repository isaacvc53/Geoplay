from models.region_name_db import RegionName
from models.region_db import Region
from database.connection import SessionLocal


def service_crear_region_name(region_id, nuevo_nombre):

    db = SessionLocal()

    region_actual = db.query(Region).filter(
        Region.id == region_id
    ).first()

    if not region_actual:
        db.close()
        return None

    nuevo_region_name = RegionName(
        region_id=region_id,
        language=nuevo_nombre.language,
        name=nuevo_nombre.name
    )

    db.add(nuevo_region_name)
    db.commit()
    db.refresh(nuevo_region_name)

    db.close()

    return nuevo_region_name