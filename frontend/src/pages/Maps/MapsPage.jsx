import { Link } from 'react-router-dom';
import { MAP_MODES } from '../Mode/mapModes';
import '../Mode/Mode.css';

// "Different maps": every map you can play on, in one place.
export default function MapsPage() {
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
            <h1>Maps</h1>
            <p className="subtitle">Pick the map you want to play on</p>
          </div>
        </div>
        <hr className="rule" />
      </header>

      <main>
        <section className="mode-section" aria-labelledby="maps-heading">
          <h2 id="maps-heading" className="section-title">Different maps</h2>
          <div className="grid">
            {MAP_MODES.map((m) => (
              <Link key={m.to} className="tile featured" to={m.to}>
                <div className="featured-content">
                  <span className="tile-code">{m.code}</span>
                  <div className="t-title">{m.title}</div>
                  <div className="t-desc">{m.desc}</div>
                </div>
                <div className="t-arrow">→</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mode-section" aria-labelledby="by-region-heading">
          <h2 id="by-region-heading" className="section-title">Prefer to type?</h2>
          <div className="grid">
            <Link className="tile" to="/modo">
              <div>
                <span className="tile-code">REG</span>
                <div className="t-title">Play by region</div>
                <div className="t-desc">Name every country from memory: the whole world or one continent at a time.</div>
              </div>
              <div className="t-arrow">→</div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
