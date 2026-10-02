from typing import Literal

from pydantic import BaseModel, Field, field_validator

from models.utc import UtcDatetime

# Duraciones permitidas (segundos). El servicio las vuelve a comprobar.
# 0 = partida SIN tiempo: gana quien halle antes todas las regiones (ver UNTIMED_CAP
# en match_service: tope de seguridad para que nadie quede bloqueado para siempre).
ALLOWED_DURATIONS = (60, 120, 180, 300, 0)
UNTIMED = 0
DEFAULT_DURATION = 180


class MatchCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    duration_seconds: int = DEFAULT_DURATION
    # País elegido por el anfitrión. None = al azar (se sortea cuando el invitado
    # acepta). El servicio comprueba que sea un país jugable.
    country_id: int | None = None

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


class PlayableCountry(BaseModel):
    """Un país que se puede elegir para retar (tiene regiones suficientes y mapa)."""

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
    # None solo si va a ser al azar y el invitado aún no ha aceptado.
    country: MatchCountry | None = None
    # True si lo eligió el anfitrión; False si se sorteó (el frontend solo enseña
    # la ruleta en ese caso).
    country_chosen: bool = False
    created_at: UtcDatetime
    invite_expires_at: UtcDatetime | None = None  # solo mientras status == "invited"
    # Cuando status == "playing": started_at es el instante en que empieza a correr
    # el tiempo (la cuenta atrás de 3 s va ANTES) y ends_at el final. Los dos
    # navegadores los usan junto con server_time, nunca su propio reloj a pelo.
    started_at: UtcDatetime | None = None
    ends_at: UtcDatetime | None = None
    finished_at: UtcDatetime | None = None
    winner_id: int | None = None  # None con status "finished" = empate
    # Por qué terminó (solo con status == "finished"):
    #   "time" se acabó el tiempo, "completed" alguien halló todas las regiones,
    #   "forfeit" alguien abandonó con la partida en marcha (el otro gana).
    end_reason: Literal["time", "completed", "forfeit"] | None = None
    # Hora del servidor al responder: sirve para calcular cuánto se adelanta o
    # atrasa el reloj del navegador y que la cuenta atrás sea la misma para los dos.
    server_time: UtcDatetime


class MatchRecord(BaseModel):
    """Balance de partidas terminadas, visto desde mí."""

    wins: int = 0
    losses: int = 0
    draws: int = 0


class MatchHistoryItem(BaseModel):
    """Una partida terminada, vista desde mí (para la lista del historial)."""

    id: int
    result: Literal["win", "loss", "draw"]
    duration_seconds: int  # 0 = sin tiempo
    country: MatchCountry | None = None
    my_score: int
    opponent: MatchPlayer  # su `score` es el del rival
    started_at: UtcDatetime | None = None
    finished_at: UtcDatetime | None = None
    end_reason: Literal["time", "completed", "forfeit"] | None = None


class MatchHistory(BaseModel):
    items: list[MatchHistoryItem]  # de la más reciente a la más antigua
    total: int  # partidas terminadas en total (para saber si hay más páginas)
    record: MatchRecord


class MyMatches(BaseModel):
    # La partida abierta en la que estoy (invitando, lista o en juego), si hay.
    current: MatchOut | None = None
    # Invitaciones que me han hecho y aún no he respondido.
    invitations: list[MatchOut]


class GuessIn(BaseModel):
    text: str = Field(min_length=1, max_length=100)


class GuessOut(BaseModel):
    # correct  -> región nueva: suma un punto
    # already  -> es una región válida, pero tú ya la tenías
    # wrong    -> no coincide con ninguna región (o es ambiguo)
    result: Literal["correct", "already", "wrong"]
    region_id: int | None = None
    name: str | None = None  # el nombre con el que está guardada la región
    score: int  # tu puntuación tras este intento
    status: str  # estado de la partida tras el intento ("finished" si acabó con él)


class MatchAnswers(BaseModel):
    # Las regiones que he acertado (sirve para recuperar el estado al recargar).
    mine: list[int]
    # Las del rival: solo se revelan cuando la partida ha terminado.
    opponent: list[int] | None = None


class RivalProgress(BaseModel):
    # Las regiones que el rival lleva acertadas, para dibujar SU mapa en directo.
    # Solo ids (nunca nombres) y solo con la partida en marcha o terminada.
    region_ids: list[int]
