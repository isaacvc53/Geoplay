// Slugs de país para el mapa mundial (extraído de mapa-mundial.html).
// Los nombres del topojson de world-atlas a veces van abreviados y no
// coinciden con los nombres de archivo de data/countries/*.js: aquí se
// fuerzan los casos conocidos. Los valores deben coincidir con los archivos
// reales (algunos, como "camerun", están en español a propósito).

export const COUNTRY_SLUG_OVERRIDES = {
  'United States of America': 'united-states',
  'Dem. Rep. Congo': 'democratic-republic-of-the-congo',
  'Congo': 'republic-of-the-congo',
  'Central African Rep.': 'central-african',
  'Burkina Faso': 'burkina',
  'Cameroon': 'camerun',
  'Dominican Rep.': 'dominican-republic',
  'Eq. Guinea': 'equatorial-guinea',
  'Bosnia and Herz.': 'bosnia',
  'S. Sudan': 'south-sudan',
  'W. Sahara': 'western-sahara',
  'Solomon Is.': 'solomon-islands',
  'Antigua and Barb.': 'antigua-and-barbuda',
  'St. Vin. and Gren.': 'saint-vincent-and-the-grenadines',
  'Ivory Coast': 'cote-d-ivoire',
  'Timor-Leste': 'east-timor',
  'Fr. S. Antarctic Lands': 'french-southern-and-antarctic-lands',
  'Falkland Is.': 'falkland-islands',
  'N. Cyprus': 'northern-cyprus',
  'Somaliland': 'somaliland',
};

// Países "deshabilitados": rayados, sin panel al hacer clic. Usa el nombre
// tal cual aparece en properties.name del topojson.
export const DISABLED_COUNTRIES = new Set(['Antarctica']);

export function countrySlug(feature) {
  const rawName = feature?.properties?.name || '';
  if (COUNTRY_SLUG_OVERRIDES[rawName]) return COUNTRY_SLUG_OVERRIDES[rawName];
  return rawName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
