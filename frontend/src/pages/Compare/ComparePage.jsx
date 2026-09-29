import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { resolveDisplayName, resolveSlug } from '../../lib/countryInfo';
import { useFriends } from '../Menu/useFriends';
import UserAvatar from '../../components/UserAvatar';
import { computeRank, formatRelative } from '../Profile/profileLogic';
import {
  COUNTRY_FILTERS, METRICS, barWidths, compareContinents, computeScore, countryWinner,
  decide, filterCountries, hasAnyGames, plural, sortCountries, sortRegions,
  summarizeRegions,
} from './compareLogic';
import './Compare.css';

// Head-to-head page (/comparar?con=<username>) — EN INGLÉS, como el perfil.
// Datos: GET /compare (resumen de los dos) y, al abrir un país,
// GET /compare/countries/{id} (región por región). Solo funciona con amigos.

const REGIONS_PREVIEW = 10;
const countryLink = (slug) => `/pais?pais=${encodeURIComponent(slug)}`;
const compareLink = (username) => `/comparar?con=${encodeURIComponent(username)}`;

// ---------- small pieces ----------

function Avatar({ user, size }) {
  return (
    <UserAvatar
      className={'cmp-avatar' + (size === 'sm' ? ' sm' : '')}
      userId={user.user_id}
      name={user.username}
      version={user.avatar_updated_at}
    />
  );
}

function Contender({ user, isMe }) {
  const rank = computeRank(user.countries_played);
  return (
    <div className="cmp-contender">
      <Avatar user={user} />
      <h2 className="cmp-name-main">{isMe ? 'You' : user.username}</h2>
      <span className="cmp-rank">{rank}</span>
      <span className="cmp-last">
        {user.last_played_at ? `Last played ${formatRelative(user.last_played_at).toLowerCase()}` : "Hasn't played yet"}
      </span>
    </div>
  );
}

// The memorable moment of the page: the tally of categories won.
function Versus({ me, friend, score }) {
  let verdict = 'All square';
  if (score.me > score.friend) verdict = 'You lead';
  else if (score.friend > score.me) verdict = `${friend.username} leads`;
  const total = METRICS.length;
  return (
    <div className="cmp-versus">
      <Contender user={me} isMe />
      <div className="cmp-score" role="group" aria-label={`Score: you ${score.me}, ${friend.username} ${score.friend}`}>
        <span className="cmp-score-num">{score.me}<span aria-hidden="true">–</span>{score.friend}</span>
        <span className="cmp-score-verdict">{verdict}</span>
        <span className="cmp-score-note">of {total} categories{score.tie > 0 ? `, ${score.tie} tied` : ''}</span>
      </div>
      <Contender user={friend} />
    </div>
  );
}

// One category, drawn as two bars growing away from a shared centre line.
function VsRow({ label, aText, bText, winner, widths, animate }) {
  const cls = (side) => (winner === side ? 'win' : winner === 'tie' ? 'tie' : 'lose');
  return (
    <div className="vs-row">
      <div className="vs-head">
        <span className={`vs-val left ${cls('me')}`}>{aText}</span>
        <span className="vs-label">{label}</span>
        <span className={`vs-val right ${cls('friend')}`}>{bText}</span>
      </div>
      <div className="vs-bars" aria-hidden="true">
        <span className="vs-track left">
          <span className={`vs-fill ${cls('me')}${animate ? ' grow' : ''}`} style={{ width: `${widths[0]}%` }} />
        </span>
        <span className="vs-track right">
          <span className={`vs-fill ${cls('friend')}${animate ? ' grow' : ''}`} style={{ width: `${widths[1]}%` }} />
        </span>
      </div>
      <span className="sr-only">{`You: ${aText}. Them: ${bText}.`}</span>
    </div>
  );
}

function Scoreboard({ me, friend }) {
  return (
    <div className="vs-list">
      {METRICS.map((m) => {
        const a = me[m.key];
        const b = friend[m.key];
        return (
          <VsRow
            key={m.key}
            label={m.label}
            aText={a == null ? '—' : m.format(a)}
            bText={b == null ? '—' : m.format(b)}
            winner={decide(m.better, a, b)}
            widths={barWidths(m, a, b)}
            animate
          />
        );
      })}
    </div>
  );
}

function Continents({ countries }) {
  const rows = compareContinents(countries);
  if (!rows.length) return null;
  const metric = { better: 'high' };
  return (
    <div className="panel">
      <div className="panel-head"><h2>Continents charted</h2><span className="panel-sub">territories played</span></div>
      <div className="vs-list">
        {rows.map((r) => (
          <VsRow
            key={r.name}
            label={r.name}
            aText={String(r.me)}
            bText={String(r.friend)}
            winner={decide('high', r.me, r.friend)}
            widths={barWidths(metric, r.me, r.friend)}
          />
        ))}
      </div>
    </div>
  );
}

// A percentage with its bar. `state`: win | lose | tie (colouring only).
function PctCell({ pct, state, emptyText }) {
  if (pct == null) return <span className="cmp-cell none">{emptyText}</span>;
  return (
    <span className={`cmp-cell ${state}`}>
      <span className="cmp-bar"><span className="cmp-bar-fill" style={{ width: `${pct}%` }} /></span>
      <span className="cmp-pct">{pct}%</span>
    </span>
  );
}

const stateFor = (winner, side) => (winner === side ? 'win' : winner === 'tie' || winner == null ? 'tie' : 'lose');

function SideChip({ who, side }) {
  return (
    <div className="cmp-chip-side">
      <strong>{who}</strong>
      {side
        ? <span>{side.best_percentage}% best · {plural(side.games_played, 'game', 'games')}</span>
        : <span className="dim">Hasn&apos;t played this one</span>}
    </div>
  );
}

function RegionRows({ regions, friendName }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => sortRegions(regions), [regions]);
  if (!sorted.length) return <div className="log-empty">Nobody has answered a region here yet.</div>;

  const s = summarizeRegions(sorted);
  const shown = showAll ? sorted : sorted.slice(0, REGIONS_PREVIEW);
  const parts = [];
  if (s.me) parts.push(`You lead on ${plural(s.me, 'region', 'regions')}`);
  if (s.friend) parts.push(`${friendName} on ${s.friend}`);
  if (s.tie) parts.push(`${s.tie} level`);
  const oneSided = s.meOnly + s.friendOnly;

  return (
    <>
      <p className="cmp-summary">
        {parts.length ? `${parts.join(' · ')}.` : 'No region has been answered by both of you yet.'}
        {oneSided > 0 && ` ${plural(oneSided, 'region', 'regions')} only one of you has seen.`}
      </p>
      <div className="cmp-region-list">
        {shown.map((r) => {
          const winner = r.me && r.friend ? decide('high', r.me.accuracy, r.friend.accuracy) : null;
          return (
            <div className="cmp-region" key={r.region_id}>
              <span className="cmp-name">{r.region_name}</span>
              <PctCell pct={r.me ? r.me.accuracy : null} state={stateFor(winner, 'me')} emptyText="No attempts" />
              <PctCell pct={r.friend ? r.friend.accuracy : null} state={stateFor(winner, 'friend')} emptyText="No attempts" />
            </div>
          );
        })}
      </div>
      {sorted.length > REGIONS_PREVIEW && (
        <button type="button" className="cmp-link-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer regions' : `Show all ${sorted.length} regions`}
        </button>
      )}
    </>
  );
}

function CountryDetail({ row, detail, friendName, onRetry }) {
  const slug = row.country_slug || resolveSlug(row.country_name);
  return (
    <div className="cmp-detail">
      <div className="cmp-sides">
        <SideChip who="You" side={row.me} />
        <SideChip who={friendName} side={row.friend} />
      </div>
      <p className="cmp-detail-title">Region accuracy across every game</p>
      {(!detail || detail.status === 'loading') && <div className="log-empty">Loading regions…</div>}
      {detail && detail.status === 'error' && (
        <div className="log-empty">
          Couldn&apos;t load the regions. <button type="button" className="cmp-link-btn" onClick={onRetry}>Try again</button>
        </div>
      )}
      {detail && detail.status === 'ok' && <RegionRows regions={detail.data.regions} friendName={friendName} />}
      <Link className="cmp-play" to={countryLink(slug)}>Play {resolveDisplayName(row.country_name)}</Link>
    </div>
  );
}

function Countries({ countries, friendName }) {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('gap');
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({}); // country_id -> { status, data }

  const rows = useMemo(
    () => sortCountries(filterCountries(countries, filter), sort, resolveDisplayName),
    [countries, filter, sort]
  );

  function load(id) {
    setDetails((d) => ({ ...d, [id]: { status: 'loading' } }));
    api.getCountryComparison(id, friendName)
      .then((data) => setDetails((d) => ({ ...d, [id]: { status: 'ok', data } })))
      .catch(() => setDetails((d) => ({ ...d, [id]: { status: 'error' } })));
  }

  function toggle(id) {
    setOpenId((cur) => (cur === id ? null : id));
    const known = details[id];
    if (!known || known.status === 'error') load(id);
  }

  if (!countries.length) {
    return <div className="log-empty">Neither of you has charted a territory yet.</div>;
  }

  return (
    <>
      <div className="cmp-toolbar">
        <div className="cmp-chips" role="group" aria-label="Show territories">
          {COUNTRY_FILTERS.map((f) => {
            const count = filterCountries(countries, f.id).length;
            return (
              <button
                type="button"
                key={f.id}
                className={'cmp-chip' + (filter === f.id ? ' active' : '')}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label(friendName)} <span className="cmp-chip-n">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="cmp-chips" role="group" aria-label="Sort territories">
          <button type="button" className={'cmp-chip' + (sort === 'gap' ? ' active' : '')} aria-pressed={sort === 'gap'} onClick={() => setSort('gap')}>Biggest gap</button>
          <button type="button" className={'cmp-chip' + (sort === 'name' ? ' active' : '')} aria-pressed={sort === 'name'} onClick={() => setSort('name')}>A–Z</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="log-empty">No territories match this filter.</div>
      ) : (
        <div className="cmp-table">
          <div className="cmp-cols" aria-hidden="true">
            <span>Territory</span><span>You</span><span>{friendName}</span><span />
          </div>
          {rows.map((c) => {
            const winner = countryWinner(c);
            const open = openId === c.country_id;
            return (
              <div className="cmp-item" key={c.country_id}>
                <button
                  type="button"
                  className={'cmp-row' + (open ? ' open' : '')}
                  aria-expanded={open}
                  onClick={() => toggle(c.country_id)}
                >
                  <span className="cmp-name">{resolveDisplayName(c.country_name)}</span>
                  <PctCell pct={c.me ? c.me.best_percentage : null} state={stateFor(winner, 'me')} emptyText="Not played" />
                  <PctCell pct={c.friend ? c.friend.best_percentage : null} state={stateFor(winner, 'friend')} emptyText="Not played" />
                  <span className="cmp-chev" aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <CountryDetail
                    row={c}
                    detail={details[c.country_id]}
                    friendName={friendName}
                    onRetry={() => load(c.country_id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------- picking who to compare with ----------

function FriendSelect({ friends, current, onChange }) {
  const list = friends.data ? friends.data.friends : [];
  const match = list.find((f) => f.username.toLowerCase() === current.toLowerCase());
  if (!list.length) return null;
  return (
    <label className="cmp-who">
      <span>Comparing with</span>
      <select
        className="cmp-select"
        value={match ? match.username : ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {!match && <option value="" disabled>Choose a friend</option>}
        {list.map((f) => <option key={f.friendship_id} value={f.username}>{f.username}</option>)}
      </select>
    </label>
  );
}

function FriendPicker({ friends }) {
  const { data, error, loading, reload } = friends;
  if (!data && loading) return <div className="log-empty">Loading your friends…</div>;
  if (!data && error) {
    return (
      <div className="cmp-empty">
        Couldn&apos;t load your friends.
        <button type="button" className="cmp-btn" onClick={reload}>Try again</button>
      </div>
    );
  }
  if (!data) return null;
  if (!data.friends.length) {
    return (
      <div className="cmp-empty">
        You need a friend to compare with. Send a request from the friends panel and come back once they accept.
        <Link className="cmp-btn" to="/?panel=friends">Add friends</Link>
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="panel-head"><h2>Who do you want to compare with?</h2></div>
      <div className="cmp-pick-list">
        {data.friends.map((f) => (
          <Link className="cmp-pick" key={f.friendship_id} to={compareLink(f.username)}>
            <Avatar user={f} size="sm" />
            <span className="cmp-pick-who">
              <span className="cmp-pick-name">{f.username}</span>
              <span className="cmp-pick-meta">
                {plural(f.games_played, 'game', 'games')}{f.accuracy != null ? ` · ${f.accuracy}% accuracy` : ''}
              </span>
            </span>
            <span className="cmp-chev" aria-hidden="true">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------- page ----------

export default function ComparePage() {
  const { loggedIn } = useAuth();
  const [params, setParams] = useSearchParams();
  const con = (params.get('con') || '').trim();
  const friends = useFriends(loggedIn);
  const [attempt, setAttempt] = useState(0);
  // Stored together with the request it answers, so a stale answer (another
  // friend, or before a retry) is never shown: loading is derived, not set.
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loggedIn || !con) return undefined;
    let cancelled = false;
    api.getComparison(con)
      .then((data) => { if (!cancelled) setResult({ con, attempt, status: 'ok', data }); })
      .catch((err) => {
        if (!cancelled) setResult({ con, attempt, status: 'error', notFriend: err && err.code === 'friend_not_found' });
      });
    return () => { cancelled = true; };
  }, [loggedIn, con, attempt]);

  if (!loggedIn) return <Navigate to="/login" replace />;

  const current = result && result.con === con && result.attempt === attempt ? result : null;
  const chooseFriend = (name) => setParams(name ? { con: name } : {});

  let body;
  if (!con) {
    body = <FriendPicker friends={friends} />;
  } else if (!current) {
    body = <div className="log-empty">Loading the comparison…</div>;
  } else if (current.status === 'error') {
    body = current.notFriend ? (
      <div className="cmp-empty">
        {con} isn&apos;t on your friends list, so there&apos;s nothing to compare. Only accepted friends can be compared.
        <Link className="cmp-btn" to="/comparar">Pick a friend</Link>
      </div>
    ) : (
      <div className="cmp-empty">
        Couldn&apos;t load the comparison. Check your connection and try again.
        <button type="button" className="cmp-btn" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
      </div>
    );
  } else {
    const { me, friend, countries } = current.data;
    body = (
      <>
        <Versus me={me} friend={friend} score={computeScore(me, friend)} />
        {!hasAnyGames(me, friend) ? (
          <div className="cmp-empty">
            Neither of you has played yet. Chart a territory each and come back to see who&apos;s ahead.
            <Link className="cmp-btn" to="/">Start exploring</Link>
          </div>
        ) : (
          <>
            <div className="panel">
              <div className="panel-head"><h2>Scoreboard</h2><span className="panel-sub">longer bar wins</span></div>
              <Scoreboard me={me} friend={friend} />
            </div>
            <Continents countries={countries} />
            <div className="panel">
              <div className="panel-head"><h2>Territory by territory</h2><span className="panel-sub">best game in each</span></div>
              <Countries key={friend.user_id} countries={countries} friendName={friend.username} />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="compare-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="card">
        <div className="brand">
          <Link className="brand-id" to="/">
            <div className="mark">G</div>
            <span className="word">Geo<i>taria</i></span>
          </Link>
          <span className="brand-tag">Head to head</span>
        </div>

        <FriendSelect friends={friends} current={con} onChange={chooseFriend} />
        {body}

        <nav className="cmp-foot">
          <Link to="/perfil">Your dossier</Link>
          <Link to="/">Home</Link>
        </nav>
      </div>
    </div>
  );
}
