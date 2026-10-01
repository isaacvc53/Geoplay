import json
import logging
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

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
    STATUS_FINISHED,
    STATUS_INVITED,
    STATUS_PLAYING,
    STATUS_READY,
    Match,
    MatchAnswer,
)
from models.region_db import Region
from models.region_name_db import RegionName
from models.user_db import User
from models.utc import now_utc_naive
from services import friends_service
from services.regiones import resolver_nombre

log = logging.getLogger(__name__)

# Una invitación sin responder caduca a los 10 minutos.
INVITE_TTL = timedelta(minutes=10)
# Una partida aceptada que nadie llega a empezar caduca a los 15 minutos
# (si no, los dos jugadores se quedarían bloqueados para siempre).
READY_TTL = timedelta(minutes=15)

# Un país solo puede salir sorteado si tiene al menos estas regiones: con menos
# la partida sería trivial. (Los países del quiz mundial no tienen regiones.)
MIN_REGIONS = 5

# Cuenta atrás entre pulsar "Start" y que empiece a correr el tiempo.
COUNTDOWN = timedelta(seconds=3)
# Margen para un acierto que sale justo antes de que acabe el tiempo y llega al
# servidor unos milisegundos tarde (latencia de red). La partida se cierra pasado
# este margen.
GRACE = timedelta(milliseconds=750)


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
    if _finish_due(db, now) or n:
        db.commit()


_KEEP = object()


def _finish(m: Match, when: datetime, *, winner_id=_KEEP) -> None:
    """Cierra una partida en marcha. Sin `winner_id` gana quien tenga más
    aciertos (None = empate); un abandono lo fija a mano."""
    m.status = STATUS_FINISHED
    m.finished_at = min(when, m.ends_at) if m.ends_at else when
    if winner_id is not _KEEP:
        m.winner_id = winner_id
    elif m.host_score > m.guest_score:
        m.winner_id = m.host_id
    elif m.guest_score > m.host_score:
        m.winner_id = m.guest_id
    else:
        m.winner_id = None


def _finish_due(db: Session, now: datetime) -> bool:
    """Cierra las partidas cuyo tiempo (más el margen) ya pasó. No hace falta que
    nadie esté mirando: se ejecuta al principio de cada operación, así que la
    primera petición posterior las cierra y libera a los jugadores."""
    due = (
        db.query(Match)
        .filter(Match.status == STATUS_PLAYING, Match.ends_at < now - GRACE)
        .all()
    )
    for m in due:
        _finish(m, m.ends_at)
    return bool(due)


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


# Países que el FRONTEND puede mostrar: los que tienen a la vez data/countries/<slug>.js
# y data/geo/<slug>.svg. Los lista /data/available-countries.json, que genera
# generate-manifest.sh en el build. El backend corre en otro contenedor, así que lo
# lee de donde esté montado el build del frontend (ver docker-compose.yml).
_MANIFEST_CACHE: dict = {"path": None, "mtime": None, "slugs": None}
_warned_no_manifest = False


def _manifest_path() -> Path | None:
    backend_dir = Path(__file__).resolve().parent.parent
    candidates = []
    if os.getenv("AVAILABLE_COUNTRIES_FILE"):
        candidates.append(Path(os.environ["AVAILABLE_COUNTRIES_FILE"]))
    candidates += [
        # Desarrollo en local (uvicorn desde backend/, con el repo completo al lado).
        backend_dir.parent / "frontend" / "public" / "data" / "available-countries.json",
        # Docker: el build del frontend montado en el contenedor del backend.
        Path("/frontend-dist/data/available-countries.json"),
    ]
    return next((c for c in candidates if c.is_file()), None)


def _available_slugs() -> set[str] | None:
    """Slugs con mapa en el frontend, o None si no se encuentra el manifiesto."""
    path = _manifest_path()
    if path is None:
        return None
    try:
        mtime = path.stat().st_mtime
        if _MANIFEST_CACHE["path"] == path and _MANIFEST_CACHE["mtime"] == mtime:
            return _MANIFEST_CACHE["slugs"]
        data = json.loads(path.read_text(encoding="utf-8"))
        slugs = {s for s in data if isinstance(s, str)}
    except (OSError, ValueError) as e:
        log.warning("No se pudo leer %s: %s", path, e)
        return None
    _MANIFEST_CACHE.update(path=path, mtime=mtime, slugs=slugs)
    return slugs


def _pick_random_country(db: Session) -> Country:
    """Sortea entre los países con suficientes regiones EN LA BD y que además
    tienen mapa en el frontend (si no, los jugadores verían un error al empezar)."""
    global _warned_no_manifest
    rows = (
        db.query(Country.id, Country.slug)
        .join(Region, Region.country_id == Country.id)
        .group_by(Country.id, Country.slug)
        .having(func.count(Region.id) >= MIN_REGIONS)
        .all()
    )
    slugs = _available_slugs()
    if slugs is None:
        if not _warned_no_manifest:
            log.warning(
                "No se encontró available-countries.json: se sortea entre todos los "
                "países con regiones, aunque alguno no tenga mapa en el frontend."
            )
            _warned_no_manifest = True
    else:
        rows = [r for r in rows if r.slug in slugs]
    if not rows:
        raise MatchError(
            "no_countries_available", "No hay países jugables para sortear", 503
        )
    return db.get(Country, random.choice(rows).id)


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

    end_reason = None
    if m.status == STATUS_FINISHED:
        total_regions = country["total_regions"] if country else 0
        if total_regions and max(m.host_score, m.guest_score) >= total_regions:
            end_reason = "completed"
        elif m.finished_at and m.ends_at and m.finished_at >= m.ends_at:
            end_reason = "time"
        else:
            end_reason = "forfeit"

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
        "finished_at": m.finished_at,
        "winner_id": m.winner_id,
        "end_reason": end_reason,
        "server_time": now_utc_naive(),
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
    abandonar una partida lista (si aún no la ha aceptado, equivale a rechazar).

    Con la partida ya en marcha:
      - durante la cuenta atrás (el tiempo aún no corre) se cancela sin más;
      - si el tiempo ya corre es un ABANDONO: la partida termina y gana el rival."""
    _expire_stale(db)
    m = _get_mine(db, me, match_id, lock=True)

    if m.status == STATUS_PLAYING:
        now = now_utc_naive()
        if m.started_at and now < m.started_at:
            m.status = STATUS_CANCELLED
        else:
            rival_id = m.guest_id if m.host_id == me.id else m.host_id
            _finish(m, now, winner_id=rival_id)
        db.commit()
        db.refresh(m)
        return m

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


def start_match(db: Session, me: User, match_id: int) -> Match:
    """Cualquiera de los dos pulsa "Start": empieza la cuenta atrás de 3 s y, al
    acabar, corre el tiempo elegido. El reloj lo fija el SERVIDOR (started_at /
    ends_at); los navegadores solo lo muestran."""
    _expire_stale(db)
    m = _get_mine(db, me, match_id, lock=True)

    if m.status == STATUS_PLAYING:
        return m  # doble clic, o el otro jugador pulsó a la vez: no pasa nada
    if m.status != STATUS_READY:
        raise MatchError("match_not_ready", "La partida no está lista para empezar", 409)

    now = now_utc_naive()
    m.status = STATUS_PLAYING
    m.started_at = now + COUNTDOWN
    m.ends_at = m.started_at + timedelta(seconds=m.duration_seconds)
    db.commit()
    db.refresh(m)
    return m


def submit_guess(db: Session, me: User, match_id: int, text: str) -> dict:
    """Valida un intento y, si es un acierto nuevo, lo cuenta. Todo se decide aquí:
    el navegador solo pregunta y pinta lo que el servidor confirma."""
    _expire_stale(db)  # cierra, si toca, las partidas cuyo tiempo ya pasó
    m = _get_mine(db, me, match_id, lock=True)
    now = now_utc_naive()

    if m.status != STATUS_PLAYING:
        raise MatchError("match_not_playing", "La partida no está en juego", 409)
    if now < m.started_at:
        raise MatchError("match_not_started", "El tiempo aún no ha empezado", 409)

    answered = {
        r
        for (r,) in db.query(MatchAnswer.region_id).filter(
            MatchAnswer.match_id == m.id, MatchAnswer.user_id == me.id
        )
    }
    names = (
        db.query(Region.id, RegionName.name)
        .join(RegionName, RegionName.region_id == Region.id)
        .filter(Region.country_id == m.country_id)
        .all()
    )
    found = resolver_nombre(names, text, ya_acertadas=answered)

    is_host = m.host_id == me.id

    def my_score() -> int:
        return m.host_score if is_host else m.guest_score

    if found is None:
        return {"result": "wrong", "score": my_score(), "status": m.status}

    region_id = found["region_id"]
    if region_id in answered:
        return {
            "result": "already",
            "region_id": region_id,
            "name": found["name"],
            "score": my_score(),
            "status": m.status,
        }

    db.add(MatchAnswer(match_id=m.id, user_id=me.id, region_id=region_id, answered_at=now))
    if is_host:
        m.host_score += 1
    else:
        m.guest_score += 1

    total = db.query(func.count(Region.id)).filter(Region.country_id == m.country_id).scalar()
    if total and my_score() >= total:
        _finish(m, now)  # mapa completo: la partida termina en el acto

    try:
        db.commit()
    except IntegrityError:
        # Dos peticiones a la vez con la misma región: la otra ya la contó.
        db.rollback()
        db.refresh(m)
        return {
            "result": "already",
            "region_id": region_id,
            "name": found["name"],
            "score": my_score(),
            "status": m.status,
        }
    db.refresh(m)
    return {
        "result": "correct",
        "region_id": region_id,
        "name": found["name"],
        "score": my_score(),
        "status": m.status,
    }


def get_answers(db: Session, me: User, match_id: int) -> dict:
    """Mis regiones acertadas (para recuperar el estado si recargo la página) y,
    solo cuando la partida terminó, las del rival."""
    m = get_match(db, me, match_id)

    def ids(user_id: int) -> list[int]:
        rows = (
            db.query(MatchAnswer.region_id)
            .filter(MatchAnswer.match_id == m.id, MatchAnswer.user_id == user_id)
            .order_by(MatchAnswer.answered_at, MatchAnswer.id)
            .all()
        )
        return [r for (r,) in rows]

    rival_id = m.guest_id if m.host_id == me.id else m.host_id
    return {
        "mine": ids(me.id),
        "opponent": ids(rival_id) if m.status == STATUS_FINISHED else None,
    }


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
