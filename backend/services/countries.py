from sqlalchemy import or_

from database.connection import SessionLocal
from models.country_db import Country
from utils.normalize import slugify


def service_conseguir_paises():
    with SessionLocal() as db:
        return db.query(Country).all()


def service_conseguir_pais(nombre_pais):
    # Acepta el nombre o el slug (el frontend trabaja con slugs).
    with SessionLocal() as db:
        return (
            db.query(Country)
            .filter(or_(Country.nombre == nombre_pais, Country.slug == nombre_pais))
            .first()
        )


def service_crear_pais(nuevo_pais):
    with SessionLocal() as db:
        pais = Country(
            nombre=nuevo_pais.nombre,
            slug=nuevo_pais.slug or slugify(nuevo_pais.nombre),
            capital=nuevo_pais.capital,
            continente=nuevo_pais.continente,
        )
        db.add(pais)
        db.commit()
        db.refresh(pais)
        return pais


def service_eliminar_pais(nombre_pais):
    with SessionLocal() as db:
        pais = db.query(Country).filter(Country.nombre == nombre_pais).first()
        if not pais:
            return None

        db.delete(pais)
        db.commit()
        return {"mensaje": "País eliminado"}


def service_modificar_pais(nombre_pais, datos_nuevos):
    with SessionLocal() as db:
        pais = db.query(Country).filter(Country.nombre == nombre_pais).first()
        if not pais:
            return None

        pais.nombre = datos_nuevos.nombre
        pais.capital = datos_nuevos.capital
        pais.continente = datos_nuevos.continente
        if datos_nuevos.slug:
            pais.slug = datos_nuevos.slug
        db.commit()
        db.refresh(pais)
        return pais
