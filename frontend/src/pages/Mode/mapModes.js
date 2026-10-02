// The different map-based ways to play. Shared by the Maps page (/mapas) and by the
// "Play on the map" section of the mode page (/modo).
export const MAP_MODES = [
  {
    code: 'MAP',
    title: 'Interactive map',
    desc: 'Explore the whole globe, zoom in, and pick a country by tapping directly on the map.',
    to: '/mapa-mundial',
  },
  {
    code: 'CTY',
    title: 'World countries',
    desc: 'Name all 197 countries of the world and watch the world map fill in, from memory.',
    to: '/mapa-de-paises',
  },
  {
    code: 'ADM',
    title: 'World subdivisions',
    desc: 'Name every province, state and region on Earth, and watch the map fill in. Pick the whole world or one continent.',
    to: '/regiones-del-mundo',
  },
];
