"""
Seed de provincias/estados/departamentos para países de Sudamérica.

Reutiliza el mismo patrón que ya usas para España: cada país es un
`Country` real, y sus provincias son `Region` con nombres multilingües
en `RegionName`. No usa el `Country` sintético "Mundo" (ese es otro
script, para el juego de adivinar países).

DISEÑO ABIERTO:
- Añade, corrige o completa países en el diccionario SUDAMERICA sin
  tocar nada de la lógica de abajo.
- Un país con `"provincias": []` se crea igualmente (placeholder),
  pero sin detalle todavía — cómodo para ir completando poco a poco.
- Es idempotente: si ejecutas el script dos veces, no duplica países
  ni provincias ya insertadas (comprueba por nombre en español).

USO:
    python seed_sudamerica.py                          # todos los países
    python seed_sudamerica.py --paises Argentina Chile  # solo estos
    python seed_sudamerica.py --dry-run                 # simula, no escribe en BD
    python seed_sudamerica.py --silencioso               # log mínimo
"""

import argparse

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName


# ---------------------------------------------------------------------------
# DATOS — edita aquí. "es"/"en" son los nombres validados por el juego.
# ---------------------------------------------------------------------------

SUDAMERICA = {
    "Argentina": {
        "slug": "argentina",
        "capital": "Buenos Aires",
        "provincias": [
            {
                "es": "Ciudad Autónoma de Buenos Aires",
                "en": "Autonomous City of Buenos Aires",
                "alias": [
                    "CABA",
                    "Capital Federal",
                    "Ciudad de Buenos Aires",
                    "Buenos Aires City",
                    "City of Buenos Aires",
                ],
            },
            {"es": "Buenos Aires", "en": "Buenos Aires"},
            {"es": "Córdoba", "en": "Cordoba"},
            {"es": "Santa Fe", "en": "Santa Fe"},
            {"es": "Mendoza", "en": "Mendoza"},
            {"es": "Tucumán", "en": "Tucuman"},
            {"es": "Entre Ríos", "en": "Entre Rios"},
            {"es": "Salta", "en": "Salta"},
            {"es": "Misiones", "en": "Misiones"},
            {"es": "Chaco", "en": "Chaco"},
            {"es": "Corrientes", "en": "Corrientes"},
            {"es": "Santiago del Estero", "en": "Santiago del Estero"},
            {"es": "San Juan", "en": "San Juan"},
            {"es": "Jujuy", "en": "Jujuy"},
            {"es": "Río Negro", "en": "Rio Negro"},
            {"es": "Neuquén", "en": "Neuquen"},
            {"es": "Formosa", "en": "Formosa"},
            {"es": "Chubut", "en": "Chubut"},
            {"es": "San Luis", "en": "San Luis"},
            {"es": "Catamarca", "en": "Catamarca"},
            {"es": "La Rioja", "en": "La Rioja"},
            {"es": "La Pampa", "en": "La Pampa"},
            {"es": "Santa Cruz", "en": "Santa Cruz"},
            {"es": "Tierra del Fuego", "en": "Tierra del Fuego"},
        ],
    },
    "Chile": {
        "slug": "chile",
        "capital": "Santiago",
        "provincias": [
            {"es": "Arica y Parinacota", "en": "Arica y Parinacota", "alias": ["Arica"]},
            {"es": "Tarapacá", "en": "Tarapaca"},
            {"es": "Antofagasta", "en": "Antofagasta"},
            {"es": "Atacama", "en": "Atacama"},
            {"es": "Coquimbo", "en": "Coquimbo"},
            {"es": "Valparaíso", "en": "Valparaiso"},
            {"es": "Metropolitana de Santiago", "en": "Santiago Metropolitan", "alias": ["Santiago"]},
            {"es": "Libertador General Bernardo O'Higgins", "en": "O'Higgins", "alias": ["O'Higgins"]},
            {"es": "Maule", "en": "Maule"},
            {"es": "Ñuble", "en": "Nuble"},
            {"es": "Biobío", "en": "Biobio"},
            {"es": "La Araucanía", "en": "Araucania", "alias": ["Araucania"]},
            {"es": "Los Ríos", "en": "Los Rios"},
            {"es": "Los Lagos", "en": "Los Lagos"},
            {"es": "Aysén", "en": "Aysen"},
            {"es": "Magallanes y de la Antártica Chilena", "en": "Magallanes", "alias": ["Magallanes"]},
        ],
    },
    "Colombia": {
        "slug": "colombia",
        "capital": "Bogotá",
        "provincias": [
            {"es": "Amazonas", "en": "Amazonas"},
            {"es": "Antioquia", "en": "Antioquia"},
            {"es": "Arauca", "en": "Arauca"},
            {"es": "Atlántico", "en": "Atlantico"},
            {"es": "Bolívar", "en": "Bolivar"},
            {"es": "Boyacá", "en": "Boyaca"},
            {"es": "Caldas", "en": "Caldas"},
            {"es": "Caquetá", "en": "Caqueta"},
            {"es": "Casanare", "en": "Casanare"},
            {"es": "Cauca", "en": "Cauca"},
            {"es": "Cesar", "en": "Cesar"},
            {"es": "Chocó", "en": "Choco"},
            {"es": "Córdoba", "en": "Cordoba"},
            {"es": "Cundinamarca", "en": "Cundinamarca"},
            {
                "es": "Distrito Capital de Bogotá",
                "en": "Bogota D.C.",
                "alias": [
                    "Bogotá",
                    "Bogota",
                    "Bogotá D.C.",
                    "Bogota DC",
                    "Distrito Capital de Bogota",
                ],
            },
            {"es": "Guainía", "en": "Guainia"},
            {"es": "Guaviare", "en": "Guaviare"},
            {"es": "Huila", "en": "Huila"},
            {"es": "La Guajira", "en": "La Guajira"},
            {"es": "Magdalena", "en": "Magdalena"},
            {"es": "Meta", "en": "Meta"},
            {"es": "Nariño", "en": "Narino"},
            {"es": "Norte de Santander", "en": "Norte de Santander"},
            {"es": "Putumayo", "en": "Putumayo"},
            {"es": "Quindío", "en": "Quindio"},
            {"es": "Risaralda", "en": "Risaralda"},
            {"es": "San Andrés y Providencia", "en": "San Andres y Providencia", "alias": ["San Andrés"]},
            {"es": "Santander", "en": "Santander"},
            {"es": "Sucre", "en": "Sucre"},
            {"es": "Tolima", "en": "Tolima"},
            {"es": "Valle del Cauca", "en": "Valle del Cauca"},
            {"es": "Vaupés", "en": "Vaupes"},
            {"es": "Vichada", "en": "Vichada"},
        ],
    },
    "Brasil": {
        "slug": "brazil",
        "capital": "Brasília",
        "provincias": [
            {"es": "Acre", "en": "Acre"},
            {"es": "Alagoas", "en": "Alagoas"},
            {"es": "Amapá", "en": "Amapa"},
            {"es": "Amazonas", "en": "Amazonas"},
            {"es": "Bahía", "en": "Bahia"},
            {"es": "Ceará", "en": "Ceara"},
            {"es": "Distrito Federal", "en": "Federal District", "alias": ["Brasilia"]},
            {"es": "Espírito Santo", "en": "Espirito Santo"},
            {"es": "Goiás", "en": "Goias"},
            {"es": "Maranhão", "en": "Maranhao"},
            {"es": "Mato Grosso", "en": "Mato Grosso"},
            {"es": "Mato Grosso do Sul", "en": "Mato Grosso do Sul"},
            {"es": "Minas Gerais", "en": "Minas Gerais"},
            {"es": "Pará", "en": "Para"},
            {"es": "Paraíba", "en": "Paraiba"},
            {"es": "Paraná", "en": "Parana"},
            {"es": "Pernambuco", "en": "Pernambuco"},
            {"es": "Piauí", "en": "Piaui"},
            {"es": "Río de Janeiro", "en": "Rio de Janeiro"},
            {"es": "Río Grande del Norte", "en": "Rio Grande do Norte"},
            {"es": "Río Grande del Sur", "en": "Rio Grande do Sul"},
            {"es": "Rondônia", "en": "Rondonia"},
            {"es": "Roraima", "en": "Roraima"},
            {"es": "Santa Catarina", "en": "Santa Catarina"},
            {"es": "São Paulo", "en": "Sao Paulo"},
            {"es": "Sergipe", "en": "Sergipe"},
            {"es": "Tocantins", "en": "Tocantins"},
        ],
    },
    "Perú": {
        "slug": "peru",
        "capital": "Lima",
        "provincias": [
            {"es": "Amazonas", "en": "Amazonas"},
            {"es": "Áncash", "en": "Ancash"},
            {"es": "Apurímac", "en": "Apurimac"},
            {"es": "Arequipa", "en": "Arequipa"},
            {"es": "Ayacucho", "en": "Ayacucho"},
            {"es": "Cajamarca", "en": "Cajamarca"},
            {"es": "Callao", "en": "Callao"},
            {"es": "Cusco", "en": "Cusco"},
            {"es": "Huancavelica", "en": "Huancavelica"},
            {"es": "Huánuco", "en": "Huanuco"},
            {"es": "Ica", "en": "Ica"},
            {"es": "Junín", "en": "Junin"},
            {"es": "La Libertad", "en": "La Libertad"},
            {"es": "Lambayeque", "en": "Lambayeque"},
            {"es": "Lima", "en": "Lima"},
            {"es": "Loreto", "en": "Loreto"},
            {"es": "Madre de Dios", "en": "Madre de Dios"},
            {"es": "Moquegua", "en": "Moquegua"},
            {"es": "Pasco", "en": "Pasco"},
            {"es": "Piura", "en": "Piura"},
            {"es": "Puno", "en": "Puno"},
            {"es": "San Martín", "en": "San Martin"},
            {"es": "Tacna", "en": "Tacna"},
            {"es": "Tumbes", "en": "Tumbes"},
            {"es": "Ucayali", "en": "Ucayali"},
        ],
    },

    "Bolivia": {
        "slug": "bolivia",
        "capital": "Sucre",
        "provincias": [
            {"es": "La Paz", "en": "La Paz"},
            {"es": "Santa Cruz", "en": "Santa Cruz"},
            {"es": "Cochabamba", "en": "Cochabamba"},
            {"es": "Potosí", "en": "Potosi"},
            {"es": "Chuquisaca", "en": "Chuquisaca"},
            {"es": "Oruro", "en": "Oruro"},
            {"es": "Tarija", "en": "Tarija"},
            {"es": "Beni", "en": "Beni"},
            {"es": "Pando", "en": "Pando"},
        ],
    },
    "Ecuador": {
        "slug": "ecuador",
        "capital": "Quito",
        "provincias": [
            {"es": "Azuay", "en": "Azuay"},
            {"es": "Bolívar", "en": "Bolivar"},
            {"es": "Cañar", "en": "Canar"},
            {"es": "Carchi", "en": "Carchi"},
            {"es": "Chimborazo", "en": "Chimborazo"},
            {"es": "Cotopaxi", "en": "Cotopaxi"},
            {"es": "El Oro", "en": "El Oro"},
            {"es": "Esmeraldas", "en": "Esmeraldas"},
            {"es": "Galápagos", "en": "Galapagos"},
            {"es": "Guayas", "en": "Guayas"},
            {"es": "Imbabura", "en": "Imbabura"},
            {"es": "Loja", "en": "Loja"},
            {"es": "Los Ríos", "en": "Los Rios"},
            {"es": "Manabí", "en": "Manabi"},
            {"es": "Morona Santiago", "en": "Morona Santiago"},
            {"es": "Napo", "en": "Napo"},
            {"es": "Orellana", "en": "Orellana"},
            {"es": "Pastaza", "en": "Pastaza"},
            {"es": "Pichincha", "en": "Pichincha"},
            {"es": "Santa Elena", "en": "Santa Elena"},
            {"es": "Santo Domingo de los Tsáchilas", "en": "Santo Domingo de los Tsachilas", "alias": ["Santo Domingo"]},
            {"es": "Sucumbíos", "en": "Sucumbios"},
            {"es": "Tungurahua", "en": "Tungurahua"},
            {"es": "Zamora Chinchipe", "en": "Zamora Chinchipe"},
        ],
    },
    "Paraguay": {
        "slug": "paraguay",
        "capital": "Asunción",
        "provincias": [
            {"es": "Concepción", "en": "Concepcion"},
            {"es": "San Pedro", "en": "San Pedro"},
            {"es": "Cordillera", "en": "Cordillera"},
            {"es": "Guairá", "en": "Guaira"},
            {"es": "Caaguazú", "en": "Caaguazu"},
            {"es": "Caazapá", "en": "Caazapa"},
            {"es": "Itapúa", "en": "Itapua"},
            {"es": "Misiones", "en": "Misiones"},
            {"es": "Paraguarí", "en": "Paraguari"},
            {"es": "Alto Paraná", "en": "Alto Parana"},
            {"es": "Central", "en": "Central"},
            {"es": "Ñeembucú", "en": "Neembucu"},
            {"es": "Amambay", "en": "Amambay"},
            {"es": "Canindeyú", "en": "Canindeyu"},
            {"es": "Presidente Hayes", "en": "Presidente Hayes"},
            {"es": "Boquerón", "en": "Boqueron"},
            {"es": "Alto Paraguay", "en": "Alto Paraguay"},
            {"es": "Asunción", "en": "Asuncion"},
        ],
    },
    "Uruguay": {
        "slug": "uruguay",
        "capital": "Montevideo",
        "provincias": [
            {"es": "Artigas", "en": "Artigas"},
            {"es": "Canelones", "en": "Canelones"},
            {"es": "Cerro Largo", "en": "Cerro Largo"},
            {"es": "Colonia", "en": "Colonia"},
            {"es": "Durazno", "en": "Durazno"},
            {"es": "Flores", "en": "Flores"},
            {"es": "Florida", "en": "Florida"},
            {"es": "Lavalleja", "en": "Lavalleja"},
            {"es": "Maldonado", "en": "Maldonado"},
            {"es": "Montevideo", "en": "Montevideo"},
            {"es": "Paysandú", "en": "Paysandu"},
            {"es": "Río Negro", "en": "Rio Negro"},
            {"es": "Rivera", "en": "Rivera"},
            {"es": "Rocha", "en": "Rocha"},
            {"es": "Salto", "en": "Salto"},
            {"es": "San José", "en": "San Jose"},
            {"es": "Soriano", "en": "Soriano"},
            {"es": "Tacuarembó", "en": "Tacuarembo"},
            {"es": "Treinta y Tres", "en": "Treinta y Tres"},
        ],
    },
    "Venezuela": {
        "slug": "venezuela",
        "capital": "Caracas",
        "provincias": [
            {"es": "Amazonas", "en": "Amazonas"},
            {"es": "Anzoátegui", "en": "Anzoategui"},
            {"es": "Apure", "en": "Apure"},
            {"es": "Aragua", "en": "Aragua"},
            {"es": "Barinas", "en": "Barinas"},
            {"es": "Bolívar", "en": "Bolivar"},
            {"es": "Carabobo", "en": "Carabobo"},
            {"es": "Cojedes", "en": "Cojedes"},
            {"es": "Delta Amacuro", "en": "Delta Amacuro"},
            {"es": "Distrito Capital", "en": "Capital District", "alias": ["Caracas"]},
            {"es": "Falcón", "en": "Falcon"},
            {"es": "Guárico", "en": "Guarico"},
            {"es": "Lara", "en": "Lara"},
            {"es": "Mérida", "en": "Merida"},
            {"es": "Miranda", "en": "Miranda"},
            {"es": "Monagas", "en": "Monagas"},
            {"es": "Nueva Esparta", "en": "Nueva Esparta"},
            {"es": "Portuguesa", "en": "Portuguesa"},
            {"es": "Sucre", "en": "Sucre"},
            {"es": "Táchira", "en": "Tachira"},
            {"es": "Trujillo", "en": "Trujillo"},
            {"es": "La Guaira", "en": "La Guaira", "alias": ["Vargas"]},
            {"es": "Yaracuy", "en": "Yaracuy"},
            {"es": "Zulia", "en": "Zulia"},
        ],
    },
    "Guyana": {
        "slug": "guyana",
        "capital": "Georgetown",
        "provincias": [
            {"es": "Barima-Waini", "en": "Barima-Waini"},
            {"es": "Pomeroon-Supenaam", "en": "Pomeroon-Supenaam"},
            {"es": "Essequibo Islands-West Demerara", "en": "Essequibo Islands-West Demerara"},
            {"es": "Demerara-Mahaica", "en": "Demerara-Mahaica"},
            {"es": "Mahaica-Berbice", "en": "Mahaica-Berbice"},
            {"es": "East Berbice-Corentyne", "en": "East Berbice-Corentyne"},
            {"es": "Cuyuni-Mazaruni", "en": "Cuyuni-Mazaruni"},
            {"es": "Potaro-Siparuni", "en": "Potaro-Siparuni"},
            {"es": "Upper Takutu-Upper Essequibo", "en": "Upper Takutu-Upper Essequibo"},
            {"es": "Upper Demerara-Berbice", "en": "Upper Demerara-Berbice"},
        ],
    },
    "Surinam": {
        "slug": "suriname",
        "capital": "Paramaribo",
        "provincias": [
            {"es": "Brokopondo", "en": "Brokopondo"},
            {"es": "Commewijne", "en": "Commewijne"},
            {"es": "Coronie", "en": "Coronie"},
            {"es": "Marowijne", "en": "Marowijne"},
            {"es": "Nickerie", "en": "Nickerie"},
            {"es": "Para", "en": "Para"},
            {"es": "Paramaribo", "en": "Paramaribo"},
            {"es": "Saramacca", "en": "Saramacca"},
            {"es": "Sipaliwini", "en": "Sipaliwini"},
            {"es": "Wanica", "en": "Wanica"},
        ],
    },
}

CONTINENTE = "América del Sur"


# ---------------------------------------------------------------------------
# LÓGICA — no debería hacer falta tocar esto para añadir países/provincias
# ---------------------------------------------------------------------------

def get_or_create_country(db, nombre, slug, capital):
    country = db.query(Country).filter(Country.nombre == nombre).first()
    if country:
        if not country.slug:
            country.slug = slug  # migra países ya sembrados sin slug todavía
        return country, False

    country = Country(nombre=nombre, slug=slug, capital=capital, continente=CONTINENTE)
    db.add(country)
    db.flush()  # asigna id sin hacer commit todavía
    return country, True


def get_existing_region_names(db, country_id):
    """Nombres (es) de regiones ya creadas para este país — para no duplicar."""
    existentes = set()
    for region in db.query(Region).filter(Region.country_id == country_id).all():
        for rn in region.names:
            existentes.add(rn.name)
    return existentes


def seed_country(db, nombre_pais, datos, dry_run=False, verbose=True):
    country, creado = get_or_create_country(
        db, nombre_pais, datos["slug"], datos["capital"]
    )
    if verbose:
        estado = "creado" if creado else "ya existía"
        print(f"[{nombre_pais}] país {estado}")

    if not datos["provincias"]:
        if verbose:
            print(f"[{nombre_pais}] sin provincias definidas todavía (placeholder)")
        if not dry_run:
            db.commit()
        return

    existentes = get_existing_region_names(db, country.id) if not dry_run else set()

    for provincia in datos["provincias"]:
        nombre_es = provincia["es"]
        nombre_en = provincia.get("en", nombre_es)
        alias = provincia.get("alias", [])  # nombres cortos/coloquiales aceptados como respuesta

        if nombre_es in existentes:
            if verbose:
                print(f"  - {nombre_es}: ya existe, se omite")
            continue

        if dry_run:
            extra = f" (alias: {', '.join(alias)})" if alias else ""
            print(f"  - {nombre_es} / {nombre_en}{extra}: se insertaría")
            continue

        region = Region(country_id=country.id)
        db.add(region)
        db.flush()

        db.add(RegionName(region_id=region.id, language="es", name=nombre_es))
        db.add(RegionName(region_id=region.id, language="en", name=nombre_en))
        for nombre_alias in alias:
            db.add(RegionName(region_id=region.id, language="es", name=nombre_alias))

        if verbose:
            extra = f" (alias: {', '.join(alias)})" if alias else ""
            print(f"  - {nombre_es} / {nombre_en}{extra}: insertado")

    if not dry_run:
        db.commit()


def main():
    parser = argparse.ArgumentParser(
        description="Seed de provincias/estados de países de Sudamérica."
    )
    parser.add_argument(
        "--paises",
        nargs="+",
        help="Limita el seed a estos países (nombre exacto, tal cual en el diccionario). Por defecto, todos.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra lo que se insertaría, sin escribir en la base de datos.",
    )
    parser.add_argument(
        "--silencioso",
        action="store_true",
        help="Reduce el log al mínimo.",
    )
    args = parser.parse_args()

    paises_a_procesar = args.paises if args.paises else list(SUDAMERICA.keys())

    db = SessionLocal()
    try:
        for nombre_pais in paises_a_procesar:
            datos = SUDAMERICA.get(nombre_pais)
            if not datos:
                print(f"Aviso: '{nombre_pais}' no está en SUDAMERICA, se omite")
                continue

            seed_country(
                db,
                nombre_pais,
                datos,
                dry_run=args.dry_run,
                verbose=not args.silencioso,
            )

        if args.dry_run:
            db.rollback()
            print("\nDry-run: no se ha guardado nada en la base de datos.")
        else:
            print("\nSeed de Sudamérica completado.")

    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
