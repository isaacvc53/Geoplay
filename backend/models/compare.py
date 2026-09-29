from pydantic import BaseModel

from models.utc import UtcDatetime


class CompareUserOut(BaseModel):
    """Resumen global de uno de los dos jugadores."""

    user_id: int
    username: str
    member_since: UtcDatetime
    games_played: int
    countries_played: int
    accuracy: float | None  # % de acierto global (None si nunca ha jugado)
    mastered_count: int  # países cuya MEJOR partida fue 100 %
    streak: int  # días seguidos jugando (en la zona horaria de quien consulta)
    fastest_perfect_seconds: int | None  # mejor tiempo en una partida al 100 %
    last_played_at: UtcDatetime | None
    avatar_updated_at: UtcDatetime | None = None  # None = sin foto


class CompareSideOut(BaseModel):
    """Lo que un jugador ha hecho en un país concreto (mejor partida)."""

    games_played: int
    best_percentage: float
    best_time_seconds: int | None
    last_played_at: UtcDatetime | None


class CompareCountryOut(BaseModel):
    country_id: int
    country_name: str
    country_slug: str | None = None
    # None = ese jugador todavía no ha jugado este país
    me: CompareSideOut | None
    friend: CompareSideOut | None


class ComparisonOut(BaseModel):
    me: CompareUserOut
    friend: CompareUserOut
    # Solo países que ha jugado al menos uno de los dos.
    countries: list[CompareCountryOut]


class CompareRegionSideOut(BaseModel):
    attempts: int
    correct: int
    accuracy: float


class CompareRegionOut(BaseModel):
    region_id: int
    region_name: str
    me: CompareRegionSideOut | None  # None = sin intentos en esta región
    friend: CompareRegionSideOut | None


class CountryComparisonOut(BaseModel):
    country_id: int
    country_name: str
    country_slug: str | None = None
    regions: list[CompareRegionOut]
