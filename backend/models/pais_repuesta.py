from pydantic import BaseModel

class PaisRespuesta(BaseModel):
    nombre: str
    capital: str
