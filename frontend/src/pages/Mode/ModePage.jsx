import { Link } from 'react-router-dom';
import './Mode.css';

// Regions shown under "Play by choosing a region".
// `to` uses the new SPA routes (originals: paises.html?zona=..., paises-del-mundo.html).
const ZONES = [
  { key: 'mundo',   code: 'WLD', title: 'World',    desc: 'Write all 197 countries in the world from memory.', to: '/paises-del-mundo', rot: 0 },
  { key: 'europa',  code: 'EUR', title: 'Europe',   desc: 'Countries of the European continent.',              to: '/paises?zona=europa',  rot: 15 },
  { key: 'asia',    code: 'ASI', title: 'Asia',     desc: 'Countries of the Asian continent.',                 to: '/paises?zona=asia',    rot: 30 },
  { key: 'africa',  code: 'AFR', title: 'Africa',   desc: 'Countries of the African continent.',               to: '/paises?zona=africa',  rot: -15 },
  { key: 'america', code: 'AME', title: 'Americas', desc: 'North, Central, and South America.',                to: '/paises?zona=america', rot: 45 },
  { key: 'oceania', code: 'OCE', title: 'Oceania',  desc: 'Australia and the Pacific islands.',                to: '/paises?zona=oceania', rot: -30 },
];

function MiniCompass() {
  return (
    <svg className="compass-mini" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" />
      <path d="M20 5 L23 20 L20 35 L17 20 Z" fill="currentColor" />
    </svg>
  );
}

export default function ModePage() {
  return (
    <div className="mode-page">
      <header>
        <Link className="btn-back" to="/"><span>←</span> Main menu</Link>
        <div className="title-row">
          <svg className="compass-mark" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <path d="M20 3 L23.5 20 L20 37 L16.5 20 Z" fill="currentColor" opacity="0.9" />
            <path d="M3 20 L20 16.5 L37 20 L20 23.5 Z" fill="currentColor" opacity="0.45" />
          </svg>
          <div>
            <h1>Atlas World</h1>
            <p className="subtitle">Choose how to start your game</p>
          </div>
        </div>
        <hr className="rule" />
      </header>

      <main>
        <section className="mode-section" aria-labelledby="mapa-heading">
          <h2 id="mapa-heading" className="section-title">Play on the map</h2>
          <div className="grid">
            <Link className="tile featured" to="/mapa-mundial">
              <div className="featured-content">
                <span className="tile-code">MAP</span>
                <div className="t-title">Interactive map</div>
                <div className="t-desc">Explore the whole globe, zoom in, and pick a country by tapping directly on the map.</div>
              </div>
              <div className="t-arrow">→</div>
            </Link>
            <Link className="tile featured" to="/mapa-de-paises">
              <div className="featured-content">
                <span className="tile-code">CTY</span>
                <div className="t-title">World countries</div>
                <div className="t-desc">Name all 197 countries of the world and watch the world map fill in, from memory.</div>
              </div>
              <div className="t-arrow">→</div>
            </Link>
            <Link className="tile featured" to="/regiones-del-mundo">
              <div className="featured-content">
                <span className="tile-code">ADM</span>
                <div className="t-title">World subdivisions</div>
                <div className="t-desc">Name every province, state and region on Earth, and watch the map fill in. Pick the whole world or one continent.</div>
              </div>
              <div className="t-arrow">→</div>
            </Link>
          </div>
        </section>

        <section className="mode-section" aria-labelledby="zonas-heading">
          <h2 id="zonas-heading" className="section-title">Play by choosing a region</h2>
          <div className="grid" id="zonas">
            {ZONES.map((z) => (
              <Link key={z.key} className="tile" data-zona={z.key} to={z.to} style={{ '--rot': `${z.rot}deg` }}>
                <MiniCompass />
                <div>
                  <span className="tile-code">{z.code}</span>
                  <div className="t-title">{z.title}</div>
                  <div className="t-desc">{z.desc}</div>
                </div>
                <div className="t-arrow">→</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
