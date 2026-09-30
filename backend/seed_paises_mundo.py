"""
Seed de países SOBERANOS del mundo (197): 193 miembros de la ONU + Vaticano,
Palestina, Kosovo y Taiwán (los mismos que el quiz "Los 197 países").

Crea solo el `Country` (nombre, slug, capital, continente). Las regiones se
siguen sembrando con los seeds por país/continente (seed_sudamerica.py, etc.).

Convenciones (las mismas que los otros seeds):
- `nombre` en español, `slug` en inglés (el de continents.js: "united-states",
  "north-macedonia"...), capital en español.
- Idempotente: si el país ya existe (por nombre O por slug) no se toca ni se
  duplica, así que puedes ejecutarlo sobre una BD con Argentina, España, etc.
  ya sembrados.
- "continente" replica el reparto de los seeds existentes ("América del Sur",
  "América del Norte", "América Central") y añade "Caribe" para las islas
  caribeñas. Si prefieres meterlas en "América Central", cambia CARIBE_COMO.

USO (desde backend/):
    python seed_paises_mundo.py                              # todos
    python seed_paises_mundo.py --continentes Europa Asia     # solo estos continentes
    python seed_paises_mundo.py --paises España Japón         # solo estos países
    python seed_paises_mundo.py --dry-run                     # simula, no escribe
    python seed_paises_mundo.py --silencioso
"""

import argparse

from database.connection import SessionLocal
from models.country_db import Country
# Region y RegionName no se usan aquí, pero SQLAlchemy necesita todos los modelos
# importados para configurar las relaciones de Country.
from models.region_db import Region  # noqa: F401
from models.region_name_db import RegionName  # noqa: F401

# Pon aquí "América Central" si no quieres un continente "Caribe" aparte.
CARIBE_COMO = "Caribe"

# ---------------------------------------------------------------------------
# DATOS — edita aquí. Clave = nombre en español.
# ---------------------------------------------------------------------------

MUNDO = {
    # ---------- Europa ----------
    "Albania": {"slug": "albania", "capital": "Tirana", "continente": "Europa"},
    "Alemania": {"slug": "germany", "capital": "Berlín", "continente": "Europa"},
    "Andorra": {"slug": "andorra", "capital": "Andorra la Vieja", "continente": "Europa"},
    "Austria": {"slug": "austria", "capital": "Viena", "continente": "Europa"},
    "Bélgica": {"slug": "belgium", "capital": "Bruselas", "continente": "Europa"},
    "Bielorrusia": {"slug": "belarus", "capital": "Minsk", "continente": "Europa"},
    "Bosnia y Herzegovina": {"slug": "bosnia-and-herzegovina", "capital": "Sarajevo", "continente": "Europa"},
    "Bulgaria": {"slug": "bulgaria", "capital": "Sofía", "continente": "Europa"},
    "Chipre": {"slug": "cyprus", "capital": "Nicosia", "continente": "Europa"},
    "Croacia": {"slug": "croatia", "capital": "Zagreb", "continente": "Europa"},
    "Dinamarca": {"slug": "denmark", "capital": "Copenhague", "continente": "Europa"},
    "Eslovaquia": {"slug": "slovakia", "capital": "Bratislava", "continente": "Europa"},
    "Eslovenia": {"slug": "slovenia", "capital": "Liubliana", "continente": "Europa"},
    "España": {"slug": "spain", "capital": "Madrid", "continente": "Europa"},
    "Estonia": {"slug": "estonia", "capital": "Tallin", "continente": "Europa"},
    "Finlandia": {"slug": "finland", "capital": "Helsinki", "continente": "Europa"},
    "Francia": {"slug": "france", "capital": "París", "continente": "Europa"},
    "Grecia": {"slug": "greece", "capital": "Atenas", "continente": "Europa"},
    "Hungría": {"slug": "hungary", "capital": "Budapest", "continente": "Europa"},
    "Irlanda": {"slug": "ireland", "capital": "Dublín", "continente": "Europa"},
    "Islandia": {"slug": "iceland", "capital": "Reikiavik", "continente": "Europa"},
    "Italia": {"slug": "italy", "capital": "Roma", "continente": "Europa"},
    "Kosovo": {"slug": "kosovo", "capital": "Pristina", "continente": "Europa"},
    "Letonia": {"slug": "latvia", "capital": "Riga", "continente": "Europa"},
    "Liechtenstein": {"slug": "liechtenstein", "capital": "Vaduz", "continente": "Europa"},
    "Lituania": {"slug": "lithuania", "capital": "Vilna", "continente": "Europa"},
    "Luxemburgo": {"slug": "luxembourg", "capital": "Luxemburgo", "continente": "Europa"},
    "Macedonia del Norte": {"slug": "north-macedonia", "capital": "Skopie", "continente": "Europa"},
    "Malta": {"slug": "malta", "capital": "La Valeta", "continente": "Europa"},
    "Moldavia": {"slug": "moldova", "capital": "Chisináu", "continente": "Europa"},
    "Mónaco": {"slug": "monaco", "capital": "Mónaco", "continente": "Europa"},
    "Montenegro": {"slug": "montenegro", "capital": "Podgorica", "continente": "Europa"},
    "Noruega": {"slug": "norway", "capital": "Oslo", "continente": "Europa"},
    "Países Bajos": {"slug": "netherlands", "capital": "Ámsterdam", "continente": "Europa"},
    "Polonia": {"slug": "poland", "capital": "Varsovia", "continente": "Europa"},
    "Portugal": {"slug": "portugal", "capital": "Lisboa", "continente": "Europa"},
    "Reino Unido": {"slug": "united-kingdom", "capital": "Londres", "continente": "Europa"},
    "República Checa": {"slug": "czech-republic", "capital": "Praga", "continente": "Europa"},
    "Rumanía": {"slug": "romania", "capital": "Bucarest", "continente": "Europa"},
    "Rusia": {"slug": "russia", "capital": "Moscú", "continente": "Europa"},
    "San Marino": {"slug": "san-marino", "capital": "San Marino", "continente": "Europa"},
    "Serbia": {"slug": "serbia", "capital": "Belgrado", "continente": "Europa"},
    "Suecia": {"slug": "sweden", "capital": "Estocolmo", "continente": "Europa"},
    "Suiza": {"slug": "switzerland", "capital": "Berna", "continente": "Europa"},
    "Ucrania": {"slug": "ukraine", "capital": "Kiev", "continente": "Europa"},
    "Vaticano": {"slug": "vatican-city", "capital": "Ciudad del Vaticano", "continente": "Europa"},
    # ---------- Asia ----------
    "Afganistán": {"slug": "afghanistan", "capital": "Kabul", "continente": "Asia"},
    "Arabia Saudita": {"slug": "saudi-arabia", "capital": "Riad", "continente": "Asia"},
    "Armenia": {"slug": "armenia", "capital": "Ereván", "continente": "Asia"},
    "Azerbaiyán": {"slug": "azerbaijan", "capital": "Bakú", "continente": "Asia"},
    "Baréin": {"slug": "bahrain", "capital": "Manama", "continente": "Asia"},
    "Bangladés": {"slug": "bangladesh", "capital": "Daca", "continente": "Asia"},
    "Bután": {"slug": "bhutan", "capital": "Timbu", "continente": "Asia"},
    "Brunéi": {"slug": "brunei", "capital": "Bandar Seri Begawan", "continente": "Asia"},
    "Camboya": {"slug": "cambodia", "capital": "Nom Pen", "continente": "Asia"},
    "Catar": {"slug": "qatar", "capital": "Doha", "continente": "Asia"},
    "China": {"slug": "china", "capital": "Pekín", "continente": "Asia"},
    "Corea del Norte": {"slug": "north-korea", "capital": "Pionyang", "continente": "Asia"},
    "Corea del Sur": {"slug": "south-korea", "capital": "Seúl", "continente": "Asia"},
    "Emiratos Árabes Unidos": {"slug": "united-arab-emirates", "capital": "Abu Dabi", "continente": "Asia"},
    "Filipinas": {"slug": "philippines", "capital": "Manila", "continente": "Asia"},
    "Georgia": {"slug": "georgia", "capital": "Tiflis", "continente": "Asia"},
    "India": {"slug": "india", "capital": "Nueva Delhi", "continente": "Asia"},
    "Indonesia": {"slug": "indonesia", "capital": "Yakarta", "continente": "Asia"},
    "Irak": {"slug": "iraq", "capital": "Bagdad", "continente": "Asia"},
    "Irán": {"slug": "iran", "capital": "Teherán", "continente": "Asia"},
    "Israel": {"slug": "israel", "capital": "Jerusalén", "continente": "Asia"},
    "Japón": {"slug": "japan", "capital": "Tokio", "continente": "Asia"},
    "Jordania": {"slug": "jordan", "capital": "Amán", "continente": "Asia"},
    "Kazajistán": {"slug": "kazakhstan", "capital": "Astaná", "continente": "Asia"},
    "Kirguistán": {"slug": "kyrgyzstan", "capital": "Biskek", "continente": "Asia"},
    "Kuwait": {"slug": "kuwait", "capital": "Kuwait", "continente": "Asia"},
    "Laos": {"slug": "laos", "capital": "Vientián", "continente": "Asia"},
    "Líbano": {"slug": "lebanon", "capital": "Beirut", "continente": "Asia"},
    "Malasia": {"slug": "malaysia", "capital": "Kuala Lumpur", "continente": "Asia"},
    "Maldivas": {"slug": "maldives", "capital": "Malé", "continente": "Asia"},
    "Mongolia": {"slug": "mongolia", "capital": "Ulán Bator", "continente": "Asia"},
    "Myanmar": {"slug": "myanmar", "capital": "Naipyidó", "continente": "Asia"},
    "Nepal": {"slug": "nepal", "capital": "Katmandú", "continente": "Asia"},
    "Omán": {"slug": "oman", "capital": "Mascate", "continente": "Asia"},
    "Pakistán": {"slug": "pakistan", "capital": "Islamabad", "continente": "Asia"},
    "Palestina": {"slug": "palestine", "capital": "Ramala", "continente": "Asia"},
    "Singapur": {"slug": "singapore", "capital": "Singapur", "continente": "Asia"},
    "Siria": {"slug": "syria", "capital": "Damasco", "continente": "Asia"},
    "Sri Lanka": {"slug": "sri-lanka", "capital": "Sri Jayawardenepura Kotte", "continente": "Asia"},
    "Tailandia": {"slug": "thailand", "capital": "Bangkok", "continente": "Asia"},
    "Taiwán": {"slug": "taiwan", "capital": "Taipéi", "continente": "Asia"},
    "Tayikistán": {"slug": "tajikistan", "capital": "Dusambé", "continente": "Asia"},
    "Timor Oriental": {"slug": "timor-leste", "capital": "Dili", "continente": "Asia"},
    "Turkmenistán": {"slug": "turkmenistan", "capital": "Asjabad", "continente": "Asia"},
    "Turquía": {"slug": "turkey", "capital": "Ankara", "continente": "Asia"},
    "Uzbekistán": {"slug": "uzbekistan", "capital": "Taskent", "continente": "Asia"},
    "Vietnam": {"slug": "vietnam", "capital": "Hanói", "continente": "Asia"},
    "Yemen": {"slug": "yemen", "capital": "Saná", "continente": "Asia"},
    # ---------- África ----------
    "Angola": {"slug": "angola", "capital": "Luanda", "continente": "África"},
    "Argelia": {"slug": "algeria", "capital": "Argel", "continente": "África"},
    "Benín": {"slug": "benin", "capital": "Porto Novo", "continente": "África"},
    "Botsuana": {"slug": "botswana", "capital": "Gaborone", "continente": "África"},
    "Burkina Faso": {"slug": "burkina-faso", "capital": "Uagadugú", "continente": "África"},
    "Burundi": {"slug": "burundi", "capital": "Guitega", "continente": "África"},
    "Cabo Verde": {"slug": "cape-verde", "capital": "Praia", "continente": "África"},
    "Camerún": {"slug": "cameroon", "capital": "Yaundé", "continente": "África"},
    "Chad": {"slug": "chad", "capital": "Yamena", "continente": "África"},
    "Comoras": {"slug": "comoros", "capital": "Moroni", "continente": "África"},
    "Costa de Marfil": {"slug": "ivory-coast", "capital": "Yamusukro", "continente": "África"},
    "Egipto": {"slug": "egypt", "capital": "El Cairo", "continente": "África"},
    "Eritrea": {"slug": "eritrea", "capital": "Asmara", "continente": "África"},
    "Esuatini": {"slug": "eswatini", "capital": "Mbabane", "continente": "África"},
    "Etiopía": {"slug": "ethiopia", "capital": "Adís Abeba", "continente": "África"},
    "Gabón": {"slug": "gabon", "capital": "Libreville", "continente": "África"},
    "Gambia": {"slug": "gambia", "capital": "Banjul", "continente": "África"},
    "Ghana": {"slug": "ghana", "capital": "Acra", "continente": "África"},
    "Guinea": {"slug": "guinea", "capital": "Conakri", "continente": "África"},
    "Guinea-Bisáu": {"slug": "guinea-bissau", "capital": "Bisáu", "continente": "África"},
    "Guinea Ecuatorial": {"slug": "equatorial-guinea", "capital": "Malabo", "continente": "África"},
    "Kenia": {"slug": "kenya", "capital": "Nairobi", "continente": "África"},
    "Lesoto": {"slug": "lesotho", "capital": "Maseru", "continente": "África"},
    "Liberia": {"slug": "liberia", "capital": "Monrovia", "continente": "África"},
    "Libia": {"slug": "libya", "capital": "Trípoli", "continente": "África"},
    "Madagascar": {"slug": "madagascar", "capital": "Antananarivo", "continente": "África"},
    "Malaui": {"slug": "malawi", "capital": "Lilongüe", "continente": "África"},
    "Malí": {"slug": "mali", "capital": "Bamako", "continente": "África"},
    "Marruecos": {"slug": "morocco", "capital": "Rabat", "continente": "África"},
    "Mauricio": {"slug": "mauritius", "capital": "Port Louis", "continente": "África"},
    "Mauritania": {"slug": "mauritania", "capital": "Nuakchot", "continente": "África"},
    "Mozambique": {"slug": "mozambique", "capital": "Maputo", "continente": "África"},
    "Namibia": {"slug": "namibia", "capital": "Windhoek", "continente": "África"},
    "Níger": {"slug": "niger", "capital": "Niamey", "continente": "África"},
    "Nigeria": {"slug": "nigeria", "capital": "Abuya", "continente": "África"},
    "República Centroafricana": {"slug": "central-african-republic", "capital": "Bangui", "continente": "África"},
    "República del Congo": {"slug": "republic-of-the-congo", "capital": "Brazzaville", "continente": "África"},
    "República Democrática del Congo": {"slug": "democratic-republic-of-the-congo", "capital": "Kinshasa", "continente": "África"},
    "Ruanda": {"slug": "rwanda", "capital": "Kigali", "continente": "África"},
    "Santo Tomé y Príncipe": {"slug": "sao-tome-and-principe", "capital": "Santo Tomé", "continente": "África"},
    "Senegal": {"slug": "senegal", "capital": "Dakar", "continente": "África"},
    "Seychelles": {"slug": "seychelles", "capital": "Victoria", "continente": "África"},
    "Sierra Leona": {"slug": "sierra-leone", "capital": "Freetown", "continente": "África"},
    "Somalia": {"slug": "somalia", "capital": "Mogadiscio", "continente": "África"},
    "Sudáfrica": {"slug": "south-africa", "capital": "Pretoria", "continente": "África"},
    "Sudán": {"slug": "sudan", "capital": "Jartum", "continente": "África"},
    "Sudán del Sur": {"slug": "south-sudan", "capital": "Yuba", "continente": "África"},
    "Tanzania": {"slug": "tanzania", "capital": "Dodoma", "continente": "África"},
    "Togo": {"slug": "togo", "capital": "Lomé", "continente": "África"},
    "Túnez": {"slug": "tunisia", "capital": "Túnez", "continente": "África"},
    "Uganda": {"slug": "uganda", "capital": "Kampala", "continente": "África"},
    "Yibuti": {"slug": "djibouti", "capital": "Yibuti", "continente": "África"},
    "Zambia": {"slug": "zambia", "capital": "Lusaka", "continente": "África"},
    "Zimbabue": {"slug": "zimbabwe", "capital": "Harare", "continente": "África"},
    # ---------- América del Norte ----------
    "Canadá": {"slug": "canada", "capital": "Ottawa", "continente": "América del Norte"},
    "Estados Unidos": {"slug": "united-states", "capital": "Washington D. C.", "continente": "América del Norte"},
    "México": {"slug": "mexico", "capital": "Ciudad de México", "continente": "América del Norte"},
    # ---------- América Central ----------
    "Belice": {"slug": "belize", "capital": "Belmopán", "continente": "América Central"},
    "Costa Rica": {"slug": "costa-rica", "capital": "San José", "continente": "América Central"},
    "El Salvador": {"slug": "el-salvador", "capital": "San Salvador", "continente": "América Central"},
    "Guatemala": {"slug": "guatemala", "capital": "Ciudad de Guatemala", "continente": "América Central"},
    "Honduras": {"slug": "honduras", "capital": "Tegucigalpa", "continente": "América Central"},
    "Nicaragua": {"slug": "nicaragua", "capital": "Managua", "continente": "América Central"},
    "Panamá": {"slug": "panama", "capital": "Ciudad de Panamá", "continente": "América Central"},
    # ---------- Caribe ----------
    "Antigua y Barbuda": {"slug": "antigua-and-barbuda", "capital": "Saint John's", "continente": "Caribe"},
    "Bahamas": {"slug": "bahamas", "capital": "Nasáu", "continente": "Caribe"},
    "Barbados": {"slug": "barbados", "capital": "Bridgetown", "continente": "Caribe"},
    "Cuba": {"slug": "cuba", "capital": "La Habana", "continente": "Caribe"},
    "Dominica": {"slug": "dominica", "capital": "Roseau", "continente": "Caribe"},
    "Granada": {"slug": "grenada", "capital": "Saint George's", "continente": "Caribe"},
    "Haití": {"slug": "haiti", "capital": "Puerto Príncipe", "continente": "Caribe"},
    "Jamaica": {"slug": "jamaica", "capital": "Kingston", "continente": "Caribe"},
    "República Dominicana": {"slug": "dominican-republic", "capital": "Santo Domingo", "continente": "Caribe"},
    "San Cristóbal y Nieves": {"slug": "saint-kitts-and-nevis", "capital": "Basseterre", "continente": "Caribe"},
    "San Vicente y las Granadinas": {"slug": "saint-vincent-and-the-grenadines", "capital": "Kingstown", "continente": "Caribe"},
    "Santa Lucía": {"slug": "saint-lucia", "capital": "Castries", "continente": "Caribe"},
    "Trinidad y Tobago": {"slug": "trinidad-and-tobago", "capital": "Puerto España", "continente": "Caribe"},
    # ---------- América del Sur ----------
    "Argentina": {"slug": "argentina", "capital": "Buenos Aires", "continente": "América del Sur"},
    "Bolivia": {"slug": "bolivia", "capital": "Sucre", "continente": "América del Sur"},
    "Brasil": {"slug": "brazil", "capital": "Brasilia", "continente": "América del Sur"},
    "Chile": {"slug": "chile", "capital": "Santiago", "continente": "América del Sur"},
    "Colombia": {"slug": "colombia", "capital": "Bogotá", "continente": "América del Sur"},
    "Ecuador": {"slug": "ecuador", "capital": "Quito", "continente": "América del Sur"},
    "Guyana": {"slug": "guyana", "capital": "Georgetown", "continente": "América del Sur"},
    "Paraguay": {"slug": "paraguay", "capital": "Asunción", "continente": "América del Sur"},
    "Perú": {"slug": "peru", "capital": "Lima", "continente": "América del Sur"},
    "Surinam": {"slug": "suriname", "capital": "Paramaribo", "continente": "América del Sur"},
    "Uruguay": {"slug": "uruguay", "capital": "Montevideo", "continente": "América del Sur"},
    "Venezuela": {"slug": "venezuela", "capital": "Caracas", "continente": "América del Sur"},
    # ---------- Oceanía ----------
    "Australia": {"slug": "australia", "capital": "Canberra", "continente": "Oceanía"},
    "Fiyi": {"slug": "fiji", "capital": "Suva", "continente": "Oceanía"},
    "Islas Marshall": {"slug": "marshall-islands", "capital": "Majuro", "continente": "Oceanía"},
    "Islas Salomón": {"slug": "solomon-islands", "capital": "Honiara", "continente": "Oceanía"},
    "Kiribati": {"slug": "kiribati", "capital": "Tarawa Sur", "continente": "Oceanía"},
    "Micronesia": {"slug": "micronesia", "capital": "Palikir", "continente": "Oceanía"},
    "Nauru": {"slug": "nauru", "capital": "Yaren", "continente": "Oceanía"},
    "Nueva Zelanda": {"slug": "new-zealand", "capital": "Wellington", "continente": "Oceanía"},
    "Palaos": {"slug": "palau", "capital": "Ngerulmud", "continente": "Oceanía"},
    "Papúa Nueva Guinea": {"slug": "papua-new-guinea", "capital": "Port Moresby", "continente": "Oceanía"},
    "Samoa": {"slug": "samoa", "capital": "Apia", "continente": "Oceanía"},
    "Tonga": {"slug": "tonga", "capital": "Nukualofa", "continente": "Oceanía"},
    "Tuvalu": {"slug": "tuvalu", "capital": "Funafuti", "continente": "Oceanía"},
    "Vanuatu": {"slug": "vanuatu", "capital": "Port Vila", "continente": "Oceanía"},
}


# ---------------------------------------------------------------------------
# LÓGICA
# ---------------------------------------------------------------------------

def continente_de(datos):
    return CARIBE_COMO if datos["continente"] == "Caribe" else datos["continente"]


def buscar_existente(db, nombre, slug):
    return (
        db.query(Country)
        .filter((Country.nombre == nombre) | (Country.slug == slug))
        .first()
    )


def seed_country(db, nombre, datos, verbose=True):
    existente = buscar_existente(db, nombre, datos["slug"])
    if existente:
        if not existente.slug:
            existente.slug = datos["slug"]  # migra países antiguos sin slug
        if verbose:
            print(f"[{nombre}] ya existía, se omite")
        return False

    db.add(
        Country(
            nombre=nombre,
            slug=datos["slug"],
            capital=datos["capital"],
            continente=continente_de(datos),
        )
    )
    if verbose:
        print(f"[{nombre}] creado ({datos['capital']}, {continente_de(datos)})")
    return True


def main():
    parser = argparse.ArgumentParser(description="Seed de países soberanos del mundo.")
    parser.add_argument("--paises", nargs="+", help="Solo estos países (nombre en español).")
    parser.add_argument("--continentes", nargs="+", help='Solo estos continentes (p. ej. Europa "América del Sur").')
    parser.add_argument("--dry-run", action="store_true", help="Simula, no guarda nada.")
    parser.add_argument("--silencioso", action="store_true", help="Log mínimo.")
    args = parser.parse_args()

    seleccion = {
        n: d
        for n, d in MUNDO.items()
        if (not args.paises or n in args.paises)
        and (not args.continentes or d["continente"] in args.continentes)
    }
    if args.paises:
        for n in set(args.paises) - set(MUNDO):
            print(f"Aviso: '{n}' no está en MUNDO, se omite")

    db = SessionLocal()
    creados = 0
    try:
        for nombre, datos in seleccion.items():
            if seed_country(db, nombre, datos, verbose=not args.silencioso):
                creados += 1

        if args.dry_run:
            db.rollback()
            print(f"\nDry-run: se crearían {creados} países. No se ha guardado nada.")
        else:
            db.commit()
            print(f"\nSeed completado: {creados} países nuevos, {len(seleccion) - creados} ya existían.")
    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
