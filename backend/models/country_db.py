from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.region_db import Region
from models.base import Base


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    capital: Mapped[str] = mapped_column(String(100))
    continente: Mapped[str] = mapped_column(String(100))

    regiones: Mapped[list["Region"]] = relationship()