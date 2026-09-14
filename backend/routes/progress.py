from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from models.country_db import Country
from models.progress import (
    CountryProgressOut,
    GameSessionCreate,
    GameSessionOut,
    GameSessionSummaryOut,
)
from models.user_db import User
from routes.auth import get_current_user, get_db
from services import progress_service

progress_router = APIRouter(prefix="/progress", tags=["progress"])


@progress_router.post("/sessions", response_model=GameSessionOut, status_code=status.HTTP_201_CREATED)
def guardar_partida(
    datos: GameSessionCreate,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pais = db.query(Country).filter(Country.id == datos.country_id).first()
    if not pais:
        raise HTTPException(status_code=404, detail="País no encontrado")

    return progress_service.create_session(db, usuario_actual, datos)


# NUEVO: últimas partidas del jugador, más recientes primero. Va ANTES de
# "/countries/{country_id}" solo por orden de lectura del archivo; al tener
# prefijos distintos ("/sessions/..." vs "/countries/...") no hay conflicto
# de rutas entre ambas.
@progress_router.get("/sessions/recent", response_model=list[GameSessionSummaryOut])
def partidas_recientes(
    limit: int = Query(20, ge=1, le=100),
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return progress_service.get_recent_sessions(db, usuario_actual, limit=limit)


@progress_router.get("/countries", response_model=list[CountryProgressOut])
def progreso_por_pais(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return progress_service.get_all_countries_progress(db, usuario_actual)


@progress_router.get("/countries/{country_id}", response_model=CountryProgressOut)
def progreso_de_un_pais(
    country_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pais = db.query(Country).filter(Country.id == country_id).first()
    if not pais:
        raise HTTPException(status_code=404, detail="País no encontrado")

    return progress_service.get_country_progress(db, usuario_actual, pais)
