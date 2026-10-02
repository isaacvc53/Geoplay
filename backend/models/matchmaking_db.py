from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
from models.utc import now_utc_naive


class MatchQueueEntry(Base):
    """Un jugador que busca rival en la cola general (emparejamiento con desconocidos).

    Hay como mucho UNA fila por usuario. `last_seen` hace de latido: el navegador consulta
    su estado cada pocos segundos y lo renueva; quien lleva un rato sin dar señales (cerró
    la pestaña, perdió la conexión) se borra solo y nunca se empareja a nadie con un fantasma.

    Es una tabla nueva: create_all la crea sola, sin migraciones. No guarda duración ni
    país: los dos se sortean cuando se forma la pareja.
    """

    __tablename__ = "match_queue"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive, index=True)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=now_utc_naive)
