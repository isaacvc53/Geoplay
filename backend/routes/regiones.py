from fastapi import APIRouter, HTTPException
from models.region import model_region
from services.regiones import (
    service_conseguir_regions,
    service_crear_region,
    service_modificar_region,
    service_eliminar_region
)


region_router = APIRouter()


@region_router.get("/countries/{nombre_pais}/regiones")
def conseguir_regions(nombre_pais):

    resultado = service_conseguir_regions(nombre_pais)

    if resultado:
        return resultado

    pais_no_encontrado()



@region_router.post("/regiones")
def crear_region(nueva_region: model_region):

    resultado = service_crear_region(nueva_region)

    if resultado:
        return resultado

    pais_no_encontrado()



@region_router.delete("/countries/{nombre_pais}/{nombre_region}")
def eliminar_region(nombre_pais,nombre_region):

    resultado = service_eliminar_region(nombre_pais,nombre_region)

    if resultado:
        return resultado

    pais_no_encontrado()




@region_router.put("/countries/{nombre_pais}/regions/{nombre_region}")
def modificar_region(nombre_pais, nombre_region, datos_nuevos: model_region):

    resultado = service_modificar_region(
        nombre_pais,
        nombre_region,
        datos_nuevos
    )

    if resultado:
        return resultado

    region_no_encontrada()

def pais_no_encontrado():
    raise HTTPException(
        status_code=404,
        detail="País o region no encontrada"
)