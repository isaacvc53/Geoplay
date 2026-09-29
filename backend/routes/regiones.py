from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from models.region import model_region
from models.region_name import region_name
from routes.auth import require_admin
from services.regiones import (
    service_conseguir_regions,
    service_crear_region,
    service_modificar_region,
    service_eliminar_region,
    service_comprobar_nombre,
    service_listar_regiones_con_nombres,
)
from services.region_name import service_crear_region_name


region_router = APIRouter()


# --- Lectura: pública (el juego la necesita sin sesión) ---

@region_router.get("/countries/{nombre_pais}/regions")
def conseguir_regions(nombre_pais: str):
    resultado = service_conseguir_regions(nombre_pais)
    if resultado:
        return resultado
    recurso_no_encontrado()


@region_router.get("/regions/check")
def comprobar_region(country: str, name: str):
    resultado = service_comprobar_nombre(country, name)
    if resultado:
        return {"encontrado": True, **resultado}
    return {"encontrado": False}


@region_router.get("/countries/{nombre_pais}/regions/names")
def listar_regiones_con_nombres(nombre_pais: str):
    resultado = service_listar_regiones_con_nombres(nombre_pais)
    if resultado:
        return resultado
    recurso_no_encontrado()


# --- Escritura: solo administradores (ADMIN_EMAILS) ---

@region_router.post("/regions", dependencies=[Depends(require_admin)])
def crear_region(nueva_region: model_region):
    resultado = service_crear_region(nueva_region)
    if resultado:
        return resultado
    recurso_no_encontrado()


@region_router.delete(
    "/countries/{nombre_pais}/regions/{nombre_region}",
    dependencies=[Depends(require_admin)],
)
def eliminar_region(nombre_pais: str, nombre_region: str):
    try:
        resultado = service_eliminar_region(nombre_pais, nombre_region)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="La región tiene partidas asociadas y no se puede borrar")

    if resultado:
        return resultado
    recurso_no_encontrado()


@region_router.put(
    "/countries/{nombre_pais}/regions/{nombre_region}",
    dependencies=[Depends(require_admin)],
)
def modificar_region(nombre_pais: str, nombre_region: str, datos_nuevos: model_region):
    resultado = service_modificar_region(nombre_pais, nombre_region, datos_nuevos)
    if resultado:
        return resultado
    recurso_no_encontrado()


@region_router.post("/regions/{region_id}/names", dependencies=[Depends(require_admin)])
def crear_region_name(region_id: int, nuevo_nombre: region_name):
    resultado = service_crear_region_name(region_id, nuevo_nombre)
    if resultado:
        return resultado
    recurso_no_encontrado()


def recurso_no_encontrado():
    raise HTTPException(status_code=404, detail="País o región no encontrada")
