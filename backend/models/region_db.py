from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

if TYPE_CHECKING:
    from models.country_db import Country
    from models.region_name_db import RegionName


class Region(Base):
    __tablename__ = "regiones"

    id: Mapped[int] = mapped_column(primary_key=True)

    country_id: Mapped[int] = mapped_column(
        ForeignKey("countries.id")
    )

    country: Mapped["Country"] = relationship()

    names: Mapped[list["RegionName"]] = relationship()