from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.security import hash_password, verify_password
from models.user import UserCreate
from models.user_db import User, UserAvatar
from models.utc import now_utc_naive


class UsuarioDuplicado(Exception):
    """Email o username ya existentes (incluye la carrera entre dos registros simultáneos)."""


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    # Comparación sin distinguir mayúsculas: también encuentra cuentas antiguas
    # guardadas con mayúsculas.
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(func.lower(User.username) == username.strip().lower()).first()


def create_user(db: Session, user: UserCreate) -> User:
    nuevo_usuario = User(
        email=user.email,  # ya viene en minúsculas desde UserCreate
        username=user.username,
        hashed_password=hash_password(user.password),
    )
    db.add(nuevo_usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise UsuarioDuplicado()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    usuario = get_user_by_email(db, email)
    if not usuario:
        return None
    if not verify_password(password, usuario.hashed_password):
        return None
    if not usuario.is_active:
        return None
    return usuario


def get_avatar(db: Session, user_id: int) -> UserAvatar | None:
    return db.get(UserAvatar, user_id)


def set_avatar(db: Session, user: User, content_type: str, data: bytes) -> None:
    avatar = db.get(UserAvatar, user.id)
    if avatar is None:
        db.add(UserAvatar(user_id=user.id, content_type=content_type, data=data))
    else:
        avatar.content_type = content_type
        avatar.data = data
        avatar.updated_at = now_utc_naive()
    db.commit()


def delete_avatar(db: Session, user: User) -> None:
    avatar = db.get(UserAvatar, user.id)
    if avatar is not None:
        db.delete(avatar)
        db.commit()
