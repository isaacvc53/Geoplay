import { Link } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// Hub with EVERYTHING that is not the main atlas. Every line is a direct link.
// To add a mode, add a row to one of the groups in GROUPS.

const CONTINENTS = [
  { label: 'Europe', key: 'europa' },
  { label: 'Asia', key: 'asia' },
  { label: 'Africa', key: 'africa' },
  { label: 'Americas', key: 'america' },
  { label: 'Oceania', key: 'oceania' },
];

// Small line illustrations, drawn in brass on the ocean background.
const ART = {
  globe: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="160" cy="62" r="46" />
      <ellipse cx="160" cy="62" rx="20" ry="46" />
      <path d="M114 62h92M122 40h76M122 84h76" />
      <circle cx="146" cy="48" r="2.6" fill="currentColor" /><circle cx="176" cy="70" r="2.6" fill="currentColor" /><circle cx="162" cy="86" r="2.6" fill="currentColor" />
    </g>
  ),
  regions: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M96 30l46-10 30 14-8 34-44 8-34-22z" />
      <path d="M172 34l44 6 22 28-26 24-40-12z" opacity=".8" />
      <path d="M92 74l34-4 24 18-18 24-44-6z" opacity=".65" />
      <path d="M176 88l40-6 20 22-34 10z" opacity=".5" />
      <circle cx="140" cy="52" r="2.6" fill="currentColor" /><circle cx="204" cy="62" r="2.6" fill="currentColor" />
    </g>
  ),
  country: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M110 40l30-14 40 6 28 20-6 30-34 18-40-8-22-24z" />
      <path d="M140 26l8 34 32 14M110 40l38 20-14 40" opacity=".5" />
      <path d="M170 38c0-7 5-12 11-12s11 5 11 12c0 9-11 20-11 20s-11-11-11-20z" fill="currentColor" fillOpacity=".25" />
      <circle cx="181" cy="38" r="3.4" fill="currentColor" />
    </g>
  ),
  friends: (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="136" cy="48" r="14" /><path d="M110 92c0-14 12-24 26-24s26 10 26 24" />
      <circle cx="188" cy="52" r="11" opacity=".75" /><path d="M170 92c1-11 9-19 20-19 9 0 17 5 20 13" opacity=".75" />
      <path d="M232 92V74M246 92V60M260 92V68" opacity=".55" />
    </g>
  ),
};

const GROUPS = [
  {
    id: 'countries', art: 'globe', num: '01', title: 'Countries of the world',
    desc: 'Name all 197 countries from memory.',
    big: [
      { label: 'On the map', hint: 'Watch the world fill in as you play', to: '/mapa-de-paises' },
      { label: 'As a list', hint: 'Type them one by one, by continent', to: '/paises-del-mundo' },
    ],
  },
  {
    id: 'regions', art: 'regions', num: '02', title: 'Provinces & regions',
    desc: 'Every state, province and region on Earth.',
    big: [{ label: 'Whole world', hint: 'All the divisions at once', to: '/regiones-del-mundo?zona=mundo' }],
    small: CONTINENTS.map((c) => ({ label: c.label, to: `/regiones-del-mundo?zona=${c.key}` })),
  },
  {
    id: 'country', art: 'country', num: '03', title: 'One country',
    desc: 'Master the divisions of a single country. Choose where to look.',
    small: CONTINENTS.map((c) => ({ label: c.label, to: `/paises?zona=${c.key}` })),
  },
  {
    id: 'social', art: 'friends', num: '04', title: 'Friends & progress',
    desc: 'Play with others and watch yourself improve.',
    big: [
      { label: 'Multiplayer', hint: '1 vs 1 on the same country', to: '/multijugador' },
      { label: 'Statistics', hint: 'Your profile, records and badges', to: '/perfil' },
      { label: 'Compare with a friend', hint: 'See who knows the world better', to: '/comparar' },
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

          <header className="mx-hero">
            <svg className="mx-rings" viewBox="0 0 400 400" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="200" cy="200" r="190" /><circle cx="200" cy="200" r="140" />
                <circle cx="200" cy="200" r="90" /><circle cx="200" cy="200" r="40" />
                <path d="M200 0v400M0 200h400" /><path d="M60 60l280 280M340 60L60 340" opacity=".5" />
              </g>
            </svg>
            <span className="mx-eyebrow">Beyond the atlas</span>
            <h1>More ways to <i>play</i></h1>
            <p>Four ways into the map. Pick one and jump straight in.</p>
          </header>

          <div className="mx-grid">
            {GROUPS.map((g, i) => (
              <section className={`mx-card mx-${g.id}`} key={g.id} aria-labelledby={`mx-${g.id}`} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="mx-art" aria-hidden="true">
                  <span className="mx-tick tl" /><span className="mx-tick br" />
                  <svg viewBox="0 0 320 124" preserveAspectRatio="xMidYMid slice">{ART[g.art]}</svg>
                  <span className="mx-num">{g.num}</span>
                </div>
                <div className="mx-body">
                  <h2 id={`mx-${g.id}`}>{g.title}</h2>
                  <p className="mx-desc">{g.desc}</p>

                  {g.big && (
                    <div className="mx-big">
                      {g.big.map((it) => (
                        <Link className="mx-link" to={it.to} key={it.to}>
                          <span className="mx-link-text">
                            <span className="mx-link-label">{it.label}</span>
                            <span className="mx-link-hint">{it.hint}</span>
                          </span>
                          <span className="mx-link-go" aria-hidden="true">→</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {g.small && (
                    <>
                      {g.big && <span className="mx-or">or by continent</span>}
                      <div className="mx-small">
                        {g.small.map((it) => (
                          <Link className="mx-pill" to={it.to} key={it.to}>{it.label}</Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
