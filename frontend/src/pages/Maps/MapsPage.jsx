import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// Every way to play, organised by WHAT you want to name:
//   1. the countries of the world   (map or list)
//   2. provinces / states / regions (whole world or one continent)
//   3. the divisions of one country (pick it on the globe or by continent)

const ZONES = [
  { key: 'mundo', label: 'World' },
  { key: 'europa', label: 'Europe' },
  { key: 'asia', label: 'Asia' },
  { key: 'africa', label: 'Africa' },
  { key: 'america', label: 'Americas' },
  { key: 'oceania', label: 'Oceania' },
];

const COUNTRY_VIEWS = [
  { key: 'map', label: 'Map', to: '/mapa-de-paises', hint: 'The world map fills in as you name each country.' },
  { key: 'list', label: 'List', to: '/paises-del-mundo', hint: 'Type them one by one and tick off the continent lists.' },
];

function Rings() {
  return (
    <svg className="mx-rings" viewBox="0 0 400 400" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="140" />
        <circle cx="200" cy="200" r="90" />
        <circle cx="200" cy="200" r="40" />
        <path d="M200 0v400M0 200h400" />
        <path d="M60 60l280 280M340 60L60 340" opacity=".5" />
      </g>
    </svg>
  );
}

// Radio group drawn as chips (native inputs, so the keyboard works).
function Choice({ name, label, options, value, onChange }) {
  return (
    <div className="mx-choice" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label className="mx-chip" key={o.key}>
          <input type="radio" name={name} checked={value === o.key} onChange={() => onChange(o.key)} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function MapsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('map');
  const [zone, setZone] = useState('mundo');
  const currentView = COUNTRY_VIEWS.find((v) => v.key === view);
  const continents = ZONES.filter((z) => z.key !== 'mundo');

  return (
    <div className="menu-page maps-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="mx-shell">
          <Link className="btn-back mx-back" to="/"><span>←</span> Main menu</Link>

          <header className="mx-hero">
            <Rings />
            <div className="mx-hero-text">
              <span className="mx-eyebrow">Play</span>
              <h1>Choose your <i>map</i></h1>
              <p>Pick what you want to name. Every game is played from memory: type, and the map fills in.</p>
            </div>
          </header>

          <div className="mx-grid">
            {/* 1 · countries of the world */}
            <section className="mx-card" aria-labelledby="mx-t1">
              <span className="mx-num">01</span>
              <h2 id="mx-t1">Countries of the world</h2>
              <p className="mx-desc">Name all 197 countries.</p>
              <div className="mx-controls">
                <span className="mx-label">View</span>
                <Choice name="view" label="View" options={COUNTRY_VIEWS} value={view} onChange={setView} />
                <p className="mx-hint">{currentView.hint}</p>
              </div>
              <button type="button" className="mx-btn primary" onClick={() => navigate(currentView.to)}>
                Start <span aria-hidden="true">→</span>
              </button>
            </section>

            {/* 2 · provinces, states and regions */}
            <section className="mx-card" aria-labelledby="mx-t2">
              <span className="mx-num">02</span>
              <h2 id="mx-t2">Provinces &amp; regions</h2>
              <p className="mx-desc">Every state, province and region on Earth.</p>
              <div className="mx-controls">
                <span className="mx-label">Where</span>
                <Choice name="zone" label="Zone" options={ZONES} value={zone} onChange={setZone} />
                <p className="mx-hint">Pick the whole world or one continent at a time.</p>
              </div>
              <button type="button" className="mx-btn primary" onClick={() => navigate(`/regiones-del-mundo?zona=${zone}`)}>
                Start <span aria-hidden="true">→</span>
              </button>
            </section>

            {/* 3 · one country */}
            <section className="mx-card" aria-labelledby="mx-t3">
              <span className="mx-num">03</span>
              <h2 id="mx-t3">One country</h2>
              <p className="mx-desc">Name the divisions of a single country.</p>
              <div className="mx-controls">
                <span className="mx-label">Find it by continent</span>
                <div className="mx-choice">
                  {continents.map((z) => (
                    <Link key={z.key} className="mx-chip link" to={`/paises?zona=${z.key}`}>{z.label}</Link>
                  ))}
                </div>
                <p className="mx-hint">Or pick any country straight from the globe.</p>
              </div>
              <button type="button" className="mx-btn primary" onClick={() => navigate('/mapa-mundial')}>
                Pick on the globe <span aria-hidden="true">→</span>
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
