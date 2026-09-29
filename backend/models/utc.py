from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def now_utc_naive() -> datetime:
    """Hora UTC sin tzinfo: mismo formato que ya hay guardado en las columnas
    DateTime existentes (sin necesidad de migrar la BD)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _as_utc(value: datetime) -> datetime:
    # Las fechas en BD son UTC "naive". Al serializar les ponemos tz=UTC para que
    # el JSON lleve "Z"/"+00:00" y el navegador las convierta bien a hora local.
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]
