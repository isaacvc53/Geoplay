import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { resolveDisplayName, resolveSlug, resolveTopoName } from '../../lib/countryInfo';
import CountryPicker from './CountryPicker';
import ProgressMap from './ProgressMap';
import {
  ACHIEVEMENTS, buildHeatColumns, buildTrend, colorForPercentage, computeContinents,
  computeHighlights, computeOverallAccuracy, computeRank, computeRankProgress, computeSpots,
  computeStreak, formatRelative, loadCountryTopology, loadWorldTopology, normalizeName,
  playedCountryOptions,
} from './profileLogic';
import './Profile.css';

// Perfil del jugador (/perfil) — EN INGLÉS (decisión del autor).
// Datos: getCurrentUser + getCountriesProgress, y luego getRecentSessions(100).
// Los mapas (mundo y provincias) son D3 imperativo dentro de <ProgressMap>.

const countryLink = (slug) => `/pais?pais=${encodeURIComponent(slug)}`;
const plural = (n, one, many) => (n === 1 ? one : many);

// ---------- piezas pequeñas ----------

function RankSeal() {
  return (
    <svg className="rank-seal" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#170c0a" stroke="#c6a05b" strokeWidth="1" />
      <path d="M16 4 L19 16 L16 28 L13 16 Z" fill="#e0bd7d" />
      <path d="M4 16 L16 13 L28 16 L16 19 Z" fill="#b1483a" />
      <circle cx="16" cy="16" r="2" fill="#f2ecda" />
    </svg>
  );
}

function BadgeSeal({ unlocked }) {
  const ring = unlocked ? '#c6a05b' : 'rgba(198,160,91,0.25)';
  const bg = unlocked ? '#170c0a' : 'rgba(255,255,255,0.03)';
  const diamond = unlocked ? '#e0bd7d' : 'rgba(168,155,129,0.35)';
  const cross = unlocked ? '#b1483a' : 'rgba(168,155,129,0.22)';
  const dot = unlocked ? '#f2ecda' : 'rgba(168,155,129,0.35)';
  return (
    <svg className="badge-seal" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill={bg} stroke={ring} strokeWidth="1" />
      <path d="M16 4 L19 16 L16 28 L13 16 Z" fill={diamond} />
      <path d="M4 16 L16 13 L28 16 L16 19 Z" fill={cross} />
      <circle cx="16" cy="16" r="2" fill={dot} />
    </svg>
  );
}

function RankProgress({ playedCount }) {
  const { next, pct } = computeRankProgress(playedCount);
  const remaining = next ? next.min - playedCount : 0;
  return (
    <div className="rank-progress">
      <div className="rank-progress-bar"><div className="rank-progress-fill" style={{ width: `${next ? pct : 100}%` }} /></div>
      <div className="rank-progress-label">
        {next ? `${remaining} more ${plural(remaining, 'territory', 'territories')} to ${next.title}` : 'Highest rank reached'}
      </div>
    </div>
  );
}

function Continents({ countries }) {
  const rows = computeContinents(countries);
  if (!rows.length) return <div className="log-empty">No territories loaded yet.</div>;
  return (
    <div className="continent-list">
      {rows.map((r) => {
        const pct = r.total ? Math.round((r.played / r.total) * 100) : 0;
        return (
          <div className="continent-row" key={r.name}>
            <span className="cr-name">{r.name}</span>
            <span className="cr-bar">
              <span className="cr-bar-fill" style={{ width: `${pct}%`, background: colorForPercentage(Math.max(pct, r.played ? 8 : 0)) }} />
            </span>
            <span className="cr-frac">{r.played}/{r.total}</span>
          </div>
        );
      })}
    </div>
  );
}

function Heatmap({ sessions }) {
  const { columns, maxCount } = useMemo(() => buildHeatColumns(sessions || []), [sessions]);
  const streak = computeStreak(sessions);
  return (
    <>
      <div className="heat-wrap">
        {columns.map((col, i) => (
          <div className="heat-col" key={i}>
            {col.map((c) => {
              const intensity = c.count === 0 ? 0 : Math.min(1, c.count / maxCount);
              const bg = c.count === 0 ? 'rgba(255,255,255,0.06)' : colorForPercentage(20 + intensity * 80);
              const label = `${c.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${c.count} ${plural(c.count, 'game', 'games')}`;
              return <span className="heat-cell" key={c.date.getTime()} style={{ background: bg }} title={label} />;
            })}
          </div>
        ))}
      </div>
      <div className="heat-footer">
        🔥 {streak > 0 ? `${streak} ${plural(streak, 'day', 'days')} streak` : 'Play today to start a streak'}
      </div>
    </>
  );
}

// Tendencia: precisión de las últimas partidas (más antigua -> más reciente),
// con tooltip propio al pasar el ratón por cada punto.
function Trend({ sessions, scopeLabel }) {
  const wrapRef = useRef(null);
  const rectRef = useRef(null);
  const [tip, setTip] = useState(null);
  const who = scopeLabel ? ` in ${scopeLabel}` : '';

  if (!sessions || sessions.length < 2) {
    return <div className="trend-empty">One more game{who} and your trend line starts here.</div>;
  }
  const { chron, n, w, h, points, delta, color, arrow, linePath, areaPath } = buildTrend(sessions);

  const move = (event, s) => {
    if (!rectRef.current) rectRef.current = wrapRef.current.getBoundingClientRect();
    setTip({
      date: formatRelative(s.played_at),
      pct: s.percentage,
      x: event.clientX - rectRef.current.left,
      y: event.clientY - rectRef.current.top,
    });
  };

  return (
    <>
      <div className="trend-wrap" ref={wrapRef}>
        <svg className="trend-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0bd7d" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e0bd7d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#trendFill)" stroke="none" />
          <path d={linePath} fill="none" stroke="#e0bd7d" strokeWidth="1.6" />
          {points.map((p, i) => {
            const isLast = i === n - 1;
            return (
              <circle
                key={i}
                className="trend-point"
                cx={p[0].toFixed(1)}
                cy={p[1].toFixed(1)}
                r={isLast ? 2.6 : 2}
                fill={isLast ? color : '#e0bd7d'}
                opacity={isLast ? 1 : 0.55}
                onMouseEnter={(e) => { rectRef.current = wrapRef.current.getBoundingClientRect(); move(e, chron[i]); }}
                onMouseMove={(e) => move(e, chron[i])}
                onMouseLeave={() => { rectRef.current = null; setTip(null); }}
              />
            );
          })}
        </svg>
        <div
          className="map-tooltip"
          style={{
            opacity: tip ? 1 : 0,
            transform: tip ? `translate3d(${tip.x}px,${tip.y}px,0) translate(-50%,-120%)` : undefined,
          }}
        >
          {tip && <>{tip.date}<span className="t-pct">{tip.pct}%</span></>}
        </div>
      </div>
      <div className="trend-delta" style={{ color }}>
        {arrow} {Math.abs(delta)} pts over last {n} games{who}
      </div>
    </>
  );
}

function RecentLog({ sessions }) {
  if (!sessions) return <div className="log-empty">Loading recent activity…</div>;
  if (sessions.length === 0) return <div className="log-empty">No entries yet.</div>;
  return (
    <div className="log-list">
      {sessions.slice(0, 6).map((s, i) => (
        <Link className="log-row" key={`${s.played_at}-${i}`} to={countryLink(s.country_slug || resolveSlug(s.country_name))}>
          <span className="log-date">{formatRelative(s.played_at)}</span>
          <span className="log-country">{resolveDisplayName(s.country_name)}</span>
          <span className="log-pct" style={{ color: colorForPercentage(s.percentage) }}>{s.percentage}%</span>
        </Link>
      ))}
    </div>
  );
}

function Spots({ countries, countryId, mode }) {
  const spots = computeSpots(countries, { countryId, mode });
  if (!spots.length) {
    const scope = countryId ? ' for this territory' : '';
    return (
      <div className="log-empty">
        {mode === 'weak'
          ? `No weak spots${scope} yet — keep playing to surface patterns.`
          : `No standout regions${scope} yet — keep playing to surface patterns.`}
      </div>
    );
  }
  return (
    <div className="weak-list">
      {spots.map((r) => (
        <Link className={'weak-row' + (countryId ? ' single-country' : '')} key={`${r.country_slug}-${r.region_name}`} to={countryLink(r.country_slug)}>
          <span className="weak-region">{r.region_name}</span>
          {!countryId && <span className="weak-country">{resolveDisplayName(r.country_name)}</span>}
          <span className="weak-acc" style={{ color: colorForPercentage(r.accuracy) }}>{r.accuracy}%</span>
        </Link>
      ))}
    </div>
  );
}

function CountryLedger({ played, total }) {
  const remaining = total - played.length;
  return (
    <>
      <div className="ledger-header">
        <span>Territory</span><span>Mastery</span><span></span><span>Games</span><span>Mastered</span><span>Last</span>
      </div>
      {played.slice().sort((a, b) => b.percentage - a.percentage).map((c) => {
        const color = colorForPercentage(c.percentage);
        const regiones = c.regions || [];
        const mastered = regiones.filter((r) => r.accuracy === 100).length;
        return (
          <Link className="ledger-row" key={c.country_id} to={countryLink(c.country_slug || resolveSlug(c.country_name))}>
            <span className="lr-name">{resolveDisplayName(c.country_name)}</span>
            <span className="lr-bar"><span className="lr-bar-fill" style={{ width: `${c.percentage}%`, background: color }} /></span>
            <span className="lr-pct" style={{ color }}>{c.percentage}%</span>
            <span className="lr-games">{c.games_played}×</span>
            <span className="lr-mastered">{mastered}/{regiones.length}</span>
            <span className="lr-last">{formatRelative(c.last_played_at)}</span>
          </Link>
        );
      })}
      {remaining > 0
        ? <div className="ledger-note">{remaining} {plural(remaining, 'territory', 'territories')} still uncharted. <Link to="/">Pick one to play</Link>.</div>
        : <div className="ledger-note">Every territory on the map has been charted.</div>}
    </>
  );
}

// Insignias: tocar/clicar una la selecciona y muestra su descripción debajo
// (en móvil no hay hover, así que esto es lo que informa de cada logro).
function Achievements({ stats }) {
  const [selected, setSelected] = useState(null);
  const toggle = (i) => setSelected((cur) => (cur === i ? null : i));
  const sel = selected != null ? ACHIEVEMENTS[selected] : null;
  const selUnlocked = sel ? sel.check(stats) : false;
  return (
    <>
      <div className="badge-grid">
        {ACHIEVEMENTS.map((a, i) => {
          const unlocked = a.check(stats);
          return (
            <div
              key={a.title}
              className={'badge' + (unlocked ? '' : ' locked') + (selected === i ? ' selected' : '')}
              role="button"
              tabIndex={0}
              title={a.desc}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                toggle(i);
              }}
            >
              <BadgeSeal unlocked={unlocked} />
              <span className="badge-title">{a.title}</span>
            </div>
          );
        })}
      </div>
      {sel && (
        <div className="badge-detail">
          <strong>{sel.title}</strong>
          {sel.desc}
          {!selUnlocked && <span className="lock-note">🔒 Not unlocked yet — keep exploring to earn it.</span>}
        </div>
      )}
    </>
  );
}

// ---------- vista principal (con datos ya cargados) ----------

function ProfileView({ user, countries, onLogout }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null); // null = todavía cargando
  const [trendCountryId, setTrendCountryId] = useState('');
  const [spotCountryId, setSpotCountryId] = useState('');
  const [spotMode, setSpotMode] = useState('weak');
  const [worldTopology, setWorldTopology] = useState({ status: 'loading' });
  const [provinceMap, setProvinceMap] = useState({ status: 'idle' });

  const played = useMemo(() => countries.filter((c) => c.games_played > 0), [countries]);
  const totalGames = countries.reduce((sum, c) => sum + c.games_played, 0);
  const overallAccuracy = computeOverallAccuracy(countries);
  const { bestCountry, masteredCount, fullyMasteredCount, continentsPlayed } = computeHighlights(played);
  const streak = computeStreak(sessions);
  const created = new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // La racha solo se conoce cuando llegan las partidas recientes (0 mientras tanto).
  const stats = {
    totalGames, territoriesCharted: played.length, overallAccuracy,
    masteredCount, fullyMasteredCount, continentsPlayed, streak,
  };
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(stats)).length;

  // Partidas recientes: se hidratan después del primer render.
  useEffect(() => {
    let cancelled = false;
    api.getRecentSessions(100).catch(() => []).then((res) => {
      if (!cancelled) setSessions(Array.isArray(res) ? res : []);
    });
    return () => { cancelled = true; };
  }, []);

  // Topología del mundo (solo si hay algún país jugado).
  useEffect(() => {
    if (played.length === 0) return undefined;
    let cancelled = false;
    loadWorldTopology()
      .then((topology) => { if (!cancelled) setWorldTopology({ status: 'ok', topology }); })
      .catch((err) => { console.error(err); if (!cancelled) setWorldTopology({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [played.length]);

  const worldProgress = useMemo(() => {
    const map = {};
    played.forEach((c) => {
      map[normalizeName(resolveTopoName(c.country_name))] = { value: c.percentage, slug: resolveSlug(c.country_name) };
    });
    return map;
  }, [played]);

  // Mapa de provincias del país elegido en "Weak & strong spots".
  const spotCountry = useMemo(
    () => (spotCountryId ? countries.find((c) => String(c.country_id) === spotCountryId) : null),
    [countries, spotCountryId]
  );
  useEffect(() => {
    if (!spotCountry) { setProvinceMap({ status: 'idle' }); return undefined; }
    let cancelled = false;
    setProvinceMap({ status: 'loading' });
    loadCountryTopology(spotCountry)
      .then(({ topology, objectKey }) => { if (!cancelled) setProvinceMap({ status: 'ok', topology, objectKey }); })
      .catch((err) => { console.error(err); if (!cancelled) setProvinceMap({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [spotCountry]);

  const provinceProgress = useMemo(() => {
    const map = {};
    (spotCountry?.regions || []).forEach((r) => { map[normalizeName(r.region_name)] = { value: r.accuracy }; });
    return map;
  }, [spotCountry]);

  const pickerOptions = useMemo(() => playedCountryOptions(played, resolveDisplayName), [played]);

  const trendSessions = sessions
    ? (trendCountryId ? sessions.filter((s) => String(s.country_id) === trendCountryId) : sessions)
    : [];
  const trendLabel = trendCountryId
    ? resolveDisplayName((played.find((c) => String(c.country_id) === trendCountryId) || {}).country_name || '')
    : null;

  return (
    <>
      <div className="identity">
        <div className="avatar-wrap">
          <div className="avatar" aria-hidden="true">{user.username?.charAt(0).toUpperCase() || '?'}</div>
          <RankSeal />
        </div>
        <div className="identity-main">
          <h1>{user.username}</h1>
          <p className="rank-title">{computeRank(played.length)}</p>
          <RankProgress playedCount={played.length} />
          <dl className="identity-meta">
            <div><dt>Member since</dt><dd>{created}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
          </dl>
        </div>
      </div>

      {totalGames === 0 ? (
        <div className="empty-log">
          Your expedition log is empty. Play your first country to open it.
          <Link className="btn" to="/">Start exploring</Link>
        </div>
      ) : (
        <>
          <div className="ledger-grid">
            <div className="ledger-tile"><span className="t-num">{played.length}<span className="t-num-sub">/{countries.length}</span></span><span className="t-label">Territories charted</span></div>
            <div className="ledger-tile"><span className="t-num">{totalGames}</span><span className="t-label">Expeditions logged</span></div>
            <div className="ledger-tile"><span className="t-num">{overallAccuracy != null ? `${overallAccuracy}%` : '—'}</span><span className="t-label">Guess accuracy</span></div>
            <div className="ledger-tile">
              <span className="t-num">{bestCountry ? `${bestCountry.percentage}%` : '—'}</span>
              <span className="t-label">Best territory</span>
              {bestCountry && <span className="t-sub">{resolveDisplayName(bestCountry.country_name)}</span>}
            </div>
            <div className="ledger-tile"><span className="t-num">{masteredCount}</span><span className="t-label">Territories mastered</span></div>
            <div className="ledger-tile"><span className="t-num">{sessions ? String(streak) : '–'}</span><span className="t-label">Current streak</span></div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Continents charted</h2></div>
            <Continents countries={countries} />
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Activity streak</h2></div>
            <Heatmap sessions={sessions} />
          </div>

          <div className="split-row">
            <div className="panel">
              <div className="panel-head">
                <h2>Accuracy trend</h2>
                {played.length > 1 && (
                  <CountryPicker options={pickerOptions} allLabel="All countries" ariaLabel="Filter accuracy trend by country" onSelect={setTrendCountryId} />
                )}
              </div>
              <Trend sessions={trendSessions} scopeLabel={trendLabel} />
            </div>
            <div className="panel">
              <div className="panel-head"><h2>Recent log</h2></div>
              <RecentLog sessions={sessions} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Weak &amp; strong spots</h2>
              <div className="panel-head-right">
                <div className="spot-toggle">
                  <button type="button" className={'spot-toggle-btn' + (spotMode === 'weak' ? ' active' : '')} onClick={() => setSpotMode('weak')}>Weakest</button>
                  <button type="button" className={'spot-toggle-btn' + (spotMode === 'strong' ? ' active' : '')} onClick={() => setSpotMode('strong')}>Strongest</button>
                </div>
                {played.length > 1 && (
                  <CountryPicker options={pickerOptions} allLabel="All territories" ariaLabel="Filter by country" onSelect={setSpotCountryId} />
                )}
              </div>
            </div>
            <Spots countries={countries} countryId={spotCountryId || null} mode={spotMode} />
            {spotCountry && (
              provinceMap.status === 'ok' ? (
                <ProgressMap variant="province" topology={provinceMap.topology} objectKey={provinceMap.objectKey} progress={provinceProgress} style={{ marginTop: 14 }} />
              ) : (
                <div className="world-map-wrap" style={{ marginTop: 14 }}>
                  <div className="log-empty">
                    {provinceMap.status === 'error' ? "Province map for this territory isn't wired up yet." : 'Loading province map…'}
                  </div>
                </div>
              )
            )}
            {spotCountry && <div className="map-legend"><span>0%</span><span className="swatch"></span><span>100%</span></div>}
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Charted territory</h2><span className="panel-sub">{played.length} of {countries.length}</span></div>
            {worldTopology.status === 'ok' ? (
              <ProgressMap variant="world" topology={worldTopology.topology} progress={worldProgress} onOpen={(slug) => navigate(countryLink(slug))} />
            ) : (
              <div className="world-map-wrap">
                <div className="log-empty">{worldTopology.status === 'error' ? "Couldn't load the world map." : 'Loading map…'}</div>
              </div>
            )}
            <div className="map-legend"><span>0%</span><span className="swatch"></span><span>100%</span></div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Country ledger</h2></div>
            <CountryLedger played={played} total={countries.length} />
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Achievements</h2><span className="panel-sub">{unlockedCount}/{ACHIEVEMENTS.length} unlocked</span></div>
            <Achievements stats={stats} />
          </div>
        </>
      )}

      <Link className="btn" to="/comparar">Compare with a friend</Link>
      <button id="logoutBtn" type="button" onClick={onLogout}>Log out</button>
    </>
  );
}

// ---------- página ----------

export default function ProfilePage() {
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!loggedIn) return undefined;
    let cancelled = false;
    setData({ status: 'loading' });
    Promise.all([api.getCurrentUser(), api.getCountriesProgress()])
      .then(([user, countries]) => { if (!cancelled) setData({ status: 'ready', user, countries }); })
      .catch((err) => {
        console.error('No se pudo cargar el perfil', err);
        if (!cancelled) setData({ status: 'error' });
      });
    return () => { cancelled = true; };
  }, [loggedIn, attempt]);

  if (!loggedIn) return <Navigate to="/login" replace />;

  const wide = data.status === 'ready' && data.countries.some((c) => c.games_played > 0);

  return (
    <div className="profile-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className={'card' + (wide ? ' wide' : '')} id="profileCard">
        <div className="brand">
          <Link className="brand-id" to="/">
            <div className="mark">G</div>
            <span className="word">Geo<i>taria</i></span>
          </Link>
          <span className="brand-tag">Expedition dossier</span>
        </div>

        {data.status === 'loading' && <div id="content">Loading…</div>}
        {data.status === 'error' && (
          <div className="empty-log">
            Couldn't load your expedition log. Check your connection and try again.
            <button className="btn" type="button" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
          </div>
        )}
        {data.status === 'ready' && (
          <ProfileView user={data.user} countries={data.countries} onLogout={() => { logout(); navigate('/'); }} />
        )}
      </div>
    </div>
  );
}
