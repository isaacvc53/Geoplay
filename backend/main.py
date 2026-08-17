from fastapi import FastAPI
from routes.countries import router


app = FastAPI()


@app.get("/")
def inicio():
    return {"mensaje": "¡Bienvenido a Geoplay!"}


app.include_router(router)