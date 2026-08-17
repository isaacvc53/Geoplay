from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Pais(BaseModel):
    nombre: str
    capital: str
    continente: str


lista_paises = [
    {
        "nombre": "España",
        "capital": "Madrid",
        "continente": "Europa"
    },
    {
        "nombre": "Francia",
        "capital": "París",
        "continente": "Europa"
    }
]


@app.get("/")
def inicio():
    return {"mensaje": "¡Bienvenido a Geoplay!"}


@app.get("/countries")
def conseguir_paises():
    return lista_paises


@app.get("/countries/{nombre_pais}")
def conseguir_pais(nombre_pais):

    for pais in lista_paises:
        if pais["nombre"].lower() == nombre_pais.lower():
            return pais

    return {"error": "País no encontrado"}


@app.post("/countries")
def crear_pais(nuevo_pais: Pais):
    lista_paises.append(nuevo_pais.model_dump())
    return nuevo_pais


@app.delete("/countries/{nombre_pais}")
def eliminar_pais(nombre_pais):

    for pais in lista_paises:
        if pais["nombre"].lower() == nombre_pais.lower():
            lista_paises.remove(pais)
            return {"mensaje": "País eliminado"}

    return {"error": "País no encontrado"}

@app.put("/countries/{nombre_pais}")
def modificar_pais(nombre_pais, datos_nuevos : Pais):
    for pais in lista_paises:
        if pais["nombre"].lower() == nombre_pais.lower():
            pais["nombre"] = datos_nuevos.nombre
            pais["capital"] = datos_nuevos.capital
            pais["continente"] = datos_nuevos.continente

            return pais

    print("País no encontrado")