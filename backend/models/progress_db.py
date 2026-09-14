from datetime import datetime

from sqlalchemy import ForeignKey, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"))

    total_regions: Mapped[int] = mapped_column(Integer)
    correct_regions: Mapped[int] = mapped_column(Integer)
    time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    played_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    answers: Mapped[list["GameSessionAnswer"]] = relationship()


class GameSessionAnswer(Base):
    __tablename__ = "game_session_answers"

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(ForeignKey("game_sessions.id"))
    region_id: Mapped[int] = mapped_column(ForeignKey("regiones.id"))

    correct: Mapped[bool] = mapped_column(Boolean)
