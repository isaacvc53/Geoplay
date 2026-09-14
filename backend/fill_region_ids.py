"""
Rellena los `region_id: null` de un fichero de país (como bolivia.js)
consultando la base de datos y haciendo match por nombre.

FLUJO:
    1. Ejecuta primero el seed del país (p. ej. seed_sudamerica.py --paises Bolivia).
    2. Ejecuta este script apuntando al fichero JS del frontend.
    3. Revisa el aviso final: cualquier región sin match hay que resolverla
       a mano (normalmente porque el nombre en el JS no coincide con
       ninguno de los guardados en RegionName para ese país).

USO:
    python fill_region_ids.py data/countries/bolivia.js Bolivia
    python fill_region_ids.py data/countries/bolivia.js Bolivia --salida bolivia_actualizado.js

El matching prueba, para cada región del JS, todos sus "names" y su
"display" contra los nombres guardados en BD (case-insensitive, sin
tildes) — así "Beni", "Potosí"/"Potosi", etc. encuentran su fila aunque
la grafía no sea idéntica.
"""

import argparse
import re
import unicodedata

from database.connection import SessionLocal
from models.country_db import Country


def normalizar(texto):
    """minúsculas y sin tildes, para comparar 'Potosí' con 'Potosi'."""
    texto = texto.strip().lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )


def cargar_datos_pais(nombre_pais):
    """Devuelve (country_id, {nombre_normalizado: region_id}) para el país dado."""
    db = SessionLocal()
    try:
        country = db.query(Country).filter(Country.nombre == nombre_pais).first()
        if not country:
            raise ValueError(f"No existe el país '{nombre_pais}' en la tabla countries")

        mapa = {}
        for region in country.regiones:
            for rn in region.names:
                mapa[normalizar(rn.name)] = region.id
        return country.id, mapa
    finally:
        db.close()


def insertar_country_id(contenido, country_id):
    """Añade o corrige el `id` de país a nivel superior del objeto (para
    estadísticas). game.js espera exactamente `country.id`, no `countryId`.
    """
    # Migra un `countryId` insertado por una versión anterior de este script.
    contenido = re.sub(
        r"countryId\s*:\s*\d+,\n", f"id: {country_id},\n", contenido, count=1
    )

    # Si ya hay un `id: <número>` a nivel de país (numérico, para no
    # confundirlo con los `id: "BOB"` de cada región, que son strings).
    if re.search(r"\bid\s*:\s*\d+\b", contenido):
        return re.sub(r"\bid\s*:\s*\d+\b", f"id: {country_id}", contenido, count=1)

    # Se inserta justo después de "slug: ...", que está presente en todos
    # los ficheros de país y es un ancla fiable cerca del principio.
    nueva_contenido, n = re.subn(
        r'(slug:\s*"[^"]+",\n)',
        r"\1  id: " + str(country_id) + ",\n",
        contenido,
        count=1,
    )
    if n == 0:
        print("AVISO: no se encontró 'slug:' para insertar id de país — añádelo a mano.")
        return contenido
    return nueva_contenido


def extraer_names(bloque):
    m = re.search(r"names:\s*\[(.*?)\]", bloque, re.DOTALL)
    if not m:
        return []
    return re.findall(r'"([^"]+)"', m.group(1))


def rellenar_region_ids(ruta_js, nombre_pais, ruta_salida=None):
    country_id, mapa_nombres = cargar_datos_pais(nombre_pais)

    with open(ruta_js, "r", encoding="utf-8") as f:
        contenido = f.read()

    contenido = insertar_country_id(contenido, country_id)

    # Cada región es un objeto plano {...} sin llaves anidadas dentro
    # (solo tiene un array "names": [...] con strings), así que este
    # patrón captura cada bloque de región de forma fiable.
    bloques = re.findall(r"\{[^{}]*\}", contenido, re.DOTALL)

    sin_match = []
    contenido_nuevo = contenido

    for bloque in bloques:
        if "region_id" not in bloque:
            continue  # no es un bloque de región

        nombres_candidatos = extraer_names(bloque)

        display_match = re.search(r'display:\s*"([^"]+)"', bloque)
        if display_match:
            nombres_candidatos.append(display_match.group(1))

        region_id_encontrado = None
        for nombre in nombres_candidatos:
            clave = normalizar(nombre)
            if clave in mapa_nombres:
                region_id_encontrado = mapa_nombres[clave]
                break

        id_match = re.search(r'id:\s*"([^"]+)"', bloque)
        codigo = id_match.group(1) if id_match else "???"

        if region_id_encontrado is None:
            sin_match.append((codigo, nombres_candidatos))
            continue

        bloque_actualizado = re.sub(
            r"region_id:\s*null", f"region_id: {region_id_encontrado}", bloque
        )
        contenido_nuevo = contenido_nuevo.replace(bloque, bloque_actualizado, 1)

    destino = ruta_salida or ruta_js
    with open(destino, "w", encoding="utf-8") as f:
        f.write(contenido_nuevo)

    print(f"Actualizado: {destino}")

    if sin_match:
        print("\nAVISO: no se encontró region_id para estos códigos — revísalos a mano:")
        for codigo, nombres in sin_match:
            print(f"  - {codigo}: {nombres}")
    else:
        print("Todas las regiones encontraron su region_id correctamente.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Rellena region_id en un fichero JS de país usando la base de datos."
    )
    parser.add_argument("archivo_js", help="Ruta al fichero JS, p.ej. data/countries/bolivia.js")
    parser.add_argument("pais", help="Nombre del país tal cual está en la tabla countries, p.ej. Bolivia")
    parser.add_argument(
        "--salida",
        help="Ruta de salida. Por defecto sobrescribe el mismo archivo de entrada.",
    )
    args = parser.parse_args()

    rellenar_region_ids(args.archivo_js, args.pais, args.salida)
