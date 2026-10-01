from typing import Literal

from pydantic import BaseModel, Field, field_validator

from models.utc import UtcDatetime

# Duraciones permitidas (segundos). El servicio las vuelve a comprobar.
ALLOWED_DURATIONS = (60, 120, 180, 300)
DEFAULT_DURATION = 180


class MatchCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    duration_seconds: int = DEFAULT_DURATION

    @field_validator("username")
    @classmethod
    def username_sin_espacios_extremos(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Escribe un nombre de usuario")
        return v


class MatchPlayer(BaseModel):
    user_id: int
    username: str
    avatar_updated_at: UtcDatetime | None = None  # None = sin foto
    score: int = 0


class MatchCountry(BaseModel):
    id: int
    slug: str
    nombre: str
    total_regions: int


class MatchOut(BaseModel):
    id: int
    status: Literal[
        "invited", "ready", "playing", "finished", "declined", "cancelled", "expired"
    ]
    my_role: Literal["host", "guest"]  # quién soy yo en esta partida
    duration_seconds: int
    host: MatchPlayer
    guest: MatchPlayer
    country: MatchCountry | None = None  # None hasta que el invitado acepta
    created_at: UtcDatetime
    invite_expires_at: UtcDatetime | None = None  # solo mientras status == "invited"
    started_at: UtcDatetime | None = None
    ends_at: UtcDatetime | None = None
    winner_id: int | None = None


class MyMatches(BaseModel):
    # La partida abierta en la que estoy (invitando, lista o en juego), si hay.
    current: MatchOut | None = None
    # Invitaciones que me han hecho y aún no he respondido.
    invitations: list[MatchOut]
