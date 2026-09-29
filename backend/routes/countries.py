from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from models.country import Pais
from models.pais_repuesta import PaisRespuesta
from routes.auth import require_admin
from services.countries import (
    service_conseguir_paises,
    service_conseguir_pais,
    service_crear_pais,
    service_modificar_pais,
    service_eliminar_pais,
)


country_router = APIRouter()


# --- Lectura: pública ---

@country_router.get("/countries", response_model=list[PaisRespuesta])
def conseguir_paises():
    return service_conseguir_paises()


@country_router.get("/countries/{nombre_pais}", response_model=PaisRespuesta)
def conseguir_pais(nombre_pais: str):
    pais = service_conseguir_pais(nombre_pais)
    if pais:
        return pais
    pais_no_encontrado()


# --- Escritura: solo administradores (ADMIN_EMAILS) ---

@country_router.post("/countries", dependencies=[Depends(require_admin)])
def crear_pais(nuevo_pais: Pais):
    try:
        return service_crear_pais(nuevo_pais)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Ya existe un país con ese slug")


@country_router.delete("/countries/{nombre_pais}", dependencies=[Depends(require_admin)])
def eliminar_pais(nombre_pais: str):
    try:
        resultado = service_eliminar_pais(nombre_pais)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="El país tiene partidas asociadas y no se puede borrar")

    if resultado:
        return resultado
    pais_no_encontrado()


@country_router.put("/countries/{nombre_pais}", dependencies=[Depends(require_admin)])
def modificar_pais(nombre_pais: str, datos_nuevos: Pais):
    try:
        resultado = service_modificar_pais(nombre_pais, datos_nuevos)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Ya existe un país con ese slug")
    if resultado:
        return resultado
    pais_no_encontrado()


def pais_no_encontrado():
    raise HTTPException(status_code=404, detail="País no encontrado")
