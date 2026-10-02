import { Link } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// Hub with EVERYTHING that is not the main atlas. No selectors: every line is a direct link.
// To add a new mode, just add a row to one of the groups below.

const GROUPS = [
  {
    title: 'Countries of the world',
    desc: 'Name all 197 countries.',
    items: [
      { label: 'On the map', hint: 'The map fills in as you play', to: '/mapa-de-paises' },
      { label: 'As a list', hint: 'Type them one by one', to: '/paises-del-mundo' },
    ],
  },
  {
    title: 'Provinces & regions',
    desc: 'Every state, province and region.',
    items: [
      { label: 'Whole world', to: '/regiones-del-mundo?zona=mundo' },
      { label: 'Europe', to: '/regiones-del-mundo?zona=europa' },
      { label: 'Asia', to: '/regiones-del-mundo?zona=asia' },
      { label: 'Africa', to: '/regiones-del-mundo?zona=africa' },
      { label: 'Americas', to: '/regiones-del-mundo?zona=america' },
      { label: 'Oceania', to: '/regiones-del-mundo?zona=oceania' },
    ],
  },
  {
    title: 'One country',
    desc: 'The divisions of a single country.',
    items: [
      { label: 'Europe', to: '/paises?zona=europa' },
      { label: 'Asia', to: '/paises?zona=asia' },
      { label: 'Africa', to: '/paises?zona=africa' },
      { label: 'Americas', to: '/paises?zona=america' },
      { label: 'Oceania', to: '/paises?zona=oceania' },
    ],
  },
  {
    title: 'Friends & progress',
    desc: 'Play with others and track yourself.',
    items: [
      { label: 'Multiplayer', hint: '1 vs 1 against a friend', to: '/multijugador' },
      { label: 'Statistics', hint: 'Your profile and records', to: '/perfil' },
      { label: 'Compare with a friend', to: '/comparar' },
    ],
  },
];

export default function MapsPage() {
  return (
    <div className="menu-page maps-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="mx-shell">
          <Link className="btn-back mx-back" to="/"><span>←</span> Main menu</Link>

          <header className="mx-head">
            <h1>More ways to <i>play</i></h1>
            <p>Everything except the atlas.</p>
          </header>

          <div className="mx-grid">
            {GROUPS.map((g) => (
              <section className="mx-card" key={g.title} aria-label={g.title}>
                <h2>{g.title}</h2>
                <p className="mx-desc">{g.desc}</p>
                <ul className="mx-list">
                  {g.items.map((it) => (
                    <li key={it.to}>
                      <Link className="mx-row" to={it.to}>
                        <span className="mx-row-text">
                          <span className="mx-row-label">{it.label}</span>
                          {it.hint && <span className="mx-row-hint">{it.hint}</span>}
                        </span>
                        <span className="mx-row-arrow" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
