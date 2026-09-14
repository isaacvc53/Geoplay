from sqlalchemy.orm import Session

from core.security import hash_password, verify_password
from models.user import UserCreate
from models.user_db import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user: UserCreate) -> User:
    nuevo_usuario = User(
        email=user.email,
        username=user.username,
        hashed_password=hash_password(user.password),
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    usuario = get_user_by_email(db, email)
    if not usuario:
        return None
    if not verify_password(password, usuario.hashed_password):
        return None
    return usuario
