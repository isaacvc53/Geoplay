from datetime import datetime

from sqlalchemy import ForeignKey, Boolean, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"), index=True)

    total_regions: Mapped[int] = mapped_column(Integer)
    correct_regions: Mapped[int] = mapped_column(Integer)
    time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    played_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    answers: Mapped[list["GameSessionAnswer"]] = relationship()

    # Índice compuesto: cubre exactamente "WHERE user_id = ? ORDER BY played_at DESC",
    # que es el patrón de /progress/sessions/recent (el endpoint que tardaba 1.1s).
    __table_args__ = (
        Index("ix_game_sessions_user_played", "user_id", "played_at"),
    )


class GameSessionAnswer(Base):
    __tablename__ = "game_session_answers"

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(ForeignKey("game_sessions.id"), index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regiones.id"), index=True)

    correct: Mapped[bool] = mapped_column(Boolean)
