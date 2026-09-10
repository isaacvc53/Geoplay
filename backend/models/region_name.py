from pydantic import BaseModel


class region_name(BaseModel):
    language: str
    name: str

