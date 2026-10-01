from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    false,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.country_db import Country
from models.user_db import User
from models.utc import now_utc_naive

# Ciclo de vida de una partida 1 contra 1:
#   invited  -> el anfitrión invitó a un amigo y espera respuesta (con el país
#               ya elegido por él, o sin país si va a ser al azar)
#   ready    -> el invitado aceptó; el país ya está fijado (elegido o sorteado)
#   playing  -> el anfitrión o el invitado pulsó "Start": cuenta atrás de 3 s y
#               luego el tiempo corre. started_at es el instante en que EMPIEZA
#               a contar el tiempo (ya incluye la cuenta atrás); ends_at es el final.
#   finished -> se acabó el tiempo, alguien completó el mapa o alguien abandonó
#   declined -> el invitado rechazó
#   cancelled-> alguien canceló antes de empezar
#   expired  -> la invitación caducó sin respuesta
STATUS_INVITED = "invited"
STATUS_READY = "ready"
STATUS_PLAYING = "playing"
STATUS_FINISHED = "finished"
STATUS_DECLINED = "declined"
STATUS_CANCELLED = "cancelled"
STATUS_EXPIRED = "expired"

ALL_STATUSES = (
    STATUS_INVITED,
    STATUS_READY,
    STATUS_PLAYING,
    STATUS_FINISHED,
    STATUS_DECLINED,
    STATUS_CANCELLED,
    STATUS_EXPIRED,
)

# "Abiertas": ocupan a los jugadores (nadie puede estar en dos a la vez).
OPEN_STATUSES = (STATUS_INVITED, STATUS_READY, STATUS_PLAYING)

_open_sql = "status IN ('invited', 'ready', 'playing')"
_in_game_sql = "status IN ('ready', 'playing')"


class Match(Base):
    """Una partida 1 contra 1: los dos juegan el mismo país y gana quien acierte
    más regiones antes de que se acabe el tiempo.

    OJO: el proyecto crea las tablas con create_all (sin migraciones), que no
    añade columnas a tablas ya existentes. Por eso esta tabla ya incluye desde
    el principio las columnas que usarán las partes siguientes (started_at,
    ends_at, puntuaciones, ganador): así no hará falta migrar nada después.
    """

    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)

    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    status: Mapped[str] = mapped_column(String(10), default=STATUS_INVITED, index=True)

    # Tiempo total de la partida (lo elige el anfitrión al invitar).
    duration_seconds: Mapped[int] = mapped_column(Integer)

    # Dos formas de tener país:
    #   - el anfitrión lo ELIGE al retar: country_id se rellena al crear la partida
    #     y country_chosen = True (el invitado ve el país ya en la invitación);
    #   - si no elige, se sortea al azar cuando el invitado acepta: hasta entonces
    #     es NULL y country_chosen = False.
    country_id: Mapped[int | None] = mapped_column(
        ForeignKey("countries.id"), nullable=True
    )
    # Sirve para que el frontend sepa si debe enseñar la ruleta del sorteo (solo
    # cuando fue al azar). OJO: columna añadida DESPUÉS de crear la tabla; create_all
    # no la añade a una BD ya existente, por eso main.py ejecuta un ALTER TABLE ...
    # ADD COLUMN IF NOT EXISTS al arrancar (solo en Postgres).
    country_chosen: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false()
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # --- Para las partes siguientes (se rellenan al jugar) ---
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    host_score: Mapped[int] = mapped_column(Integer, default=0)
    guest_score: Mapped[int] = mapped_column(Integer, default=0)
    # NULL con status 'finished' = empate.
    winner_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    host: Mapped[User] = relationship(foreign_keys=[host_id])
    guest: Mapped[User] = relationship(foreign_keys=[guest_id])
    country: Mapped[Country | None] = relationship()

    __table_args__ = (
        CheckConstraint("host_id <> guest_id", name="ck_match_distinct_players"),
        CheckConstraint(
            "status IN ("
            + ", ".join(f"'{s}'" for s in ALL_STATUSES)
            + ")",
            name="ck_match_status",
        ),
        # Red de seguridad contra carreras (dos clics a la vez): un usuario solo
        # puede ser anfitrión de UNA partida abierta, e invitado en UNA partida
        # ya aceptada/en juego. El servicio comprueba lo mismo antes y da un
        # error claro; esto garantiza que la BD nunca quede inconsistente.
        Index(
            "uq_match_open_host",
            "host_id",
            unique=True,
            postgresql_where=text(_open_sql),
            sqlite_where=text(_open_sql),
        ),
        Index(
            "uq_match_in_game_guest",
            "guest_id",
            unique=True,
            postgresql_where=text(_in_game_sql),
            sqlite_where=text(_in_game_sql),
        ),
    )


class MatchAnswer(Base):
    """Un acierto de un jugador en una partida. Es la ÚNICA fuente de verdad de la
    puntuación: el servidor valida cada nombre y solo entonces inserta la fila
    (host_score / guest_score en `matches` se actualizan a la vez).

    La restricción única impide contar dos veces la misma región al mismo jugador
    aunque lleguen dos peticiones a la vez. Es una tabla nueva: create_all la
    crea sola, sin migraciones.
    """

    __tablename__ = "match_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    region_id: Mapped[int] = mapped_column(ForeignKey("regiones.id"))
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive)

    __table_args__ = (
        UniqueConstraint("match_id", "user_id", "region_id", name="uq_match_answer_once"),
    )
