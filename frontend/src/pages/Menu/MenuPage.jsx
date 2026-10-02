import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import FriendsPanel from './FriendsPanel';
import { useFriends } from './useFriends';
import { useMyMatches } from './useMyMatches';
import MatchBanner from './MatchBanner';
import { useLastResult } from './useLastResult';
import './Menu.css';

// ---------- small presentational pieces ----------

const noop = (e) => e.preventDefault();

function IconFriends({ className = 'icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 19c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14.5 19c.3-2.3 1.8-4 3.8-4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconAccount({ className = 'icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.6" r="3.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 19.4c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconTrophy({ className = 'icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4h10v3.2c0 3-2.2 5.3-5 5.3s-5-2.3-5-5.3V4z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 12.5V17m-3 3h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Drawer({ id, label, open, onClose, title, soon, children }) {
  return (
    <>
      <div className={'drawer-overlay' + (open ? ' open' : '')} onClick={onClose} />
      <aside
        className={'drawer' + (open ? ' open' : '')}
        id={id}
        aria-hidden={!open}
        aria-label={label}
      >
        <div className="drawer-head">
          <h2>{title}</h2>
          {soon && <span className="pill soon">Coming soon</span>}
          <button type="button" className="drawer-close" onClick={onClose} aria-label={`Close ${label.toLowerCase()} panel`}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

// Same aggregation the original loadHomeStats() did, as a pure function.
function computeHomeStats(countries) {
  const played = countries.filter((c) => c.games_played > 0);
  if (played.length === 0) return null;

  const favorite = played.reduce((a, b) => (b.games_played > a.games_played ? b : a));
  const best = played.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  const mastered = played.filter((c) => c.percentage >= 100);

  return {
    gamesPlayed: played.reduce((sum, c) => sum + c.games_played, 0),
    countriesPlayed: played.length,
    favorite: favorite.country_name,
    best: `${best.percentage}% (${best.country_name})`,
    masteredCount: mastered.length,
    masteredPct: Math.round((mastered.length / played.length) * 100),
  };
}

// Number of playable countries, from the manifest the deploy already generates
// (/data/available-countries.json). With the SPA fallback a missing file answers 200 with
// the app's HTML, so that response type is discarded. If anything fails, null = hidden.
function useAvailableCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/available-countries.json')
      .then((res) => {
        const type = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || type.includes('text/html')) throw new Error('no manifest');
        return res.json();
      })
      .then((list) => { if (!cancelled && Array.isArray(list) && list.length) setCount(list.length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return count;
}

// ---------- page ----------

export default function MenuPage() {
  const { loggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  // "/?panel=friends" opens the friends drawer straight away (used by the compare page).
  const [openDrawer, setOpenDrawer] = useState(() => (
    new URLSearchParams(window.location.search).get('panel') === 'friends' ? 'friends' : null
  )); // 'friends' | 'achievements' | 'account' | null
  const [stats, setStats] = useState(null);
  const [worldPaths, setWorldPaths] = useState([]);
  const friends = useFriends(loggedIn);
  const matches = useMyMatches(loggedIn);
  const lastResult = useLastResult(loggedIn, Boolean(matches.current));
  const availableCount = useAvailableCount();
  // Badge on the friends icon: friend requests waiting for an answer.
  const pendingRequests = friends.data ? friends.data.incoming.length : 0;
  // Badge on the Multiplayer link: challenges waiting for an answer.
  const pendingChallenges = matches.invitations.length;

  // The decorative map is ~1.2 MB of path data: load it in its own chunk.
  useEffect(() => {
    let cancelled = false;
    import('./worldPaths').then((m) => { if (!cancelled) setWorldPaths(m.WORLD_PATHS); });
    return () => { cancelled = true; };
  }, []);

  // Esc closes; body doesn't scroll behind an open drawer.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpenDrawer(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = openDrawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [openDrawer]);

  useEffect(() => {
    if (!loggedIn) { setStats(null); return; }
    let cancelled = false;
    api.getCountriesProgress()
      .then((countries) => { if (!cancelled) setStats(computeHomeStats(countries)); })
      .catch(() => {}); // keep placeholders if loading fails
    return () => { cancelled = true; };
  }, [loggedIn]);

  // Refresh friends and requests every time the drawer is opened.
  const reloadFriends = friends.reload;
  useEffect(() => {
    if (openDrawer === 'friends' && loggedIn) reloadFriends();
  }, [openDrawer, loggedIn, reloadFriends]);

  const toggle = (name) => setOpenDrawer((cur) => (cur === name ? null : name));
  const close = () => setOpenDrawer(null);

  return (
    <div className="menu-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="topbar">
          <a className="brand" href="#" onClick={noop}>
            {/* Put your logo at public/img/logo.png; if missing, the "G" shows. */}
            <span className="mark">G<img src="/img/logo.png" alt="Geotaria" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></span>
            <span className="word">Geo<i>taria</i></span>
          </a>
          <nav className="mainnav">
            <Link to="/mapas">Maps</Link>
            <Link to="/multijugador" className="nav-multiplayer">
              Multiplayer
              {pendingChallenges > 0 && (
                <span className="nav-badge" aria-label={`${pendingChallenges} pending challenge${pendingChallenges === 1 ? '' : 's'}`}>{pendingChallenges}</span>
              )}
            </Link>
            <Link to="/perfil">Statistics</Link>
          </nav>
          <nav className="social-icons" aria-label="More">
            <button type="button" className="icon-btn" title={pendingRequests ? `Friends — ${pendingRequests} pending` : 'Friends'} aria-label={pendingRequests ? `Friends, ${pendingRequests} pending requests` : 'Friends'} aria-haspopup="dialog" aria-controls="friendsDrawer" aria-expanded={openDrawer === 'friends'} onClick={() => toggle('friends')}>
              <IconFriends />
              {pendingRequests > 0 && <span className="icon-badge" aria-hidden="true">{pendingRequests}</span>}
            </button>
            <a href="#" onClick={noop} className="icon-btn disabled" title="Challenges — coming soon">
              <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </a>
            <button type="button" className="icon-btn" title="Achievements" aria-haspopup="dialog" aria-controls="achievementsDrawer" aria-expanded={openDrawer === 'achievements'} onClick={() => toggle('achievements')}>
              <IconTrophy />
            </button>
            <button type="button" className="icon-btn" title="Account" aria-haspopup="dialog" aria-controls="accountDrawer" aria-expanded={openDrawer === 'account'} onClick={() => toggle('account')}>
              {loggedIn && user
                ? <UserAvatar className="btn-photo" userId={user.id} name={user.username} version={user.avatar_updated_at} fallback={<IconAccount />} />
                : <IconAccount />}
            </button>
          </nav>
        </div>

        <MatchBanner matches={matches} lastResult={lastResult} onOpenMultiplayer={() => navigate('/multijugador')} />

        {/* Friends */}
        <Drawer id="friendsDrawer" label="Friends" title="Friends" open={openDrawer === 'friends'} onClose={close}>
          <FriendsPanel loggedIn={loggedIn} friends={friends} />
        </Drawer>

        {/* Achievements */}
        <Drawer id="achievementsDrawer" label="Achievements" title="Achievements" soon open={openDrawer === 'achievements'} onClose={close}>
          <div className="badge-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="badge-slot" key={i}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="6" y="10.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            ))}
          </div>
          <div className="drawer-empty">
            <p className="drawer-empty-title">Badges are on the way</p>
            <p className="drawer-empty-desc">Unlock badges as you master maps, build streaks and improve your scores.</p>
          </div>
        </Drawer>

        {/* Account */}
        <Drawer id="accountDrawer" label="Account" title="Account" open={openDrawer === 'account'} onClose={close}>
          <div id="authNav">
            <div className="drawer-empty">
              <div className="icon-circle big">
                {loggedIn && user
                  ? <UserAvatar className="btn-photo" userId={user.id} name={user.username} version={user.avatar_updated_at} fallback={<IconAccount />} />
                  : <IconAccount />}
              </div>
              {loggedIn ? (
                <>
                  <p className="drawer-empty-title">{user ? user.username : '…'}</p>
                  <p className="drawer-empty-desc">Signed in to Geotaria.</p>
                  <Link to="/perfil" className="signin">View profile</Link>
                  <a href="#" className="account-logout" onClick={(e) => { e.preventDefault(); logout(); }}>Log out</a>
                </>
              ) : (
                <>
                  <p className="drawer-empty-title">You&apos;re not signed in</p>
                  <p className="drawer-empty-desc">Sign in to save your progress, track your stats and pick up where you left off.</p>
                  <Link to="/login" className="signin account-cta">Sign in</Link>
                </>
              )}
            </div>
          </div>
        </Drawer>

        <main className="layout">
          {/* 1: the single option for everything else (/mapas) */}
          <Link className="panel maps-card" to="/mapas">
            <div className="maps-head">
              <h2>More ways to play</h2>
              {pendingChallenges > 0 && <span className="pill live">{pendingChallenges} challenge{pendingChallenges === 1 ? '' : 's'}</span>}
            </div>
            <p className="desc">Every other mode, all in one place.</p>
            <div className="maps-list">
              {['Countries of the world', 'Provinces & regions', 'One country', 'Multiplayer', 'Statistics'].map((label) => (
                <div className="maps-row" key={label}>
                  <span className="bullet" /><span className="label">{label}</span>
                </div>
              ))}
            </div>
            <span className="maps-cta">Choose a mode <span aria-hidden="true">→</span></span>
          </Link>

          {/* 2: free slot, to be filled later */}
          <a href="#" onClick={noop} className="panel side-card regions-card soon-card">
            <div>
              <div className="head"><span className="pill soon">Coming soon</span></div>
              <div className="body">
                <div className="widget-title">New mode</div>
                <p className="widget-desc">Something new is on the way. This space will be filled in soon.</p>
              </div>
            </div>
            <div className="foot"><span>Soon</span></div>
          </a>

          {/* 3: select a country (hero) */}
          <Link className="hero" to="/mapa-mundial">
            <span className="tick tick-tl" aria-hidden="true" />
            <span className="tick tick-tr" aria-hidden="true" />
            <span className="tick tick-bl" aria-hidden="true" />
            <span className="tick tick-br" aria-hidden="true" />
            <div className="hero-head">
              <h2>Select a country</h2>
              <svg className="icon compass" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" />
                <path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3" stroke="currentColor" strokeWidth="1" />
                <path d="M12 6.5l2.6 5.5-2.6 5.5-2.6-5.5z" fill="currentColor" opacity=".9" />
              </svg>
            </div>
            <p className="hero-sub">Pick a region of the world and start naming its divisions.</p>
            <div className="map-wrap">
              <svg className="worldmap" viewBox="0 0 1010 666" aria-hidden="true">
                <g>{worldPaths.map((d, i) => <path key={i} d={d} />)}</g>
              </svg>
              <div className="scale-bar"><div className="bar" /><span>2,000 km</span></div>
            </div>
            <div className="hero-foot">
              <span className="hero-meta">
                {availableCount && <span className="hero-count">{availableCount} countries</span>}
              </span>
              <span className="cta">Open atlas <span className="arrow" aria-hidden="true">→</span></span>
            </div>
          </Link>

          {/* 4: free slot, to be filled later */}
          <a href="#" onClick={noop} className="panel side-card regions-card soon-card">
            <div>
              <div className="head"><span className="pill soon">Coming soon</span></div>
              <div className="body">
                <div className="widget-title">New mode</div>
                <p className="widget-desc">Something new is on the way. This space will be filled in soon.</p>
              </div>
            </div>
            <div className="foot"><span>Soon</span></div>
          </a>

          {/* 5: statistics */}
          <div className="panel stats">
            <div className="head">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 18v-4M12 18V9M18 18v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="widget-title">Statistics</span>
            </div>
            <p className="widget-desc">
              {stats
                ? `Across ${stats.countriesPlayed} map${stats.countriesPlayed === 1 ? '' : 's'} you've played.`
                : 'Your accuracy and best runs across every map.'}
            </p>

            <div className="stat-grid">
              <div className="stat-tile">
                <span className="stat-tile-label">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 15l3-4 3 2.5L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Games played
                </span>
                <span className="stat-tile-value">{stats ? stats.gamesPlayed : 0}</span>
              </div>
              <div className="stat-tile">
                <span className="stat-tile-label">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 4.5c-4 4-4 11 0 15M12 4.5c4 4 4 11 0 15M5 9.5h14M5 14.5h14" stroke="currentColor" strokeWidth="1.2" /></svg>
                  Countries played
                </span>
                <span className={'stat-tile-value' + (stats ? '' : ' dim')}>{stats ? stats.countriesPlayed : '—'}</span>
              </div>
              <div className="stat-tile">
                <span className="stat-tile-label">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10v3.2c0 3-2.2 5.3-5 5.3s-5-2.3-5-5.3V4z" stroke="currentColor" strokeWidth="1.4" /><path d="M12 12.5V17m-3 3h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  Best score
                </span>
                <span className={'stat-tile-value' + (stats ? '' : ' dim')}>{stats ? stats.best : '—'}</span>
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Favorite map</span>
              <span className={'stat-value' + (stats ? '' : ' dim')}>{stats ? stats.favorite : '—'}</span>
            </div>

            <div className="mastery">
              <div className="mastery-head">
                <span className="stat-label">Maps mastered (100%)</span>
                <span className={'stat-value' + (stats ? '' : ' dim')}>{stats ? `${stats.masteredCount} / ${stats.countriesPlayed}` : '—'}</span>
              </div>
              <div className="stat-bar"><span style={{ width: `${stats ? stats.masteredPct : 0}%` }} /></div>
            </div>

            <div className="stats-foot">
              {stats
                ? <>See the full breakdown on your <Link to="/perfil">profile</Link>, or <Link to="/comparar">compare with a friend</Link>.</>
                : loggedIn
                  ? 'Play a round to start building your stats.'
                  : <><Link to="/login">Sign in</Link> to save your stats and pick up where you left off.</>}
            </div>
          </div>
        </main>

        <footer>
          <div className="footer-brand">
            <strong>Geotaria</strong>
            <span>Geography training platform</span>
          </div>
          <div className="footer-status">geotaria.com</div>
        </footer>
      </div>
    </div>
  );
}
