from fastapi import FastAPI
from pydantic import BaseModel


class Country(BaseModel):
    name: str
    capital: str
    continent: str




app = FastAPI()

countries = [
    {
        "name": "España",
        "capital": "Madrid",
        "continent": "Europa"
    },
    {
        "name": "Francia",
        "capital": "París",
        "continent": "Europa"
    }
]



@app.get("/")
def home():
    return {"message": "¡Bienvenido a Geoplay!"}

@app.get("/countries/{country_name}")
def get_country(country_name):

    for country in countries:
        if country["name"].lower() == country_name.lower():
            return country

    return {"error": "País no encontrado"}  


@app.get("/countries")
def get_countries():
    return countries



@app.post("/countries")
def create_country(country: Country):
    countries.append(country)
    return country