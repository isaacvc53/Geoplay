from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.countries import country_router
from routes.regiones import region_router
from routes.auth import auth_router
from routes.progress import progress_router  # NUEVO


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # en producción, cambia esto por tu dominio real (ej. ["https://geoplay.com"])
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def inicio():
    return {"mensaje": "¡Bienvenido a Geoplay!"}


app.include_router(country_router)
app.include_router(region_router)
app.include_router(auth_router)
app.include_router(progress_router)  # NUEVO
