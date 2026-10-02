"""Cola general de emparejamiento: buscar rival entre desconocidos.

No hay un proceso aparte que empareje: lo hace cada petición. Al entrar en la cola (y cada vez
que el navegador consulta su estado, cada pocos segundos) el servidor mira si hay alguien más
esperando; si lo hay, crea la partida y saca a los dos de la cola. Así dos personas que entren
a la vez también acaban emparejadas en la siguiente consulta, sin carreras.

La partida resultante es una partida normal (misma sala, mismo reloj del servidor, mismo
historial) en estado "ready", con duración y país sorteados. Quien esperaba desde antes
figura como anfitrión.
"""

import random
from datetime import timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.match import QUEUE_DURATIONS
from models.match_db import STATUS_READY, Match
from models.matchmaking_db import MatchQueueEntry
from models.user_db import User
from models.utc import now_utc_naive
from services import match_service
from services.match_service import MatchError

# Quien lleva más de esto sin consultar su estado se da por ido. El navegador consulta cada
# 2 s; el margen cubre un par de peticiones perdidas, pero no una pestaña olvidada.
QUEUE_STALE = timedelta(seconds=10)

# Cuántos candidatos se miran como máximo al emparejar (la cola es corta; esto solo acota).
_CANDIDATES = 20


def _purge_stale(db: Session, now) -> None:
    db.query(MatchQueueEntry).filter(MatchQueueEntry.last_seen < now - QUEUE_STALE).delete(
        synchronize_session=False
    )


def _my_entry(db: Session, user_id: int, *, lock: bool = False) -> MatchQueueEntry | None:
    q = db.query(MatchQueueEntry).filter(MatchQueueEntry.user_id == user_id)
    if lock:
        # skip_locked: si otra petición está emparejándome ahora mismo, no espero ni la
        # pisó: la siguiente consulta ya verá la partida. (SQLite, en los tests, lo ignora.)
        q = q.with_for_update(skip_locked=True).populate_existing()
    return q.first()


def _status(db: Session, me: User, entry: MatchQueueEntry | None, match: Match | None, now) -> dict:
    if match is not None:
        return {
            "searching": False,
            "waited_seconds": 0,
            "match": match_service.serialize(db, match, me),
        }
    if entry is None:
        return {"searching": False, "waited_seconds": 0, "match": None}
    return {
        "searching": True,
        "waited_seconds": max(0, int((now - entry.joined_at).total_seconds())),
        "match": None,
    }


def _try_pair(db: Session, me: User, entry: MatchQueueEntry, now) -> Match | None:
    """Intenta emparejarme con el que lleve más tiempo esperando. Devuelve la partida
    creada, o None si no hay nadie disponible (sigo en la cola)."""
    mine = _my_entry(db, me.id, lock=True)
    if mine is None:
        return None  # otra petición me está emparejando o ya me sacó de la cola

    candidates = (
        db.query(MatchQueueEntry)
        .filter(
            MatchQueueEntry.user_id != me.id,
            MatchQueueEntry.last_seen >= now - QUEUE_STALE,
        )
        .order_by(MatchQueueEntry.joined_at, MatchQueueEntry.id)
        .with_for_update(skip_locked=True)
        .populate_existing()
        .limit(_CANDIDATES)
        .all()
    )

    for other in candidates:
        # Pudo abrir otra partida (un reto a un amigo) mientras esperaba: ya no está libre.
        if match_service._current_match(db, other.user_id) is not None:
            db.delete(other)
            continue

        country = match_service._pick_random_country(db)  # puede lanzar no_countries_available
        m = Match(
            host_id=other.user_id,  # el que esperaba desde antes
            guest_id=me.id,
            status=STATUS_READY,
            duration_seconds=random.choice(QUEUE_DURATIONS),
            country_id=country.id,
            country_chosen=False,  # sorteado: el frontend enseña la ruleta
            accepted_at=now,
        )
        db.add(m)
        db.delete(other)
        db.delete(mine)
        try:
            db.commit()
        except IntegrityError:
            # Carrera: alguno de los dos entró en otra partida justo ahora. No pasa nada:
            # sigo en la cola y la próxima consulta lo vuelve a intentar.
            db.rollback()
            return None
        db.refresh(m)
        return m

    db.commit()  # por si se borró algún candidato ocupado
    return None


# ---------------------------------------------------------------- operaciones


def join_queue(db: Session, me: User) -> dict:
    """Entro en la cola. Si ya había alguien esperando, la partida se crea en el acto.
    Es idempotente: si ya estaba en la cola solo se renueva el latido."""
    match_service._expire_stale(db)
    now = now_utc_naive()
    _purge_stale(db, now)

    if match_service._current_match(db, me.id) is not None:
        raise MatchError("already_in_match", "Ya tienes una partida abierta", 409)

    entry = _my_entry(db, me.id)
    if entry is None:
        entry = MatchQueueEntry(user_id=me.id, joined_at=now, last_seen=now)
        db.add(entry)
        try:
            db.commit()
        except IntegrityError:  # dos clics a la vez: la otra petición ya me apuntó
            db.rollback()
            entry = _my_entry(db, me.id)
    else:
        entry.last_seen = now
        db.commit()

    if entry is None:
        return _status(db, me, None, None, now)

    try:
        match = _try_pair(db, me, entry, now)
    except MatchError:
        # No hay países que sortear: mejor no dejar a nadie esperando para nada.
        db.rollback()
        leave_queue(db, me)
        raise
    return _status(db, me, _my_entry(db, me.id) if match is None else None, match, now)


def queue_status(db: Session, me: User) -> dict:
    """Mi estado en la cola. El navegador lo consulta cada ~2 s mientras busca: además de
    informar, renueva mi latido e intenta emparejarme (así también se emparejan dos
    jugadores que entraron a la vez)."""
    match_service._expire_stale(db)
    now = now_utc_naive()
    _purge_stale(db, now)

    current = match_service._current_match(db, me.id)
    if current is not None:
        # Ya me han emparejado (o tengo otra partida abierta): se acabó la búsqueda.
        db.query(MatchQueueEntry).filter(MatchQueueEntry.user_id == me.id).delete(
            synchronize_session=False
        )
        db.commit()
        return _status(db, me, None, current, now)

    entry = _my_entry(db, me.id)
    if entry is None:
        return _status(db, me, None, None, now)  # no estoy buscando (cancelé o caduqué)

    entry.last_seen = now
    db.commit()

    try:
        match = _try_pair(db, me, entry, now)
    except MatchError:
        db.rollback()
        leave_queue(db, me)
        raise
    return _status(db, me, _my_entry(db, me.id) if match is None else None, match, now)


def leave_queue(db: Session, me: User) -> dict:
    """Salgo de la cola (idempotente). Si justo antes de salir me emparejaron, la partida
    aparece en la respuesta para que el frontend no la pierda de vista."""
    now = now_utc_naive()
    db.query(MatchQueueEntry).filter(MatchQueueEntry.user_id == me.id).delete(
        synchronize_session=False
    )
    db.commit()
    current = match_service._current_match(db, me.id)
    return _status(db, me, None, current, now)
