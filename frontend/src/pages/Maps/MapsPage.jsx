import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// "More ways to play". Step 1: two main options. Step 2 (?seccion=...): the choices inside one of them.
// The artwork is the same world-map silhouette as the home atlas card, cropped with a viewBox.
// To add a map, add an entry to MAPS; to add a continent, add it to CONTINENTS.

// viewBox crops of the world map (1010 x 666). WIDE ≈ 2:1, STD = 3:2.
const BOX = {
  worldWide: '0 80 1010 505',
  worldStd: '0 0 1010 666',
  europeWide: '380 170 300 150',
  europa: '400 165 270 180',
  asia: '560 140 450 300',
  africa: '335 335 375 250',
  america: '-150 185 705 470',
  oceania: '670 395 345 230',
};

const MAPS = [
  {
    title: 'First-level subdivisions', box: BOX.worldWide, variant: 'lines', to: '/regiones-del-mundo', cta: 'Choose a zone',
    desc: 'Name every province, state and region on Earth and watch each country break down into its parts.',
    meta: ['Provinces · States · Regions', 'Whole world or one continent', 'From memory'],
  },
  {
    title: 'Countries of the world', box: BOX.worldWide, variant: 'fill', to: '/mapa-de-paises', cta: 'Play',
    desc: 'Name all 197 countries from memory and watch the world map fill in, one country at a time.',
    meta: ['197 countries', 'Interactive map', 'From memory'],
  },
  { title: 'More maps', box: BOX.worldWide, variant: 'ghost', soon: true, desc: 'A new way to play the map is on its way.', meta: [] },
  { title: 'More maps', box: BOX.worldWide, variant: 'ghost', soon: true, desc: 'A new way to play the map is on its way.', meta: [] },
];

const CONTINENTS = [
  { label: 'Europe', key: 'europa' },
  { label: 'Asia', key: 'asia' },
  { label: 'Africa', key: 'africa' },
  { label: 'Americas', key: 'america' },
  { label: 'Oceania', key: 'oceania' },
];

const MAIN = [
  {
    id: 'maps', title: 'Varied maps', box: BOX.worldWide, variant: 'fill', cta: 'See the maps',
    desc: 'Different ways to name the world, from its countries down to its provinces.',
    meta: ['First-level subdivisions', 'Countries of the world', 'More soon'],
  },
  {
    id: 'country', title: 'One country', box: BOX.europeWide, variant: 'lines', cta: 'Choose a continent',
    desc: 'Pick one specific country and name each of its divisions on its own map.',
    meta: ['5 continents', 'Any country', 'Its provinces & regions'],
  },
];

const VIEWS = {
  maps: { title: 'Varied maps', desc: 'Choose the kind of map you want to play.', cards: MAPS, cols: 'two' },
  country: {
    title: 'One country', desc: 'Choose a continent to see its countries.', cols: 'three',
    cards: [
      ...CONTINENTS.map((c) => ({
        title: c.label, box: BOX[c.key], variant: 'lines', to: `/paises?zona=${c.key}`, cta: 'See countries',
        desc: 'Pick a country and play its divisions.', meta: [], std: true,
      })),
      { title: 'Pick on the globe', box: BOX.worldStd, variant: 'fill', to: '/mapa-mundial', cta: 'Open the atlas', desc: 'Any country, straight from the map.', meta: [], std: true },
    ],
  },
};

function useWorldPaths() {
  const [paths, setPaths] = useState([]);
  useEffect(() => {
    let cancelled = false;
    import('../Menu/worldPaths').then((m) => { if (!cancelled) setPaths(m.WORLD_PATHS); });
    return () => { cancelled = true; };
  }, []);
  return paths;
}

function Card({ c, paths, onClick, delay = 0 }) {
  const art = (
    <div className={'mx-art ' + (c.std ? 'std' : 'wide')}>
      <span className="mx-tick tl" /><span className="mx-tick tr" /><span className="mx-tick bl" /><span className="mx-tick br" />
      <svg className={`mx-world ${c.variant}`} viewBox={c.box} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g>{paths.map((d, i) => <path key={i} d={d} />)}</g>
      </svg>
      {c.soon && <span className="pill soon mx-soon">Coming soon</span>}
    </div>
  );
  const body = (
    <div className="mx-body">
      <h2>{c.title}</h2>
      <p>{c.desc}</p>
      {c.meta.length > 0 && <ul className="mx-meta">{c.meta.map((m) => <li key={m}>{m}</li>)}</ul>}
      {!c.soon && <span className="mx-cta">{c.cta} <span className="arrow" aria-hidden="true">→</span></span>}
    </div>
  );
  const style = { animationDelay: `${delay}s` };
  if (c.soon) return <div className="mx-card soon" style={style} aria-disabled="true">{art}{body}</div>;
  if (onClick) return <button type="button" className="mx-card" style={style} onClick={onClick}>{art}{body}</button>;
  return <Link className="mx-card" style={style} to={c.to}>{art}{body}</Link>;
}

export default function MapsPage() {
  const [params, setParams] = useSearchParams();
  const view = VIEWS[params.get('seccion')];
  const paths = useWorldPaths();

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
            <div className={'mx-grid ' + view.cols}>
              {view.cards.map((c, i) => <Card c={c} paths={paths} key={c.title + i} delay={i * 0.05} />)}
            </div>
          ) : (
            <div className="mx-grid two">
              {MAIN.map((m, i) => <Card c={m} paths={paths} key={m.id} delay={i * 0.07} onClick={() => setParams({ seccion: m.id })} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
