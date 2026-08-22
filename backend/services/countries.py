from models.country_db import Country
from database.connection import SessionLocal
from models.country_db import Country

def service_conseguir_paises():
    db = SessionLocal()

    paises = db.query(Country).all()

    db.close()

    return paises

def service_conseguir_pais(nombre_pais):
    db = SessionLocal()

    pais = db.query(Country).filter(Country.nombre == nombre_pais).first()

    db.close()

    return pais

def service_crear_pais(nuevo_pais):
    db = SessionLocal()

    pais = Country(
        nombre=nuevo_pais.nombre,
        capital=nuevo_pais.capital,
        continente=nuevo_pais.continente
    )

    db.add(pais)
    db.commit()
    db.refresh(pais)

    db.close()

    return pais

def service_eliminar_pais(nombre_pais):

    db = SessionLocal()

    pais = db.query(Country).filter(Country.nombre == nombre_pais).first()

    if pais:
        db.delete(pais)
        db.commit()
        db.close()

        return {"mensaje": "País eliminado"}

    db.close()

def service_modificar_pais(nombre_pais, datos_nuevos ):
    db = SessionLocal()
    pais = db.query(Country).filter(Country.nombre == nombre_pais).first()


    if pais:
        pais.nombre = datos_nuevos.nombre
        pais.capital = datos_nuevos.capital
        pais.continente = datos_nuevos.continente

        db.commit()
        db.close()

        return pais