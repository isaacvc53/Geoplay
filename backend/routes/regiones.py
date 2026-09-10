from fastapi import APIRouter, HTTPException

from models.region import model_region
from models.region_name import region_name

from services.regiones import (
    service_conseguir_regions,
    service_crear_region,
    service_modificar_region,
    service_eliminar_region,
    service_comprobar_nombre,
    service_listar_regiones_con_nombres
)

from services.region_name import service_crear_region_name


region_router = APIRouter()


@region_router.get("/countries/{nombre_pais}/regions")
def conseguir_regions(nombre_pais):

    resultado = service_conseguir_regions(nombre_pais)

    if resultado:
        return resultado

    recurso_no_encontrado()


@region_router.post("/regions")
def crear_region(nueva_region: model_region):

    resultado = service_crear_region(nueva_region)

    if resultado:
        return resultado

    recurso_no_encontrado()


@region_router.delete("/countries/{nombre_pais}/regions/{nombre_region}")
def eliminar_region(nombre_pais, nombre_region):

    resultado = service_eliminar_region(
        nombre_pais,
        nombre_region
    )

    if resultado:
        return resultado

    recurso_no_encontrado()


@region_router.put("/countries/{nombre_pais}/regions/{nombre_region}")
def modificar_region(
    nombre_pais,
    nombre_region,
    datos_nuevos: model_region
):

    resultado = service_modificar_region(
        nombre_pais,
        nombre_region,
        datos_nuevos
    )

    if resultado:
        return resultado

    recurso_no_encontrado()


@region_router.post("/regions/{region_id}/names")
def crear_region_name(
    region_id: int,
    nuevo_nombre: region_name
):

    resultado = service_crear_region_name(
        region_id,
        nuevo_nombre
    )

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
def listar_regiones_con_nombres(nombre_pais):

    resultado = service_listar_regiones_con_nombres(nombre_pais)

    if resultado:
        return resultado

    recurso_no_encontrado()


def recurso_no_encontrado():

    raise HTTPException(
        status_code=404,
        detail="País o región no encontrada"
    )