from fastapi import APIRouter, HTTPException
from models.pais_repuesta import PaisRespuesta
from models.country import Pais
from services.countries import (
    service_conseguir_paises,
    service_conseguir_pais,
    service_crear_pais,
    service_modificar_pais,
    service_eliminar_pais,
)


router = APIRouter()



@router.get("/countries", response_model=list[PaisRespuesta])
def   conseguir_paises():

    return service_conseguir_paises()


@router.get("/countries/{nombre_pais}", response_model=PaisRespuesta)
def conseguir_pais(nombre_pais):

    pais = service_conseguir_pais(nombre_pais)

    if pais:
        return pais

    raise HTTPException(
        status_code=404,
        detail="País no encontrado"
    )



@router.post("/countries")
def crear_pais(nuevo_pais: Pais):

    return service_crear_pais(nuevo_pais)




@router.delete("/countries/{nombre_pais}")
def eliminar_pais(nombre_pais):

    resultado = service_eliminar_pais(nombre_pais)

    if resultado:
        return resultado

    raise HTTPException(
        status_code=404,
        detail="País no encontrado"
)




@router.put("/countries/{nombre_pais}")
def modificar_pais(nombre_pais, datos_nuevos : Pais):

    resultado = service_modificar_pais(nombre_pais,datos_nuevos)

    if resultado:
        return resultado
    
    raise HTTPException(
        status_code=404,
        detail="País no encontrado"
)