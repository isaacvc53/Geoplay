from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.utc import now_utc_naive

STATUS_PENDING = "pending"
STATUS_ACCEPTED = "accepted"


class Friendship(Base):
    """Una fila por PAREJA de usuarios (no una por dirección).

    Los dos ids se guardan siempre ordenados (user_low_id < user_high_id), así
    la restricción UNIQUE impide de raíz que existan dos filas para la misma
    pareja, aunque A y B se envíen solicitud a la vez. Quién la envió se guarda
    en requested_by_id.
    """

    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(primary_key=True)

    # El índice de (user_low_id, user_high_id) ya lo crea la UNIQUE; falta solo
    # el de user_high_id para buscar "todas las relaciones de este usuario".
    user_low_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user_high_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    requested_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    status: Mapped[str] = mapped_column(String(10), default=STATUS_PENDING)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_low_id", "user_high_id", name="uq_friendship_pair"),
        CheckConstraint("user_low_id < user_high_id", name="ck_friendship_order"),
        CheckConstraint(
            "requested_by_id = user_low_id OR requested_by_id = user_high_id",
            name="ck_friendship_requester",
        ),
        CheckConstraint("status IN ('pending', 'accepted')", name="ck_friendship_status"),
    )
