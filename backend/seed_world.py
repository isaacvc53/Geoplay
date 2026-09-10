from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName
from database.connection import SessionLocal


WORLD_NAME = "Mundo"

COUNTRIES = [
    ('Afganistán', 'Afghanistan', []),
    ('Albania', 'Albania', []),
    ('Alemania', 'Germany', []),
    ('Andorra', 'Andorra', []),
    ('Angola', 'Angola', []),
    ('Antigua y Barbuda', 'Antigua and Barbuda', []),
    ('Arabia Saudita', 'Saudi Arabia', []),
    ('Argelia', 'Algeria', []),
    ('Argentina', 'Argentina', []),
    ('Armenia', 'Armenia', []),
    ('Australia', 'Australia', []),
    ('Austria', 'Austria', []),
    ('Azerbaiyán', 'Azerbaijan', []),
    ('Bahamas', 'Bahamas', []),
    ('Baréin', 'Bahrain', []),
    ('Bangladés', 'Bangladesh', []),
    ('Barbados', 'Barbados', []),
    ('Bélgica', 'Belgium', []),
    ('Belice', 'Belize', []),
    ('Benín', 'Benin', []),
    ('Bielorrusia', 'Belarus', []),
    ('Bolivia', 'Bolivia', ['Bolivia (Plurinational State of)']),
    ('Bosnia y Herzegovina', 'Bosnia and Herzegovina', []),
    ('Botsuana', 'Botswana', []),
    ('Brasil', 'Brazil', []),
    ('Brunéi', 'Brunei', ['Brunei Darussalam']),
    ('Bulgaria', 'Bulgaria', []),
    ('Burkina Faso', 'Burkina Faso', []),
    ('Burundi', 'Burundi', []),
    ('Bután', 'Bhutan', []),
    ('Cabo Verde', 'Cape Verde', ['Cape Verde']),
    ('Camboya', 'Cambodia', []),
    ('Camerún', 'Cameroon', []),
    ('Canadá', 'Canada', []),
    ('Catar', 'Qatar', []),
    ('Chad', 'Chad', []),
    ('Chile', 'Chile', []),
    ('China', 'China', []),
    ('Chipre', 'Cyprus', []),
    ('Colombia', 'Colombia', []),
    ('Comoras', 'Comoros', []),
    ('Congo', 'Congo', ['Republic of the Congo', 'Congo-Brazzaville']),
    ('Corea del Norte', 'North Korea', ["Democratic People's Republic of Korea", 'DPRK', 'North Korea']),
    ('Corea del Sur', 'South Korea', ['Republic of Korea', 'South Korea']),
    ('Costa de Marfil', "Côte d'Ivoire", ['Ivory Coast']),
    ('Costa Rica', 'Costa Rica', []),
    ('Croacia', 'Croatia', []),
    ('Cuba', 'Cuba', []),
    ('Dinamarca', 'Denmark', []),
    ('Dominica', 'Dominica', []),
    ('Ecuador', 'Ecuador', []),
    ('Egipto', 'Egypt', []),
    ('El Salvador', 'El Salvador', []),
    ('Emiratos Árabes Unidos', 'United Arab Emirates', ['EAU', 'UAE']),
    ('Eritrea', 'Eritrea', []),
    ('Eslovaquia', 'Slovakia', []),
    ('Eslovenia', 'Slovenia', []),
    ('España', 'Spain', []),
    ('Estados Unidos', 'United States', ['EEUU', 'EE UU', 'USA', 'US', 'United States of America']),
    ('Estonia', 'Estonia', []),
    ('Esuatini', 'Eswatini', ['Swaziland']),
    ('Etiopía', 'Ethiopia', []),
    ('Fiji', 'Fiji', []),
    ('Filipinas', 'Philippines', []),
    ('Finlandia', 'Finland', []),
    ('Francia', 'France', []),
    ('Gabón', 'Gabon', []),
    ('Gambia', 'Gambia', []),
    ('Georgia', 'Georgia', []),
    ('Ghana', 'Ghana', []),
    ('Granada', 'Grenada', []),
    ('Grecia', 'Greece', []),
    ('Guatemala', 'Guatemala', []),
    ('Guinea', 'Guinea', []),
    ('Guinea-Bisáu', 'Guinea-Bissau', []),
    ('Guinea Ecuatorial', 'Equatorial Guinea', []),
    ('Guyana', 'Guyana', []),
    ('Haití', 'Haiti', []),
    ('Honduras', 'Honduras', []),
    ('Hungría', 'Hungary', []),
    ('India', 'India', []),
    ('Indonesia', 'Indonesia', []),
    ('Irak', 'Iraq', []),
    ('Irán', 'Iran', []),
    ('Irlanda', 'Ireland', []),
    ('Islandia', 'Iceland', []),
    ('Islas Marshall', 'Marshall Islands', []),
    ('Islas Salomón', 'Solomon Islands', []),
    ('Israel', 'Israel', []),
    ('Italia', 'Italy', []),
    ('Jamaica', 'Jamaica', []),
    ('Japón', 'Japan', []),
    ('Jordania', 'Jordan', []),
    ('Kazajistán', 'Kazakhstan', []),
    ('Kenia', 'Kenya', []),
    ('Kirguistán', 'Kyrgyzstan', []),
    ('Kiribati', 'Kiribati', []),
    ('Kosovo', 'Kosovo', ['Republic of Kosovo']),
    ('Kuwait', 'Kuwait', []),
    ('Laos', 'Laos', ["Lao People's Democratic Republic", 'Lao PDR']),
    ('Lesoto', 'Lesotho', []),
    ('Letonia', 'Latvia', []),
    ('Líbano', 'Lebanon', []),
    ('Liberia', 'Liberia', []),
    ('Libia', 'Libya', []),
    ('Liechtenstein', 'Liechtenstein', []),
    ('Lituania', 'Lithuania', []),
    ('Luxemburgo', 'Luxembourg', []),
    ('Madagascar', 'Madagascar', []),
    ('Malasia', 'Malaysia', []),
    ('Malaui', 'Malawi', []),
    ('Maldivas', 'Maldives', []),
    ('Malí', 'Mali', []),
    ('Malta', 'Malta', []),
    ('Marruecos', 'Morocco', []),
    ('Mauricio', 'Mauritius', []),
    ('Mauritania', 'Mauritania', []),
    ('México', 'Mexico', []),
    ('Micronesia', 'Micronesia', ['Federated States of Micronesia']),
    ('Moldavia', 'Moldova', ['Republic of Moldova', 'Moldova Republic']),
    ('Mónaco', 'Monaco', []),
    ('Mongolia', 'Mongolia', []),
    ('Montenegro', 'Montenegro', []),
    ('Mozambique', 'Mozambique', []),
    ('Myanmar', 'Myanmar', ['Burma']),
    ('Namibia', 'Namibia', []),
    ('Nauru', 'Nauru', []),
    ('Nepal', 'Nepal', []),
    ('Nicaragua', 'Nicaragua', []),
    ('Níger', 'Niger', []),
    ('Nigeria', 'Nigeria', []),
    ('Noruega', 'Norway', []),
    ('Nueva Zelanda', 'New Zealand', []),
    ('Omán', 'Oman', []),
    ('Países Bajos', 'Netherlands', ['Netherlands', 'Holland']),
    ('Pakistán', 'Pakistan', []),
    ('Palaos', 'Palau', []),
    ('Panamá', 'Panama', []),
    ('Papúa Nueva Guinea', 'Papua New Guinea', []),
    ('Paraguay', 'Paraguay', []),
    ('Perú', 'Peru', []),
    ('Polonia', 'Poland', []),
    ('Portugal', 'Portugal', []),
    ('Reino Unido', 'United Kingdom', ['UK', 'United Kingdom of Great Britain and Northern Ireland', 'Britain', 'Great Britain']),
    ('República Centroafricana', 'Central African Republic', []),
    ('República Checa', 'Czechia', ['Czech Republic']),
    ('República Democrática del Congo', 'Democratic Republic of the Congo', ['DR Congo', 'DRC', 'Democratic Republic of Congo', 'Congo-Kinshasa']),
    ('República Dominicana', 'Dominican Republic', []),
    ('Macedonia del Norte', 'North Macedonia', ['North Macedonia', 'Macedonia']),
    ('Ruanda', 'Rwanda', []),
    ('Rumanía', 'Romania', []),
    ('Rusia', 'Russia', ['Russian Federation']),
    ('Samoa', 'Samoa', []),
    ('San Cristóbal y Nieves', 'Saint Kitts and Nevis', []),
    ('San Marino', 'San Marino', []),
    ('San Vicente y las Granadinas', 'Saint Vincent and the Grenadines', []),
    ('Santa Lucía', 'Saint Lucia', []),
    ('Santo Tomé y Príncipe', 'Sao Tome and Principe', ['Sao Tome & Principe']),
    ('Senegal', 'Senegal', []),
    ('Serbia', 'Serbia', []),
    ('Seychelles', 'Seychelles', []),
    ('Sierra Leona', 'Sierra Leone', []),
    ('Singapur', 'Singapore', []),
    ('Siria', 'Syria', []),
    ('Somalia', 'Somalia', []),
    ('Sri Lanka', 'Sri Lanka', []),
    ('Sudáfrica', 'South Africa', []),
    ('Sudán', 'Sudan', []),
    ('Sudán del Sur', 'South Sudan', []),
    ('Suecia', 'Sweden', []),
    ('Suiza', 'Switzerland', []),
    ('Surinam', 'Suriname', []),
    ('Tailandia', 'Thailand', []),
    ('Taiwán', 'Taiwan', ['Formosa']),
    ('Tanzania', 'Tanzania', ['United Republic of Tanzania']),
    ('Tayikistán', 'Tajikistan', []),
    ('Timor-Leste', 'Timor-Leste', ['East Timor']),
    ('Togo', 'Togo', []),
    ('Tonga', 'Tonga', []),
    ('Trinidad y Tobago', 'Trinidad and Tobago', []),
    ('Túnez', 'Tunisia', []),
    ('Turkmenistán', 'Turkmenistan', []),
    ('Turquía', 'Turkey', ['Türkiye']),
    ('Tuvalu', 'Tuvalu', []),
    ('Ucrania', 'Ukraine', []),
    ('Uganda', 'Uganda', []),
    ('Uruguay', 'Uruguay', []),
    ('Uzbekistán', 'Uzbekistan', []),
    ('Vanuatu', 'Vanuatu', []),
    ('Vaticano', 'Vatican City', ['Holy See', 'Vatican']),
    ('Venezuela', 'Venezuela', []),
    ('Vietnam', 'Vietnam', ['Viet Nam']),
    ('Yemen', 'Yemen', []),
    ('Yibuti', 'Djibouti', []),
    ('Zambia', 'Zambia', []),
    ('Zimbabue', 'Zimbabwe', []),
]

def _get_or_create_world(db):
    world = db.query(Country).filter(Country.nombre == WORLD_NAME).first()
    if world is None:
        world = Country(nombre=WORLD_NAME, capital="", continente="Mundo")
        db.add(world)
        db.flush()
    return world

def _upsert_name(db, region_id, language, name):
    existing = (
        db.query(RegionName)
        .filter(
            RegionName.region_id == region_id,
            RegionName.language == language,
            RegionName.name == name,
        )
        .first()
    )
    if existing is None:
        db.add(RegionName(region_id=region_id, language=language, name=name))

def seed_world():
    db = SessionLocal()
    try:
        world = _get_or_create_world(db)

        for spanish, english, extra_names in COUNTRIES:
            region = (
                db.query(Region)
                .filter(Region.country_id == world.id)
                .join(Region.names)
                .filter(RegionName.language == "es", RegionName.name == spanish)
                .first()
            )
            if region is None:
                region = Region(country_id=world.id)
                db.add(region)
                db.flush()

            _upsert_name(db, region.id, "es", spanish)
            _upsert_name(db, region.id, "en", english)
            for alias in extra_names:
                _upsert_name(db, region.id, "alias", alias)

        db.commit()
        count = db.query(Region).filter(Region.country_id == world.id).count()
        print(f"Mundo cargado correctamente: {count} países/regiones.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_world()
