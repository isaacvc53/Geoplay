import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// "More ways to play". Step 1: a few main options. Step 2 (?seccion=...): the choices inside one option.
// Silhouettes come from /data/geo/<slug>.svg (the same files the country game uses).

const sil = (slug) => `url(/data/geo/${slug}.svg)`;

function Sil({ slug, className = '' }) {
  return <span className={`mx-sil ${className}`} style={{ WebkitMaskImage: sil(slug), maskImage: sil(slug) }} aria-hidden="true" />;
}

const CONTINENTS = [
  { label: 'Europe', key: 'europa', sils: ['france', 'italy', 'poland'] },
  { label: 'Asia', key: 'asia', sils: ['china', 'india', 'japan'] },
  { label: 'Africa', key: 'africa', sils: ['egypt', 'kenya', 'south-africa'] },
  { label: 'Americas', key: 'america', sils: ['usa', 'brazil', 'mexico'] },
  { label: 'Oceania', key: 'oceania', sils: ['australia', 'new-zealand'] },
];

// Most played first; the rest of the manifest follows alphabetically.
const POPULAR = [
  'spain', 'france', 'italy', 'germany', 'portugal', 'united-kingdom', 'usa', 'canada', 'mexico', 'brazil', 'argentina',
  'colombia', 'peru', 'chile', 'china', 'japan', 'india', 'turkey', 'russia', 'egypt', 'morocco', 'australia', 'poland', 'netherlands',
];
const NAME_FIX = {
  usa: 'USA', camerun: 'Cameroon', burkina: 'Burkina Faso', bosnia: 'Bosnia & Herzegovina', macedonia: 'North Macedonia',
  'central-african': 'Central African Rep.', 'cote-d-ivoire': "Côte d'Ivoire", 'east-timor': 'East Timor',
  'democratic-republic-of-the-congo': 'DR Congo', 'republic-of-the-congo': 'Rep. of the Congo', 'united-kingdom': 'United Kingdom',
};
const nameOf = (slug) => NAME_FIX[slug] || slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

// Playable countries from the manifest the deploy generates; if it fails, just the popular ones.
function useCountrySlugs() {
  const [slugs, setSlugs] = useState(POPULAR);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/available-countries.json')
      .then((res) => {
        const type = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || type.includes('text/html')) throw new Error('no manifest');
        return res.json();
      })
      .then((list) => {
        if (cancelled || !Array.isArray(list) || !list.length) return;
        const clean = list.filter((s) => /^[a-z0-9-]+$/.test(s));
        const rest = clean.filter((s) => !POPULAR.includes(s)).sort();
        setSlugs([...POPULAR.filter((s) => clean.includes(s)), ...rest]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return slugs;
}

// Main options: `view` opens a second step, `to` goes straight into the game.
const MAIN = [
  { id: 'countries', icon: '🌐', title: 'Countries of the world', desc: 'Name all 197 countries and watch the world map fill in.', to: '/mapa-de-paises', cta: 'Play', sils: ['usa', 'china', 'brazil'] },
  { id: 'regions', icon: '🗺️', title: 'Provinces, states & regions', desc: 'Name the provinces, states and regions of every country, all on one map.', view: true, cta: 'Choose a continent', sils: ['spain', 'france'] },
  { id: 'country', icon: '📍', title: 'One country', desc: 'Pick a country by its shape and name its divisions.', view: true, cta: 'Choose a country', sils: ['italy', 'japan'] },
  { id: 'multi', icon: '⚔️', title: 'Multiplayer', desc: 'Challenge a friend to a 1 vs 1 on the same country.', to: '/multijugador', cta: 'Play', sils: ['canada'] },
  { id: 'progress', icon: '📊', title: 'Progress', desc: 'Your records, badges and how you compare.', view: true, cta: '3 options', sils: ['mexico'] },
];

const PROGRESS = [
  { label: 'Statistics', hint: 'Records & history', icon: '📊', to: '/perfil' },
  { label: 'Achievements', hint: 'Badges', icon: '🏆', to: '/perfil' },
  { label: 'Compare', hint: 'With a friend', icon: '🤝', to: '/comparar' },
];

function RegionsView() {
  const tiles = [{ label: 'Whole world', hint: 'All continents at once', to: '/regiones-del-mundo?zona=mundo', sils: ['usa', 'china', 'brazil', 'egypt'] },
    ...CONTINENTS.map((c) => ({ label: c.label, hint: 'Provinces & regions', to: `/regiones-del-mundo?zona=${c.key}`, sils: c.sils }))];
  return (
    <div className="mx-tiles big">
      {tiles.map((t) => (
        <Link className="mx-tile tall" to={t.to} key={t.to}>
          <span className="mx-sils">{t.sils.map((s) => <Sil key={s} slug={s} />)}</span>
          <span className="mx-tile-label">{t.label}</span>
          <span className="mx-tile-hint">{t.hint}</span>
        </Link>
      ))}
    </div>
  );
}

function CountryView() {
  const slugs = useCountrySlugs();
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? slugs.filter((s) => nameOf(s).toLowerCase().includes(n)) : slugs;
  }, [slugs, q]);
  return (
    <>
      <div className="mx-search">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a country…" aria-label="Search a country" />
        <Link className="mx-browse" to="/mapa-mundial">Or pick on the globe →</Link>
      </div>
      <div className="mx-tiles sils">
        {shown.map((s) => (
          <Link className="mx-tile tall" to={`/pais?pais=${s}`} key={s}>
            <span className="mx-sils single"><Sil slug={s} /></span>
            <span className="mx-tile-label">{nameOf(s)}</span>
          </Link>
        ))}
        {shown.length === 0 && <p className="mx-empty">No country matches “{q}”.</p>}
      </div>
    </>
  );
}

const VIEWS = {
  regions: { title: 'Provinces, states & regions', desc: 'Choose where to play.', Body: RegionsView },
  country: { title: 'One country', desc: 'Pick a country to open its map.', Body: CountryView },
  progress: {
    title: 'Progress', desc: 'Your records, badges and how you compare.',
    Body: () => (
      <div className="mx-tiles">
        {PROGRESS.map((t) => (
          <Link className="mx-tile" to={t.to} key={t.label}>
            <span className="mx-tile-icon" aria-hidden="true">{t.icon}</span>
            <span className="mx-tile-text"><span className="mx-tile-label">{t.label}</span><span className="mx-tile-hint">{t.hint}</span></span>
          </Link>
        ))}
      </div>
    ),
  },
};

export default function MapsPage() {
  const [params, setParams] = useSearchParams();
  const view = VIEWS[params.get('seccion')];

  return (
    <div className="menu-page maps-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="mx-shell">
          {view
            ? <button type="button" className="btn-back mx-back" onClick={() => setParams({})}><span>←</span> All modes</button>
            : <Link className="btn-back mx-back" to="/"><span>←</span> Main menu</Link>}

          <header className="mx-hero">
            <span className="mx-eyebrow">{view ? 'Choose' : 'Beyond the atlas'}</span>
            <h1>{view ? view.title : <>More ways to <i>play</i></>}</h1>
            <p>{view ? view.desc : 'Pick a mode to get started.'}</p>
          </header>

          {view ? (
            <section className="mx-section" aria-label={view.title}><view.Body /></section>
          ) : (
            <div className="mx-main">
              {MAIN.map((m, i) => {
                const body = (
                  <>
                    <span className="mx-main-bg" aria-hidden="true">{m.sils.map((s) => <Sil key={s} slug={s} />)}</span>
                    <span className="mx-main-icon" aria-hidden="true">{m.icon}</span>
                    <h2>{m.title}</h2>
                    <p>{m.desc}</p>
                    <span className="mx-main-cta">{m.cta} <span aria-hidden="true">→</span></span>
                  </>
                );
                const style = { animationDelay: `${i * 0.06}s` };
                return m.view ? (
                  <button type="button" className="mx-main-card" key={m.id} style={style} onClick={() => setParams({ seccion: m.id })}>{body}</button>
                ) : (
                  <Link className="mx-main-card" key={m.id} style={style} to={m.to}>{body}</Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
