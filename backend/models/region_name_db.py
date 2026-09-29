from sqlalchemy import String, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.region_db import Region


class RegionName(Base):
    __tablename__ = "region_names"

    id: Mapped[int] = mapped_column(primary_key=True)

    region_id: Mapped[int] = mapped_column(
        ForeignKey("regiones.id")
    )

    language: Mapped[str] = mapped_column(String(10))
    name: Mapped[str] = mapped_column(String(100))

    region: Mapped["Region"] = relationship()

    # Lo usan selectinload(Region.names) y /regions/check en cada consulta.
    __table_args__ = (
        Index("ix_region_names_region_id", "region_id"),
    )
