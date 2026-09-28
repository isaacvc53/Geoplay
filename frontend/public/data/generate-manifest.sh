#!/bin/bash
# frontend/data/generate-manifest.sh
#
# Genera frontend/data/available-countries.json: un array JSON con los
# slugs de todos los países que tienen A LA VEZ
#   data/countries/<slug>.js
#   data/geo/<slug>.svg
#
# mapa-mundial.html hace UNA sola petición a ese archivo en vez de
# comprobar país por país (240+ peticiones HEAD) en cada carga.
#
# Uso manual:
#   cd frontend/data
#   bash generate-manifest.sh
#
# (Se integra automáticamente en el build de Docker; ver más abajo.)

set -e
cd "$(dirname "$0")"

slugs=()
for jsfile in countries/*.js; do
  [ -e "$jsfile" ] || continue   # carpeta vacía: no hacer nada raro
  slug=$(basename "$jsfile" .js)
  if [ -f "geo/${slug}.svg" ]; then
    slugs+=("\"$slug\"")
  fi
done

if [ ${#slugs[@]} -eq 0 ]; then
  echo "[]" > available-countries.json
  echo "Aviso: no se encontró ningún país con .js y .svg a la vez." >&2
else
  IFS=,
  echo "[${slugs[*]}]" > available-countries.json
  unset IFS
fi

echo "available-countries.json escrito con ${#slugs[@]} país(es)."
