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


country_router = APIRouter()



@country_router.get("/countries", response_model=list[PaisRespuesta])
def   conseguir_paises():

    return service_conseguir_paises()


@country_router.get("/countries/{nombre_pais}", response_model=PaisRespuesta)
def conseguir_pais(nombre_pais):

    pais = service_conseguir_pais(nombre_pais)

    if pais:
        return pais

    pais_no_encontrado()



@country_router.post("/countries")
def crear_pais(nuevo_pais: Pais):

    return service_crear_pais(nuevo_pais)




@country_router.delete("/countries/{nombre_pais}")
def eliminar_pais(nombre_pais):

    resultado = service_eliminar_pais(nombre_pais)

    if resultado:
        return resultado

    pais_no_encontrado()




@country_router.put("/countries/{nombre_pais}")
def modificar_pais(nombre_pais, datos_nuevos : Pais):

    resultado = service_modificar_pais(nombre_pais,datos_nuevos)

    if resultado:
        return resultado
    
    pais_no_encontrado()



def pais_no_encontrado():
    raise HTTPException(
        status_code=404,
        detail="País no encontrado"
)