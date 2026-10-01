import random
from datetime import timedelta

from sqlalchemy import func, or_, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.country_db import Country
from models.match import ALLOWED_DURATIONS
from models.match_db import (
    OPEN_STATUSES,
    STATUS_CANCELLED,
    STATUS_DECLINED,
    STATUS_EXPIRED,
    STATUS_INVITED,
    STATUS_PLAYING,
    STATUS_READY,
    Match,
)
from models.region_db import Region
from models.user_db import User
from models.utc import now_utc_naive
from services import friends_service

# Una invitación sin responder caduca a los 10 minutos.
INVITE_TTL = timedelta(minutes=10)
# Una partida aceptada que nadie llega a empezar caduca a los 15 minutos
# (si no, los dos jugadores se quedarían bloqueados para siempre).
READY_TTL = timedelta(minutes=15)

# Un país solo puede salir sorteado si tiene al menos estas regiones: con menos
# la partida sería trivial. (Los países del quiz mundial no tienen regiones.)
MIN_REGIONS = 5


class MatchError(Exception):
    """Error de negocio con un código estable que el frontend traduce a su
    idioma (los textos en español son solo para logs y depuración)."""

    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


# ---------------------------------------------------------------- utilidades


def _expire_stale(db: Session) -> None:
    """Marca como caducadas las invitaciones / partidas listas que llevan
    demasiado tiempo sin avanzar. Se llama al principio de cada operación."""
    now = now_utc_naive()
    n = (
        db.query(Match)
        .filter(Match.status == STATUS_INVITED, Match.created_at < now - INVITE_TTL)
        .update({"status": STATUS_EXPIRED}, synchronize_session=False)
    )
    n += (
        db.query(Match)
        .filter(Match.status == STATUS_READY, Match.accepted_at < now - READY_TTL)
        .update({"status": STATUS_EXPIRED}, synchronize_session=False)
    )
    if n:
        db.commit()


def _current_match(db: Session, user_id: int) -> Match | None:
    """La partida que ahora mismo ocupa a este usuario, si hay alguna:
    - como anfitrión: invitando, lista o en juego;
    - como invitado: solo cuando ya aceptó (lista o en juego). Una simple
      invitación recibida no lo ocupa: puede tener varias a la vez."""
    return (
        db.query(Match)
        .filter(
            or_(
                and_(Match.host_id == user_id, Match.status.in_(OPEN_STATUSES)),
                and_(
                    Match.guest_id == user_id,
                    Match.status.in_((STATUS_READY, STATUS_PLAYING)),
                ),
            )
        )
        .first()
    )


def _get_mine(db: Session, me: User, match_id: int, *, lock: bool = False) -> Match:
    """La partida solo existe para sus dos participantes: para cualquier otro
    usuario responde igual que si no existiera (no se filtra información)."""
    q = db.query(Match).filter(Match.id == match_id)
    if lock:
        q = q.with_for_update()
    m = q.first()
    if m is None or me.id not in (m.host_id, m.guest_id):
        raise MatchError("match_not_found", "Partida no encontrada", 404)
    return m


def _pick_random_country(db: Session) -> Country:
    ids = [
        row[0]
        for row in db.query(Country.id)
        .join(Region, Region.country_id == Country.id)
        .group_by(Country.id)
        .having(func.count(Region.id) >= MIN_REGIONS)
        .all()
    ]
    if not ids:
        raise MatchError(
            "no_countries_available", "No hay países jugables para sortear", 503
        )
    return db.get(Country, random.choice(ids))


def serialize(db: Session, m: Match, me: User) -> dict:
    """Convierte la partida al formato de MatchOut, visto desde `me`."""
    country = None
    if m.country is not None:
        total = (
            db.query(func.count(Region.id))
            .filter(Region.country_id == m.country_id)
            .scalar()
        )
        country = {
            "id": m.country.id,
            "slug": m.country.slug,
            "nombre": m.country.nombre,
            "total_regions": total or 0,
        }

    def player(u: User, score: int) -> dict:
        return {
            "user_id": u.id,
            "username": u.username,
            "avatar_updated_at": u.avatar_updated_at,
            "score": score,
        }

    return {
        "id": m.id,
        "status": m.status,
        "my_role": "host" if m.host_id == me.id else "guest",
        "duration_seconds": m.duration_seconds,
        "host": player(m.host, m.host_score),
        "guest": player(m.guest, m.guest_score),
        "country": country,
        "created_at": m.created_at,
        "invite_expires_at": (
            m.created_at + INVITE_TTL if m.status == STATUS_INVITED else None
        ),
        "started_at": m.started_at,
        "ends_at": m.ends_at,
        "winner_id": m.winner_id,
    }


# ---------------------------------------------------------------- operaciones


def create_match(db: Session, me: User, username: str, duration: int) -> Match:
    _expire_stale(db)

    if duration not in ALLOWED_DURATIONS:
        raise MatchError("invalid_duration", "Duración no permitida", 400)

    # Solo se puede invitar a amigos aceptados (lanza FriendsError si no lo es).
    target = friends_service.get_friend_user(db, me, username)

    if _current_match(db, me.id) is not None:
        raise MatchError("already_in_match", "Ya tienes una partida abierta", 409)
    if _current_match(db, target.id) is not None:
        raise MatchError("friend_busy", "Tu amigo está en otra partida", 409)

    m = Match(host_id=me.id, guest_id=target.id, duration_seconds=duration)
    db.add(m)
    try:
        db.commit()
    except IntegrityError:
        # Carrera: otro clic creó una partida abierta entre la comprobación y el INSERT.
        db.rollback()
        raise MatchError("already_in_match", "Ya tienes una partida abierta", 409)
    db.refresh(m)
    return m


def accept_match(db: Session, me: User, match_id: int) -> Match:
    _expire_stale(db)
    m = _get_mine(db, me, match_id, lock=True)

    if m.guest_id != me.id:
        raise MatchError("not_invited", "Solo el invitado puede aceptar", 403)
    if m.status == STATUS_READY:
        return m  # doble clic: no pasa nada
    if m.status != STATUS_INVITED:
        raise MatchError("match_not_pending", "La invitación ya no está disponible", 409)
    if _current_match(db, me.id) is not None:
        raise MatchError("already_in_match", "Ya estás en otra partida", 409)

    m.country_id = _pick_random_country(db).id
    m.status = STATUS_READY
    m.accepted_at = now_utc_naive()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise MatchError("already_in_match", "Ya estás en otra partida", 409)
    db.refresh(m)
    return m


def decline_match(db: Session, me: User, match_id: int) -> Match:
    _expire_stale(db)
    m = _get_mine(db, me, match_id, lock=True)

    if m.guest_id != me.id:
        raise MatchError("not_invited", "Solo el invitado puede rechazar", 403)
    if m.status != STATUS_INVITED:
        raise MatchError("match_not_pending", "La invitación ya no está disponible", 409)

    m.status = STATUS_DECLINED
    db.commit()
    db.refresh(m)
    return m


def cancel_match(db: Session, me: User, match_id: int) -> Match:
    """El anfitrión cancela su invitación o su partida lista; el invitado puede
    abandonar una partida lista (si aún no la ha aceptado, equivale a rechazar)."""
    _expire_stale(db)
    m = _get_mine(db, me, match_id, lock=True)

    if m.status not in (STATUS_INVITED, STATUS_READY):
        raise MatchError(
            "match_not_cancellable", "Esta partida ya no se puede cancelar", 409
        )

    m.status = (
        STATUS_DECLINED
        if (m.guest_id == me.id and m.status == STATUS_INVITED)
        else STATUS_CANCELLED
    )
    db.commit()
    db.refresh(m)
    return m


def get_match(db: Session, me: User, match_id: int) -> Match:
    _expire_stale(db)
    return _get_mine(db, me, match_id)


def get_mine(db: Session, me: User) -> dict:
    """Mi partida abierta + las invitaciones pendientes, en una sola llamada
    (la pensada para consultar cada pocos segundos)."""
    _expire_stale(db)
    current = _current_match(db, me.id)
    invitations = (
        db.query(Match)
        .filter(Match.guest_id == me.id, Match.status == STATUS_INVITED)
        .order_by(Match.created_at.desc())
        .all()
    )
    return {
        "current": serialize(db, current, me) if current else None,
        "invitations": [serialize(db, m, me) for m in invitations],
    }
