from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.friendship_db import STATUS_ACCEPTED, STATUS_PENDING, Friendship
from models.progress_db import GameSession
from models.user_db import User
from models.utc import now_utc_naive
from services import auth_service

# Tope de solicitudes enviadas sin responder: evita que una cuenta llene de
# solicitudes a medio mundo (rechazar borra la fila, así que se podría repetir).
MAX_PENDING_OUTGOING = 50


class FriendsError(Exception):
    """Error de negocio con un código estable que el frontend traduce a su
    idioma (los textos en español son solo para logs y depuración)."""

    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def _other_id(f: Friendship, me_id: int) -> int:
    return f.user_high_id if f.user_low_id == me_id else f.user_low_id


def _find_between(db: Session, a: int, b: int) -> Friendship | None:
    low, high = _pair(a, b)
    return (
        db.query(Friendship)
        .filter(Friendship.user_low_id == low, Friendship.user_high_id == high)
        .first()
    )


def _get_mine(db: Session, me: User, friendship_id: int) -> Friendship | None:
    """La relación solo existe para quien participa en ella: para cualquier otro
    usuario responde igual que si no existiera (no se filtra información)."""
    f = db.get(Friendship, friendship_id)
    if f is None or me.id not in (f.user_low_id, f.user_high_id):
        return None
    return f


def _accept(db: Session, f: Friendship) -> None:
    f.status = STATUS_ACCEPTED
    f.accepted_at = now_utc_naive()
    db.commit()
    db.refresh(f)


def _handle_existing(db: Session, me: User, existing: Friendship) -> tuple[Friendship, bool]:
    """Ya hay una fila entre los dos. Devuelve (relación, aceptada_automáticamente)
    o lanza el error que corresponda."""
    if existing.status == STATUS_ACCEPTED:
        raise FriendsError("already_friends", "Ya sois amigos", 409)
    if existing.requested_by_id == me.id:
        raise FriendsError("request_already_sent", "Ya le enviaste una solicitud", 409)
    # El otro usuario ya te había enviado una solicitud: al enviarle tú la
    # tuya, los dos queréis lo mismo, así que se acepta directamente.
    _accept(db, existing)
    return existing, True


def send_request(db: Session, me: User, username: str) -> tuple[Friendship, User, bool]:
    """Envía una solicitud por nombre de usuario.
    Devuelve (relación, usuario destino, aceptada_automáticamente)."""
    target = auth_service.get_user_by_username(db, username)
    if target is None or not target.is_active:
        raise FriendsError("user_not_found", "No existe ningún usuario con ese nombre", 404)
    if target.id == me.id:
        raise FriendsError("cannot_add_self", "No puedes añadirte a ti mismo", 400)

    existing = _find_between(db, me.id, target.id)
    if existing is not None:
        f, auto = _handle_existing(db, me, existing)
        return f, target, auto

    pendientes = (
        db.query(func.count(Friendship.id))
        .filter(Friendship.requested_by_id == me.id, Friendship.status == STATUS_PENDING)
        .scalar()
    )
    if pendientes >= MAX_PENDING_OUTGOING:
        raise FriendsError(
            "too_many_pending", "Tienes demasiadas solicitudes sin responder", 429
        )

    low, high = _pair(me.id, target.id)
    f = Friendship(
        user_low_id=low,
        user_high_id=high,
        requested_by_id=me.id,
        status=STATUS_PENDING,
    )
    db.add(f)
    try:
        db.commit()
    except IntegrityError:
        # Carrera: entre nuestra comprobación y el INSERT alguien creó la fila
        # de esta pareja (p. ej. el otro usuario enviándote la suya a la vez).
        db.rollback()
        existing = _find_between(db, me.id, target.id)
        if existing is None:
            raise FriendsError("try_again", "No se pudo completar, inténtalo de nuevo", 409)
        f, auto = _handle_existing(db, me, existing)
        return f, target, auto

    db.refresh(f)
    return f, target, False


def accept_request(db: Session, me: User, friendship_id: int) -> tuple[Friendship, User]:
    f = _get_mine(db, me, friendship_id)
    if f is None:
        raise FriendsError("request_not_found", "Solicitud no encontrada", 404)

    other = db.get(User, _other_id(f, me.id))
    if other is None or not other.is_active:
        raise FriendsError("request_not_found", "Solicitud no encontrada", 404)

    if f.status == STATUS_ACCEPTED:
        return f, other  # doble clic: no pasa nada
    if f.requested_by_id == me.id:
        raise FriendsError("cannot_accept_own", "No puedes aceptar tu propia solicitud", 403)

    _accept(db, f)
    return f, other


def remove_request(db: Session, me: User, friendship_id: int) -> None:
    """Rechazar (si te la enviaron) o cancelar (si la enviaste tú): en ambos
    casos se borra la solicitud pendiente."""
    f = _get_mine(db, me, friendship_id)
    if f is None or f.status != STATUS_PENDING:
        raise FriendsError("request_not_found", "Solicitud no encontrada", 404)
    db.delete(f)
    db.commit()


def remove_friend(db: Session, me: User, friendship_id: int) -> None:
    f = _get_mine(db, me, friendship_id)
    if f is None or f.status != STATUS_ACCEPTED:
        raise FriendsError("friend_not_found", "Amigo no encontrado", 404)
    db.delete(f)
    db.commit()


def get_overview(db: Session, me: User) -> dict:
    """Amigos, solicitudes recibidas y solicitudes enviadas, con las consultas
    justas (relaciones + usuarios + estadísticas), sin importar cuántos amigos haya."""
    relaciones = (
        db.query(Friendship)
        .filter(or_(Friendship.user_low_id == me.id, Friendship.user_high_id == me.id))
        .all()
    )
    if not relaciones:
        return {"friends": [], "incoming": [], "outgoing": []}

    otros_ids = {_other_id(f, me.id) for f in relaciones}
    usuarios = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(list(otros_ids)), User.is_active.is_(True))
    }

    amigos_ids = [
        _other_id(f, me.id)
        for f in relaciones
        if f.status == STATUS_ACCEPTED and _other_id(f, me.id) in usuarios
    ]
    stats: dict[int, tuple[int, int]] = {}
    if amigos_ids:
        filas = (
            db.query(
                GameSession.user_id,
                func.count(GameSession.id),
                func.count(func.distinct(GameSession.country_id)),
            )
            .filter(GameSession.user_id.in_(amigos_ids))
            .group_by(GameSession.user_id)
            .all()
        )
        stats = {uid: (partidas, paises) for uid, partidas, paises in filas}

    friends, incoming, outgoing = [], [], []
    for f in relaciones:
        uid = _other_id(f, me.id)
        u = usuarios.get(uid)
        if u is None:
            continue  # cuenta desactivada: se oculta
        if f.status == STATUS_ACCEPTED:
            partidas, paises = stats.get(uid, (0, 0))
            friends.append(
                {
                    "friendship_id": f.id,
                    "user_id": uid,
                    "username": u.username,
                    "since": f.accepted_at or f.created_at,
                    "games_played": partidas,
                    "countries_played": paises,
                }
            )
        else:
            item = {
                "friendship_id": f.id,
                "user_id": uid,
                "username": u.username,
                "created_at": f.created_at,
            }
            (outgoing if f.requested_by_id == me.id else incoming).append(item)

    friends.sort(key=lambda x: x["username"].lower())
    incoming.sort(key=lambda x: x["created_at"], reverse=True)
    outgoing.sort(key=lambda x: x["created_at"], reverse=True)
    return {"friends": friends, "incoming": incoming, "outgoing": outgoing}
