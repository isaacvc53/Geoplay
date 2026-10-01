import os

# Antes de importar la app: BD y clave de pruebas (nunca toca Postgres).
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "x" * 40)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main
from database.connection import get_db
from models.base import Base


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def client(db_session):
    def override():
        yield db_session

    main.app.dependency_overrides[get_db] = override
    # Sin "with": no se ejecuta el lifespan (que usa el engine real).
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def sin_manifiesto_de_paises(monkeypatch):
    """Los tests no deben depender del available-countries.json real del repo:
    por defecto se sortea entre todos los países con regiones. Los tests que
    prueban el filtro lo reemplazan con su propio monkeypatch."""
    from services import match_service

    monkeypatch.setattr(match_service, "_available_slugs", lambda: None)
