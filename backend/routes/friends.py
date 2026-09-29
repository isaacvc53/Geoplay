from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from models.friend import FriendRequestCreate, FriendsOverview, RequestResult
from models.user_db import User
from routes.auth import get_current_user, get_db
from services import friends_service

friends_router = APIRouter(prefix="/friends", tags=["friends"])


@contextmanager
def errores_de_amigos():
    """Convierte los errores de negocio en respuestas HTTP con un código estable
    ({"detail": {"code": ..., "message": ...}}) para que el frontend los traduzca."""
    try:
        yield
    except friends_service.FriendsError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )


@friends_router.get("", response_model=FriendsOverview)
def listar_amigos(
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Amigos + solicitudes recibidas + solicitudes enviadas, en una sola llamada."""
    return friends_service.get_overview(db, usuario_actual)


@friends_router.get("/avatar/{user_id}")
def foto_de_amigo(
    user_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Foto de perfil de un amigo (o la propia). Solo los amigos aceptados la ven."""
    avatar = friends_service.get_visible_avatar(db, usuario_actual, user_id)
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


@friends_router.post(
    "/requests", response_model=RequestResult, status_code=status.HTTP_201_CREATED
)
def enviar_solicitud(
    datos: FriendRequestCreate,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with errores_de_amigos():
        f, destino, aceptada = friends_service.send_request(db, usuario_actual, datos.username)
    return RequestResult(
        status="accepted" if aceptada else "pending",
        friendship_id=f.id,
        username=destino.username,
    )


@friends_router.post("/requests/{friendship_id}/accept", response_model=RequestResult)
def aceptar_solicitud(
    friendship_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with errores_de_amigos():
        f, otro = friends_service.accept_request(db, usuario_actual, friendship_id)
    return RequestResult(status="accepted", friendship_id=f.id, username=otro.username)


@friends_router.delete("/requests/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
def rechazar_o_cancelar_solicitud(
    friendship_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rechaza una solicitud recibida o cancela una enviada."""
    with errores_de_amigos():
        friends_service.remove_request(db, usuario_actual, friendship_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@friends_router.delete("/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_amigo(
    friendship_id: int,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with errores_de_amigos():
        friends_service.remove_friend(db, usuario_actual, friendship_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
