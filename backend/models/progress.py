from pydantic import BaseModel, ConfigDict, Field

from models.utc import UtcDatetime


class AnswerIn(BaseModel):
    region_id: int
    correct: bool


class GameSessionCreate(BaseModel):
    country_id: int
    # Máximo 24 h; evita valores absurdos o negativos que rompan los rankings.
    time_seconds: int | None = Field(default=None, ge=0, le=86400)
    # Tope de seguridad: ningún país tiene más de unos cientos de regiones.
    answers: list[AnswerIn] = Field(max_length=1000)


class GameSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    country_id: int
    total_regions: int
    correct_regions: int
    time_seconds: int | None
    played_at: UtcDatetime


class RegionProgressOut(BaseModel):
    """% de acierto acumulado de una región concreta (estilo 'Your %' de JetPunk):
    de todas las veces que te ha salido esta región, en qué % has acertado."""

    region_id: int
    region_name: str
    attempts: int
    correct: int
    accuracy: float


class BestScoreOut(BaseModel):
    """Tu mejor partida histórica en este país (best score, como en JetPunk)."""

    correct_regions: int
    total_regions: int
    percentage: float
    time_seconds: int | None
    played_at: UtcDatetime


class CountryProgressOut(BaseModel):
    country_id: int
    country_name: str
    country_slug: str | None = None
    total_regions: int
    # Cabecera del país = % de tu mejor partida (0.0 si aún no has jugado ninguna)
    percentage: float
    games_played: int
    best_score: BestScoreOut | None
    # NUEVO: cuándo jugaste tu última partida de este país (no tiene por qué
    # coincidir con best_score.played_at, que es tu MEJOR partida, no la última)
    last_played_at: UtcDatetime | None = None
    regions: list[RegionProgressOut]


# NUEVO: resumen de una partida concreta, ya con el país resuelto (nombre y
# slug), para el feed de "actividad reciente" del perfil y para la mini
# gráfica de evolución (precisión a lo largo del tiempo). A diferencia de
# GameSessionOut no lleva las respuestas región a región: aquí solo importa
# el resultado global de la partida.
class GameSessionSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    country_id: int
    country_name: str
    country_slug: str | None = None
    total_regions: int
    correct_regions: int
    percentage: float
    time_seconds: int | None
    played_at: UtcDatetime
