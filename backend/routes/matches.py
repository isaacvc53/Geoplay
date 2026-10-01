from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from models.match import MatchCreate, MatchOut, MyMatches
from models.user_db import User
from routes.auth import get_current_user, get_db
from services import friends_service, match_service

matches_router = APIRouter(prefix="/matches", tags=["matches"])


@contextmanager
def errores_de_partida():
    """Convierte los errores de negocio en respuestas HTTP con un código estable
    ({"detail": {"code": ..., "message": ...}}) para que el frontend los traduzca.
    También cubre los de amigos (p. ej. invitar a quien no es tu amigo)."""
    try:
        yield
    except (match_service.MatchError, friends_service.FriendsError) as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@matches_router.post("", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
def invitar_a_partida(
    datos: MatchCreate,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invita a un amigo a una partida 1 contra 1."""
    with errores_de_partida():
        m = match_service.create_match(
            db, usuario_actual, datos.username, datos.duration_seconds
        )
        return match_service.serialize(db, m, usuario_actual)


# Rutas fijas (/mine) ANTES que /{match_id}, para que no se interpreten como un id.
@matches_router.get("/mine", response_model=MyMatches)
def mis_partidas(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mi partida abierta + invitaciones recibidas. Pensada para consultarse
    cada pocos segundos desde el menú."""
    return match_service.get_mine(db, usuario_actual)


@matches_router.get("/{match_id}", response_model=MatchOut)
def ver_partida(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with errores_de_partida():
        m = match_service.get_match(db, usuario_actual, match_id)
        return match_service.serialize(db, m, usuario_actual)


@matches_router.post("/{match_id}/accept", response_model=MatchOut)
def aceptar_invitacion(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El invitado acepta: en este momento se sortea el país."""
    with errores_de_partida():
        m = match_service.accept_match(db, usuario_actual, match_id)
        return match_service.serialize(db, m, usuario_actual)


@matches_router.post("/{match_id}/decline", response_model=MatchOut)
def rechazar_invitacion(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with errores_de_partida():
        m = match_service.decline_match(db, usuario_actual, match_id)
        return match_service.serialize(db, m, usuario_actual)


@matches_router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_partida(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancela la invitación o abandona la partida antes de que empiece."""
    with errores_de_partida():
        match_service.cancel_match(db, usuario_actual, match_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
