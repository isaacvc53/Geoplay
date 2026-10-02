from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from models.match import (
    GuessIn,
    GuessOut,
    MatchAnswers,
    MatchCreate,
    MatchHistory,
    MatchOut,
    MyMatches,
    PlayableCountry,
    QueueStatus,
    RivalProgress,
)
from models.user_db import User
from routes.auth import get_current_user, get_db
from services import friends_service, match_service, matchmaking_service

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
    """Invita a un amigo a una partida 1 contra 1. Con `country_id` eliges el país;
    sin él se sortea al azar cuando tu amigo acepta."""
    with errores_de_partida():
        m = match_service.create_match(
            db,
            usuario_actual,
            datos.username,
            datos.duration_seconds,
            datos.country_id,
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


# ---- Cola general (buscar rival entre desconocidos). Van ANTES que /{match_id}.
@matches_router.post("/queue", response_model=QueueStatus)
def entrar_en_la_cola(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Busco rival: duración (1 a 5 min) y país se sortean al formarse la pareja. Si ya
    hay alguien esperando, la partida se crea en el acto (`match` en la respuesta)."""
    with errores_de_partida():
        return matchmaking_service.join_queue(db, usuario_actual)


@matches_router.get("/queue", response_model=QueueStatus)
def estado_de_la_cola(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mi estado en la cola. Pensada para consultarse cada ~2 s mientras se busca: renueva
    mi latido e intenta emparejarme."""
    with errores_de_partida():
        return matchmaking_service.queue_status(db, usuario_actual)


@matches_router.post("/queue/leave", response_model=QueueStatus)
def salir_de_la_cola(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dejo de buscar (idempotente)."""
    with errores_de_partida():
        return matchmaking_service.leave_queue(db, usuario_actual)


@matches_router.get("/countries", response_model=list[PlayableCountry])
def paises_jugables(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Países entre los que se puede elegir al retar (con regiones y mapa)."""
    return match_service.list_playable_countries(db)


@matches_router.get("/history", response_model=MatchHistory)
def historial_de_partidas(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mis partidas terminadas, de la más reciente a la más antigua, con mi balance
    de victorias/derrotas/empates. Paginado con limit/offset."""
    return match_service.get_history(db, usuario_actual, limit, offset)


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


@matches_router.post("/{match_id}/start", response_model=MatchOut)
def empezar_partida(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cualquiera de los dos jugadores empieza: cuenta atrás de 3 s y a jugar.
    Es idempotente: si ya está en marcha devuelve la partida tal cual."""
    with errores_de_partida():
        m = match_service.start_match(db, usuario_actual, match_id)
        return match_service.serialize(db, m, usuario_actual)


@matches_router.post("/{match_id}/guess", response_model=GuessOut)
def intentar_region(
    match_id: int,
    datos: GuessIn,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Comprueba un nombre. El servidor decide si es acierto y cuenta el punto."""
    with errores_de_partida():
        return match_service.submit_guess(db, usuario_actual, match_id, datos.text)


@matches_router.get("/{match_id}/answers", response_model=MatchAnswers)
def mis_aciertos(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with errores_de_partida():
        return match_service.get_answers(db, usuario_actual, match_id)


@matches_router.get("/{match_id}/rival", response_model=RivalProgress)
def progreso_del_rival(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ids de las regiones que el rival lleva acertadas (sin nombres), para ver su mapa
    en directo. Vacío mientras la partida no ha empezado."""
    with errores_de_partida():
        return match_service.get_rival_progress(db, usuario_actual, match_id)


@matches_router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_partida(
    match_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancela la invitación, abandona la sala o abandona la partida en marcha
    (en ese caso gana el rival)."""
    with errores_de_partida():
        match_service.cancel_match(db, usuario_actual, match_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
