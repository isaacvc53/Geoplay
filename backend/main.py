from fastapi import FastAPI
from routes.countries import country_router
from routes.regiones import region_router


app = FastAPI()


@app.get("/")
def inicio():
    return {"mensaje": "¡Bienvenido a Geoplay!"}


app.include_router(country_router)
app.include_router(region_router)