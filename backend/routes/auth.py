from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from core.security import create_access_token, decode_access_token
from models.user import UserCreate, UserOut, Token
from models.user_db import User
from services import auth_service

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# apunta al endpoint de login para que /docs sepa dónde pedir el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credenciales_invalidas

    email: str | None = payload.get("sub")
    if email is None:
        raise credenciales_invalidas

    usuario = auth_service.get_user_by_email(db, email)
    if usuario is None:
        raise credenciales_invalidas

    return usuario


@auth_router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UserCreate, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, datos.email):
        raise HTTPException(status_code=400, detail="Ese email ya está registrado")
    if auth_service.get_user_by_username(db, datos.username):
        raise HTTPException(status_code=400, detail="Ese nombre de usuario ya existe")

    return auth_service.create_user(db, datos)


@auth_router.post("/login", response_model=Token)
def iniciar_sesion(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # OAuth2PasswordRequestForm usa "username", aquí lo tratamos como el email
    usuario = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": usuario.email})
    return Token(access_token=access_token)


@auth_router.get("/me", response_model=UserOut)
def perfil_actual(usuario_actual: User = Depends(get_current_user)):
    return usuario_actual
