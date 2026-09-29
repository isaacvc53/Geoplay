from typing import Literal

from pydantic import BaseModel, Field, field_validator

from models.utc import UtcDatetime


class FriendRequestCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)

    @field_validator("username")
    @classmethod
    def username_sin_espacios_extremos(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Escribe un nombre de usuario")
        return v


class FriendOut(BaseModel):
    friendship_id: int  # id de la relación: sirve para eliminar al amigo
    user_id: int
    username: str
    since: UtcDatetime  # desde cuándo son amigos
    games_played: int
    countries_played: int
    accuracy: float | None = None  # % de acierto global (None si aún no ha jugado)
    last_played_at: UtcDatetime | None = None


class FriendRequestOut(BaseModel):
    friendship_id: int  # id de la solicitud: sirve para aceptar / rechazar / cancelar
    user_id: int  # el OTRO usuario (quien la envió, o a quien se la enviaste)
    username: str
    created_at: UtcDatetime


class FriendsOverview(BaseModel):
    friends: list[FriendOut]
    incoming: list[FriendRequestOut]  # solicitudes que te han enviado
    outgoing: list[FriendRequestOut]  # solicitudes que has enviado tú


class RequestResult(BaseModel):
    # "pending": solicitud enviada. "accepted": ya erais amigos porque el otro
    # usuario te había enviado una solicitud antes (se acepta sola).
    status: Literal["pending", "accepted"]
    friendship_id: int
    username: str
