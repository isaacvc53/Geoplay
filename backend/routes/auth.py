import os

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core.security import create_access_token, decode_access_token
from database.connection import get_db
from models.user import UserCreate, UserOut, Token
from models.user_db import User
from services import auth_service

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# apunta al endpoint de login para que /docs sepa dónde pedir el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# La foto llega ya recortada (256x256) desde el navegador; este tope es solo una
# red de seguridad. nginx limita el cuerpo a 1 MB.
MAX_AVATAR_BYTES = 512 * 1024


def _detect_image_type(data: bytes) -> str | None:
    """Tipo real según los primeros bytes (no nos fiamos del nombre ni del
    Content-Type del cliente). Solo formatos raster: nada de SVG (puede llevar JS)."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


# Emails con permisos de administración (crear/editar/borrar países y regiones),
# separados por comas en la variable de entorno ADMIN_EMAILS.
ADMIN_EMAILS = {
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
}


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

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise credenciales_invalidas

    usuario = auth_service.get_user_by_id(db, user_id)
    if usuario is None or not usuario.is_active:
        raise credenciales_invalidas

    return usuario


def require_admin(usuario: User = Depends(get_current_user)) -> User:
    if usuario.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    return usuario


@auth_router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UserCreate, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, datos.email):
        raise HTTPException(status_code=400, detail="Ese email ya está registrado")
    if auth_service.get_user_by_username(db, datos.username):
        raise HTTPException(status_code=400, detail="Ese nombre de usuario ya existe")

    try:
        return auth_service.create_user(db, datos)
    except auth_service.UsuarioDuplicado:
        raise HTTPException(status_code=400, detail="Ese email o nombre de usuario ya existe")


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

    # El "sub" del token es el id del usuario (inmutable), no el email.
    access_token = create_access_token(data={"sub": str(usuario.id)})
    return Token(access_token=access_token)


@auth_router.get("/me", response_model=UserOut)
def perfil_actual(usuario_actual: User = Depends(get_current_user)):
    return usuario_actual


@auth_router.put("/me/avatar", response_model=UserOut)
def subir_foto(
    archivo: UploadFile = File(...),
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = archivo.file.read(MAX_AVATAR_BYTES + 1)
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "avatar_too_large", "message": "La imagen es demasiado grande"},
        )
    tipo = _detect_image_type(data)
    if tipo is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "avatar_bad_type", "message": "Solo se admiten JPG, PNG o WebP"},
        )
    auth_service.set_avatar(db, usuario_actual, tipo, data)
    db.refresh(usuario_actual)
    return usuario_actual


@auth_router.get("/me/avatar")
def ver_foto(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    avatar = auth_service.get_avatar(db, usuario_actual.id)
    if avatar is None:
        raise HTTPException(status_code=404, detail="Sin foto de perfil")
    return Response(
        content=avatar.data,
        media_type=avatar.content_type,
        headers={
            "Cache-Control": "private, no-cache",
            "Content-Security-Policy": "default-src 'none'",
        },
    )


@auth_router.delete("/me/avatar", status_code=status.HTTP_204_NO_CONTENT)
def borrar_foto(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.delete_avatar(db, usuario_actual)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
