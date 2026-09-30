// El slug de cada país ya viene resuelto en public/data/world-map.json
// (lo genera scripts/build-world-map.py a partir de scripts/world.svg; los
// casos especiales como "camerun" o "usa" están en SLUG_OVERRIDES de ese script).
// `feature` = { id, properties: { name, slug }, d, main? }.
export function countrySlug(feature) {
  return feature?.properties?.slug || '';
}
