from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.utc import now_utc_naive


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive)

    avatar: Mapped[Optional["UserAvatar"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def avatar_updated_at(self) -> datetime | None:
        """None si el usuario no tiene foto. El frontend lo usa para saber si
        debe pedirla y como "versión" de la imagen."""
        return self.avatar.updated_at if self.avatar else None


class UserAvatar(Base):
    """Foto de perfil: una fila por usuario, en su propia tabla (así create_all
    la crea sola, sin migrar `users`). La imagen ya llega recortada y pequeña."""

    __tablename__ = "user_avatars"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    content_type: Mapped[str] = mapped_column(String(20))
    # deferred: no se carga al leer el usuario, solo al pedir la imagen.
    data: Mapped[bytes] = mapped_column(LargeBinary, deferred=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive)

    user: Mapped["User"] = relationship(back_populates="avatar")
