import { Link, useSearchParams } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// "More ways to play". Step 1: two main options. Step 2 (?seccion=...): the choices inside one of them.
// To add a map, add a tile to MAPS below; to add a continent, add it to CONTINENTS.

const MAPS = [
  { label: 'First-level subdivisions', hint: 'Provinces, states and regions: the whole world or one continent.', icon: '🗺️', to: '/regiones-del-mundo' },
  { label: 'Countries of the world', hint: 'Name all 197 countries and watch the map fill in.', icon: '🌐', to: '/mapa-de-paises' },
  { label: 'Coming soon', hint: 'A new map is on its way.', icon: '✨', soon: true },
  { label: 'Coming soon', hint: 'A new map is on its way.', icon: '✨', soon: true },
];

const CONTINENTS = [
  { label: 'Europe', key: 'europa', icon: '🌍' },
  { label: 'Asia', key: 'asia', icon: '🌏' },
  { label: 'Africa', key: 'africa', icon: '🌍' },
  { label: 'Americas', key: 'america', icon: '🌎' },
  { label: 'Oceania', key: 'oceania', icon: '🌏' },
];

const MAIN = [
  { id: 'maps', icon: '🗺️', title: 'Varied maps', desc: 'First-level subdivisions, countries of the world and more.', cta: 'See maps' },
  { id: 'country', icon: '📍', title: 'One country', desc: 'Pick a specific country and play its divisions.', cta: 'Choose a continent' },
];

const VIEWS = {
  maps: {
    title: 'Varied maps', desc: 'Choose the kind of map you want to play.',
    tiles: MAPS,
  },
  country: {
    title: 'One country', desc: 'Choose a continent to see its countries.',
    tiles: [
      ...CONTINENTS.map((c) => ({ label: c.label, hint: 'See its countries', icon: c.icon, to: `/paises?zona=${c.key}` })),
      { label: 'Pick on the globe', hint: 'Any country, straight from the map', icon: '🧭', to: '/mapa-mundial' },
    ],
  },
};

function Tile({ t }) {
  const inner = (
    <>
      <span className="mx-tile-icon" aria-hidden="true">{t.icon}</span>
      <span className="mx-tile-text">
        <span className="mx-tile-label">{t.label}</span>
        <span className="mx-tile-hint">{t.hint}</span>
      </span>
    </>
  );
  return t.soon
    ? <div className="mx-tile soon" aria-disabled="true">{inner}</div>
    : <Link className="mx-tile" to={t.to}>{inner}</Link>;
}

export default function MapsPage() {
  const [params, setParams] = useSearchParams();
  const view = VIEWS[params.get('seccion')];

  return (
    <div className="menu-page maps-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="mx-shell">
          {view
            ? <button type="button" className="btn-back mx-back" onClick={() => setParams({})}><span>←</span> Back</button>
            : <Link className="btn-back mx-back" to="/"><span>←</span> Main menu</Link>}

          <header className="mx-hero">
            <span className="mx-eyebrow">{view ? 'Choose' : 'Beyond the atlas'}</span>
            <h1>{view ? view.title : <>More ways to <i>play</i></>}</h1>
            <p>{view ? view.desc : 'Pick a mode to get started.'}</p>
          </header>

          {view ? (
            <section className="mx-section" aria-label={view.title}>
              <div className="mx-tiles">{view.tiles.map((t, i) => <Tile t={t} key={t.label + i} />)}</div>
            </section>
          ) : (
            <div className="mx-main">
              {MAIN.map((m, i) => (
                <button type="button" className="mx-main-card" key={m.id} style={{ animationDelay: `${i * 0.06}s` }} onClick={() => setParams({ seccion: m.id })}>
                  <span className="mx-main-icon" aria-hidden="true">{m.icon}</span>
                  <h2>{m.title}</h2>
                  <p>{m.desc}</p>
                  <span className="mx-main-cta">{m.cta} <span aria-hidden="true">→</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
