from pydantic import BaseModel


class Pais(BaseModel):
    nombre: str
    capital: str
    continente: str
    # Opcional: si no se envía, se genera a partir del nombre (p. ej. "Costa Rica" -> "costa-rica").
    slug: str | None = None
