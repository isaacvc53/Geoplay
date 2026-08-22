from fastapi import APIRouter
from models.country import Pais
from data.countries import lista_paises
from database.connection import SessionLocal
from models.country_db import Country

router = APIRouter()

@router.get("/countries")
def conseguir_paises():
    db = SessionLocal()

    paises = db.query(Country).all()

    db.close()

    return paises


@router.get("/countries/{nombre_pais}")
def conseguir_pais(nombre_pais):
    db = SessionLocal()

    pais = db.query(Country).filter(Country.nombre == nombre_pais).first()

    db.close()
    if pais:
        return pais

    return {"error": "País no encontrado"}


@router.post("/countries")
def crear_pais(nuevo_pais: Pais):
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

@router.delete("/countries/{nombre_pais}")
def eliminar_pais(nombre_pais):

    db = SessionLocal()

    pais = db.query(Country).filter(Country.nombre == nombre_pais).first()

    if pais:
        db.delete(pais)
        db.commit()
        db.close()

        return {"mensaje": "País eliminado"}

    db.close()

    return {"error": "País no encontrado"}

@router.put("/countries/{nombre_pais}")
def modificar_pais(nombre_pais, datos_nuevos : Pais):
    db = SessionLocal()
    pais = db.query(Country).filter(Country.nombre == nombre_pais).first()


    if pais:
        pais.nombre = datos_nuevos.nombre
        pais.capital = datos_nuevos.capital
        pais.continente = datos_nuevos.continente

        db.commit()
        db.close()

        return pais

    return {"error": "País no encontrado"}