
from pydantic import BaseModel

class Pais(BaseModel):
    nombre: str
    capital: str
    continente: str
