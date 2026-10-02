import { Link, useSearchParams } from 'react-router-dom';
import '../Menu/Menu.css';
import './Maps.css';

// Hub with EVERYTHING that is not the main atlas. Every tile is a direct link.
// To add a mode or a country, add one line to the matching list below.

const CONTINENTS = [
  { label: 'Europe', key: 'europa', icon: '🌍' },
  { label: 'Asia', key: 'asia', icon: '🌏' },
  { label: 'Africa', key: 'africa', icon: '🌍' },
  { label: 'Americas', key: 'america', icon: '🌎' },
  { label: 'Oceania', key: 'oceania', icon: '🌏' },
];

// Countries you can jump straight into (slug = file in public/data/countries).
const QUICK_COUNTRIES = [
  ['Spain', 'spain', '🇪🇸'], ['France', 'france', '🇫🇷'], ['Italy', 'italy', '🇮🇹'], ['Germany', 'germany', '🇩🇪'],
  ['Portugal', 'portugal', '🇵🇹'], ['United Kingdom', 'united-kingdom', '🇬🇧'], ['Poland', 'poland', '🇵🇱'], ['Netherlands', 'netherlands', '🇳🇱'],
  ['USA', 'usa', '🇺🇸'], ['Canada', 'canada', '🇨🇦'], ['Mexico', 'mexico', '🇲🇽'], ['Brazil', 'brazil', '🇧🇷'],
  ['Argentina', 'argentina', '🇦🇷'], ['Colombia', 'colombia', '🇨🇴'], ['Peru', 'peru', '🇵🇪'], ['Chile', 'chile', '🇨🇱'],
  ['China', 'china', '🇨🇳'], ['Japan', 'japan', '🇯🇵'], ['India', 'india', '🇮🇳'], ['Turkey', 'turkey', '🇹🇷'],
  ['Russia', 'russia', '🇷🇺'], ['Egypt', 'egypt', '🇪🇬'], ['Morocco', 'morocco', '🇲🇦'], ['Australia', 'australia', '🇦🇺'],
].map(([label, slug, icon]) => ({ label, icon, to: `/pais?pais=${slug}` }));

// Main options. Those with `tiles` open a second step with more to choose from;
// those with `to` go straight into the game.
const MAIN = [
  { id: 'countries', icon: '🌐', title: 'Countries of the world', desc: 'Name all 197 countries and watch the map fill in.', to: '/mapa-de-paises', cta: 'Play' },
  {
    id: 'regions', icon: '🗺️', title: 'Provinces & regions', desc: 'Every state, province and region on Earth.',
    tiles: [
      { label: 'Whole world', hint: 'All divisions', icon: '🌐', to: '/regiones-del-mundo?zona=mundo' },
      ...CONTINENTS.map((c) => ({ label: c.label, icon: c.icon, to: `/regiones-del-mundo?zona=${c.key}` })),
    ],
  },
  {
    id: 'country', icon: '📍', title: 'One country', desc: 'Jump into a country, or browse them by continent.',
    tiles: [
      ...CONTINENTS.map((c) => ({ label: `All of ${c.label}`, hint: 'Browse countries', icon: c.icon, to: `/paises?zona=${c.key}`, accent: true })),
      ...QUICK_COUNTRIES,
    ],
  },
  { id: 'multi', icon: '⚔️', title: 'Multiplayer', desc: 'Challenge a friend to a 1 vs 1 on the same country.', to: '/multijugador', cta: 'Play' },
  {
    id: 'progress', icon: '📊', title: 'Progress', desc: 'Your records, badges and how you compare.',
    tiles: [
      { label: 'Statistics', hint: 'Records & history', icon: '📊', to: '/perfil' },
      { label: 'Achievements', hint: 'Badges', icon: '🏆', to: '/perfil' },
      { label: 'Compare', hint: 'With a friend', icon: '🤝', to: '/comparar' },
    ],
  },
];

export default function MapsPage() {
  const [params, setParams] = useSearchParams();
  const open = MAIN.find((m) => m.id === params.get('seccion') && m.tiles);

  return (
    <div className="menu-page maps-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="mx-shell">
          {open ? (
            <button type="button" className="btn-back mx-back" onClick={() => setParams({})}><span>←</span> All modes</button>
          ) : (
            <Link className="btn-back mx-back" to="/"><span>←</span> Main menu</Link>
          )}

          <header className="mx-hero">
            <span className="mx-eyebrow">{open ? 'Choose' : 'Beyond the atlas'}</span>
            <h1>{open ? open.title : <>More ways to <i>play</i></>}</h1>
            <p>{open ? open.desc : 'Pick a mode to get started.'}</p>
          </header>

          {open ? (
            <section className="mx-section" key={open.id} aria-label={open.title}>
              <div className="mx-tiles">
                {open.tiles.map((t) => (
                  <Link className={'mx-tile' + (t.accent ? ' accent' : '')} to={t.to} key={t.label + t.to}>
                    <span className="mx-tile-icon" aria-hidden="true">{t.icon}</span>
                    <span className="mx-tile-text">
                      <span className="mx-tile-label">{t.label}</span>
                      {t.hint && <span className="mx-tile-hint">{t.hint}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div className="mx-main">
              {MAIN.map((m, i) => {
                const body = (
                  <>
                    <span className="mx-main-icon" aria-hidden="true">{m.icon}</span>
                    <h2>{m.title}</h2>
                    <p>{m.desc}</p>
                    <span className="mx-main-cta">
                      {m.tiles ? `${m.tiles.length} options` : m.cta} <span aria-hidden="true">→</span>
                    </span>
                  </>
                );
                const style = { animationDelay: `${i * 0.06}s` };
                return m.tiles ? (
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
