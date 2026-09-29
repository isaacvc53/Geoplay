import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

load_dotenv()


def _build_database_url():
    """Prioridad: DATABASE_URL completa (desarrollo local) o, si no existe,
    las piezas POSTGRES_* (Docker). Construir la URL por piezas evita que una
    contraseña con @, / o # rompa la cadena de conexión."""
    url = os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    database = os.getenv("POSTGRES_DB")
    if not (user and password and database):
        raise RuntimeError(
            "Falta la configuración de la base de datos: define DATABASE_URL "
            "o POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB."
        )

    return URL.create(
        "postgresql+psycopg2",
        username=user,
        password=password,
        host=os.getenv("POSTGRES_HOST", "db"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        database=database,
    )


DATABASE_URL = _build_database_url()

_engine_kwargs = {"pool_pre_ping": True}
if str(DATABASE_URL).startswith("postgresql"):
    _engine_kwargs.update(
        pool_recycle=1800,
        connect_args={"connect_timeout": 10},
    )

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    """Dependencia de FastAPI: una sesión por petición, siempre cerrada."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
