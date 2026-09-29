from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from core.security import MAX_PASSWORD_BYTES
from models.utc import UtcDatetime


class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=150)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def email_en_minusculas(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("username")
    @classmethod
    def username_sin_espacios_extremos(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El nombre de usuario debe tener al menos 3 caracteres")
        return v

    @field_validator("password")
    @classmethod
    def password_cabe_en_bcrypt(cls, v: str) -> str:
        if len(v.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError("La contraseña es demasiado larga (máximo 72 bytes)")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    created_at: UtcDatetime
    # Fecha de la foto de perfil (None = sin foto).
    avatar_updated_at: UtcDatetime | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None
