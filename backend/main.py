import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar todos los modelos para que Base.metadata conozca todas las tablas
from models.base import Base
from models.country_db import Country  # noqa: F401
from models.region_db import Region  # noqa: F401
from models.region_name_db import RegionName
from models.user_db import User  # noqa: F401
from models.progress_db import GameSession, GameSessionAnswer  # noqa: F401
from models.friendship_db import Friendship  # noqa: F401

from database.connection import engine
from routes.countries import country_router
from routes.regiones import region_router
from routes.auth import auth_router
from routes.progress import progress_router
from routes.friends import friends_router
from routes.compare import compare_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea las tablas que falten (no toca las existentes). En una BD nueva de
    # Docker deja el esquema listo; en una BD ya poblada no hace nada.
    Base.metadata.create_all(engine)
    # create_all no añade índices a tablas ya existentes: este sí lo garantizamos.
    for index in RegionName.__table__.indexes:
        index.create(bind=engine, checkfirst=True)
    yield


# La documentación interactiva solo se activa con ENABLE_DOCS=1 (desarrollo).
_docs = os.getenv("ENABLE_DOCS", "0") == "1"
app = FastAPI(
    lifespan=lifespan,
    docs_url="/docs" if _docs else None,
    redoc_url="/redoc" if _docs else None,
    openapi_url="/openapi.json" if _docs else None,
)

# En producción el navegador habla con nginx en el mismo origen (/api), así que
# CORS solo hace falta en desarrollo (Vite en :5173). Configurable por entorno.
_origins = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/")
def inicio():
    return {"mensaje": "¡Bienvenido a Geoplay!"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(country_router)
app.include_router(region_router)
app.include_router(auth_router)
app.include_router(progress_router)
app.include_router(friends_router)
app.include_router(compare_router)
