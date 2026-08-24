from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

if TYPE_CHECKING:
    from models.country_db import Country


class region(Base):
    __tablename__ = "regiones"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    country_id: Mapped[int] = mapped_column(
        ForeignKey("countries.id")
    )

    country: Mapped["Country"] = relationship()