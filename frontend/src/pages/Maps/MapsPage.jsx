import { Link } from 'react-router-dom';
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

const SECTIONS = [
  {
    id: 'countries', num: '01', title: 'Countries of the world', desc: 'Name all 197 countries from memory.',
    tiles: [{ label: 'On the map', hint: 'The world fills in as you play', icon: '🌐', to: '/mapa-de-paises' }],
  },
  {
    id: 'regions', num: '02', title: 'Provinces & regions', desc: 'Every state, province and region on Earth.',
    tiles: [
      { label: 'Whole world', hint: 'All divisions', icon: '🌐', to: '/regiones-del-mundo?zona=mundo' },
      ...CONTINENTS.map((c) => ({ label: c.label, icon: c.icon, to: `/regiones-del-mundo?zona=${c.key}` })),
    ],
  },
  {
    id: 'country', num: '03', title: 'One country', desc: 'Jump into a country, or browse them by continent.',
    tiles: [
      ...CONTINENTS.map((c) => ({ label: `All of ${c.label}`, hint: 'Browse countries', icon: c.icon, to: `/paises?zona=${c.key}`, accent: true })),
      ...QUICK_COUNTRIES,
    ],
  },
  {
    id: 'social', num: '04', title: 'Friends & progress', desc: 'Play with others and watch yourself improve.',
    tiles: [
      { label: 'Multiplayer', hint: '1 vs 1', icon: '⚔️', to: '/multijugador' },
      { label: 'Statistics', hint: 'Records & history', icon: '📊', to: '/perfil' },
      { label: 'Achievements', hint: 'Badges', icon: '🏆', to: '/perfil' },
      { label: 'Compare', hint: 'With a friend', icon: '🤝', to: '/comparar' },
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
            <span className="mx-eyebrow">Beyond the atlas</span>
            <h1>More ways to <i>play</i></h1>
            <p>Pick a tile and jump straight in.</p>
          </header>

          {SECTIONS.map((s, i) => (
            <section className="mx-section" key={s.id} aria-labelledby={`mx-${s.id}`} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="mx-section-head">
                <span className="mx-num">{s.num}</span>
                <div>
                  <h2 id={`mx-${s.id}`}>{s.title}</h2>
                  <p>{s.desc}</p>
                </div>
              </div>
              <div className="mx-tiles">
                {s.tiles.map((t) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
