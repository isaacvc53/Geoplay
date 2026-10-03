// El slug de cada país ya viene resuelto en public/data/world-map.json
// (lo genera tools/build-world-map.mjs a partir de Natural Earth; para los 197 países de
// backend/paises_meta.json es su `slug_archivo`, y para los territorios, la tabla TERRITORIES de ese script).
// `feature` = { id, properties: { name, slug }, d, main? }.
export function countrySlug(feature) {
  return feature?.properties?.slug || '';
}
