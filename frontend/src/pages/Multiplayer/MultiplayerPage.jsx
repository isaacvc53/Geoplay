import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import { formatRelative } from '../Profile/profileLogic';
import CountryPicker from '../Profile/CountryPicker';
import { useFriends } from '../Menu/useFriends';
import { useMyMatches } from '../Menu/useMyMatches';
import { useMatchHistory } from '../Menu/useMatchHistory';
import { useMatchActions } from '../Match/useMatchActions';
import {
  DEFAULT_DURATION, DURATIONS, countryLabel, formatDuration, isUntimed, opponentOf,
} from '../Match/matchText';
import '../Menu/Menu.css';
import '../Menu/Matches.css'; // country picker styles (.challenge-country)
import './Multiplayer.css';

const RESULT_LABEL = { win: 'Won', loss: 'Lost', draw: 'Draw' };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// "Spain · 3 min · they left · 2d ago" pieces for one finished match.
function historyMeta(h) {
  const parts = [];
  if (h.country) parts.push(countryLabel(h.country));
  parts.push(formatDuration(h.duration_seconds));
  if (h.end_reason === 'forfeit') parts.push(h.result === 'win' ? 'they left' : 'you left');
  parts.push(formatRelative(h.finished_at));
  return parts.join(' · ');
}

function statusOf(match) {
  if (match.status === 'invited') return { key: 'wait', label: 'Waiting for a reply' };
  if (match.status === 'ready') return { key: 'ready', label: 'Ready to play' };
  return { key: 'live', label: 'In progress' };
}

// Decorative rings behind the page title.
function Rings() {
  return (
    <svg className="mp-rings" viewBox="0 0 400 400" aria-hidden="true">
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

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.5 12.5l4.2 4.2L18.5 7.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatTile({ label, value, tone }) {
  return (
    <div className={'mp-stat' + (tone ? ` ${tone}` : '')}>
      <span className="mp-stat-value">{value}</span>
      <span className="mp-stat-label">{label}</span>
    </div>
  );
}

// ---------- page ----------

// Multiplayer hub: live match + challenges received, a "new challenge" builder and your
// match history. Managing friends (add / requests / remove) stays in the menu's friends drawer.
export default function MultiplayerPage() {
  const { loggedIn } = useAuth();
  const friends = useFriends(loggedIn);
  const matches = useMyMatches(loggedIn);
  const history = useMatchHistory(loggedIn);
  const { current: currentMatch, invitations } = matches;
  const actions = useMatchActions({ reload: matches.reload });

  const [opponentId, setOpponentId] = useState(null);
  const [filter, setFilter] = useState('');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [countryId, setCountryId] = useState(''); // '' = random country (drawn when they accept)
  const [countries, setCountries] = useState(null);
  const [countriesFailed, setCountriesFailed] = useState(false);
  const [countriesAttempt, setCountriesAttempt] = useState(0); // bumped by "Try again"

  // History: when the page opens, and again whenever a match ends (it leaves "current").
  const reloadHistory = history.reload;
  const hasCurrent = Boolean(currentMatch);
  useEffect(() => {
    if (loggedIn && !hasCurrent) reloadHistory();
  }, [loggedIn, hasCurrent, reloadHistory]);

  // Playable countries for the picker. If it fails the challenge still works as "random".
  useEffect(() => {
    if (!loggedIn || countries) return undefined;
    let cancelled = false;
    api.getMatchCountries()
      .then((list) => { if (!cancelled) { setCountries(list); setCountriesFailed(false); } })
      .catch(() => { if (!cancelled) setCountriesFailed(true); });
    return () => { cancelled = true; };
  }, [loggedIn, countries, countriesAttempt]);

  const countryOptions = useMemo(
    () => (countries || [])
      .map((c) => ({ id: c.id, label: countryLabel(c) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [countries]
  );
  const pickedCountry = countryOptions.find((o) => o.id === countryId);

  const friendList = useMemo(() => (friends.data ? friends.data.friends : []), [friends.data]);
  const opponent = friendList.find((f) => f.user_id === opponentId) || null;
  const q = filter.trim().toLowerCase();
  const shownFriends = q ? friendList.filter((f) => f.username.toLowerCase().includes(q)) : friendList;

  const busy = Boolean(actions.busy);
  const blocked = hasCurrent; // one open match at a time
  const canSend = Boolean(opponent) && !busy && !blocked;

  const record = history.record;
  const played = history.total;
  const winRate = record && played ? `${Math.round((record.wins / played) * 100)}%` : '—';

  function send() {
    if (!canSend) return;
    actions.challenge(opponent.username, duration, countryId === '' ? null : countryId);
  }

  return (
    <div className="menu-page multiplayer-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <div className="mp-shell">
          <Link className="btn-back mp-back" to="/"><span>←</span> Main menu</Link>

          <header className="mp-hero">
            <Rings />
            <div className="mp-hero-text">
              <span className="mp-eyebrow">1 vs 1</span>
              <h1>Multi<i>player</i></h1>
              <p>Challenge a friend to name the regions of the same country. Race the clock, or play with no time limit.</p>
            </div>
            {loggedIn && (
              <div className="mp-stats" aria-label="Your record">
                <StatTile label="Played" value={played} />
                <StatTile label="Won" value={record ? record.wins : 0} tone="win" />
                <StatTile label="Lost" value={record ? record.losses : 0} tone="loss" />
                <StatTile label="Win rate" value={winRate} />
              </div>
            )}
          </header>

          {!loggedIn ? (
            <section className="mp-card mp-gate">
              <div className="mp-steps-row">
                {[
                  ['1', 'Pick a friend', 'Add friends by username from the menu.'],
                  ['2', 'Set the match', 'Choose the length and a country, or leave it random.'],
                  ['3', 'Race', 'Whoever finds more regions wins.'],
                ].map(([n, title, desc]) => (
                  <div className="mp-how" key={n}>
                    <span className="mp-how-n">{n}</span>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
              <div className="mp-gate-cta">
                <p>Sign in to play with your friends and keep your match record.</p>
                <Link to="/login" className="signin account-cta">Sign in</Link>
              </div>
            </section>
          ) : (
            <>
              {actions.error && <p className="mp-error" role="alert">{actions.error}</p>}

              {/* ---- live: your open match + challenges waiting for an answer ---- */}
              {(currentMatch || invitations.length > 0) && (
                <section className="mp-live" aria-label="Active">
                  {currentMatch && (() => {
                    const rival = opponentOf(currentMatch);
                    const st = statusOf(currentMatch);
                    const cancellable = currentMatch.status === 'invited' || currentMatch.status === 'ready';
                    return (
                      <article className={`mp-match ${st.key}`}>
                        <div className="mp-match-top">
                          <span className={`mp-status ${st.key}`}><i aria-hidden="true" />{st.label}</span>
                          <span className="mp-match-tag">Your match</span>
                        </div>
                        <div className="mp-match-body">
                          <UserAvatar className="mp-avatar big" userId={rival.user_id} name={rival.username} version={rival.avatar_updated_at} />
                          <div className="mp-who">
                            <span className="mp-name">vs {rival.username}</span>
                            <span className="mp-meta">
                              {formatDuration(currentMatch.duration_seconds)}
                              {currentMatch.country && ` · ${countryLabel(currentMatch.country)}`}
                            </span>
                          </div>
                          <div className="mp-row-actions">
                            <Link className="mp-btn primary" to={`/partida/${currentMatch.id}`}>
                              {currentMatch.status === 'playing' ? 'Rejoin' : 'Open'}
                            </Link>
                            {cancellable && (
                              <button type="button" className="mp-btn" disabled={busy} onClick={() => actions.cancel(currentMatch.id)}>
                                {currentMatch.status === 'invited' ? 'Cancel' : 'Leave'}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })()}

                  {invitations.map((m) => (
                    <article className="mp-match invite" key={m.id}>
                      <div className="mp-match-top">
                        <span className="mp-status invite"><i aria-hidden="true" />New challenge</span>
                        <span className="mp-match-tag">{formatRelative(m.created_at)}</span>
                      </div>
                      <div className="mp-match-body">
                        <UserAvatar className="mp-avatar big" userId={m.host.user_id} name={m.host.username} version={m.host.avatar_updated_at} />
                        <div className="mp-who">
                          <span className="mp-name">{m.host.username} challenged you</span>
                          <span className="mp-meta">
                            {formatDuration(m.duration_seconds)} · {m.country_chosen && m.country ? countryLabel(m.country) : 'random country'}
                          </span>
                        </div>
                        <div className="mp-row-actions">
                          <button
                            type="button"
                            className="mp-btn primary"
                            disabled={busy || hasCurrent}
                            title={hasCurrent ? 'Leave your current match first' : undefined}
                            onClick={() => actions.accept(m.id)}
                          >
                            Accept
                          </button>
                          <button type="button" className="mp-btn" disabled={busy} onClick={() => actions.decline(m.id)}>
                            Decline
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              <div className="mp-grid">
                {/* ---- new challenge ---- */}
                <section className="mp-card mp-new" aria-labelledby="mp-new-title">
                  <div className="mp-card-head">
                    <h2 id="mp-new-title">New challenge</h2>
                    <span className="mp-card-hint">3 quick steps</span>
                  </div>

                  <div className="mp-step">
                    <div className="mp-step-head">
                      <span className="mp-step-n">1</span>
                      <span className="mp-step-title">Opponent</span>
                      {friendList.length > 0 && <span className="mp-count">{friendList.length}</span>}
                    </div>

                    {!friends.data && friends.loading && (
                      <div className="mp-skel" aria-hidden="true"><span /><span /><span /></div>
                    )}

                    {!friends.data && !friends.loading && friends.error && (
                      <div className="mp-empty">
                        <p>Couldn&apos;t load your friends.</p>
                        <button type="button" className="mp-btn" onClick={friends.reload}>Try again</button>
                      </div>
                    )}

                    {friends.data && friendList.length === 0 && (
                      <div className="mp-empty">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M4 19c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M14.5 19c.3-2.3 1.8-4 3.8-4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <p className="mp-empty-title">No friends to challenge yet</p>
                        <p>Add a friend by username and they will show up here.</p>
                        <Link to="/?panel=friends" className="mp-btn primary">Add friends</Link>
                      </div>
                    )}

                    {friendList.length > 0 && (
                      <>
                        {friendList.length > 5 && (
                          <input
                            type="text"
                            className="mp-filter"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Search your friends"
                            aria-label="Search your friends"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        )}
                        <div className="mp-friends" role="radiogroup" aria-label="Opponent">
                          {shownFriends.map((f) => (
                            <label className="mp-friend" key={f.friendship_id}>
                              <input
                                type="radio"
                                name="opponent"
                                checked={opponentId === f.user_id}
                                disabled={busy}
                                onChange={() => setOpponentId(f.user_id)}
                              />
                              <span className="mp-friend-body">
                                <UserAvatar className="mp-avatar" userId={f.user_id} name={f.username} version={f.avatar_updated_at} />
                                <span className="mp-who">
                                  <span className="mp-name">{f.username}</span>
                                  <span className="mp-meta">
                                    {plural(f.games_played, 'game', 'games')} · {plural(f.countries_played, 'country', 'countries')}
                                  </span>
                                </span>
                                <span className="mp-tick"><Check /></span>
                              </span>
                            </label>
                          ))}
                          {shownFriends.length === 0 && <p className="mp-none">No friends match &ldquo;{filter}&rdquo;.</p>}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mp-step">
                    <div className="mp-step-head">
                      <span className="mp-step-n">2</span>
                      <span className="mp-step-title">Match length</span>
                    </div>
                    <div className="mp-durations" role="radiogroup" aria-label="Match length">
                      {DURATIONS.map((d) => (
                        <label className="mp-dur" key={d}>
                          <input
                            type="radio"
                            name="duration"
                            checked={duration === d}
                            disabled={busy}
                            onChange={() => setDuration(d)}
                          />
                          <span>{formatDuration(d)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mp-step">
                    <div className="mp-step-head">
                      <span className="mp-step-n">3</span>
                      <span className="mp-step-title">Country</span>
                    </div>
                    {countriesFailed && !countries ? (
                      <p className="mp-none">
                        Couldn&apos;t load the countries, so it will be a random one.{' '}
                        <button type="button" className="mp-link" onClick={() => { setCountriesFailed(false); setCountriesAttempt((n) => n + 1); }}>
                          Try again
                        </button>
                      </p>
                    ) : (
                      <div className="challenge-country mp-country">
                        <CountryPicker
                          options={countryOptions}
                          allLabel="Random country"
                          ariaLabel="Country for your challenge"
                          onSelect={setCountryId}
                        />
                      </div>
                    )}
                  </div>

                  <div className={'mp-summary' + (opponent ? ' ready' : '')} aria-live="polite">
                    {blocked ? (
                      <p>You already have an open match. Finish or leave it before sending a new challenge.</p>
                    ) : opponent ? (
                      <>
                        <p className="mp-summary-line">
                          <strong>You</strong> vs <strong>{opponent.username}</strong>
                          {' · '}{formatDuration(duration)}
                          {' · '}{pickedCountry ? pickedCountry.label : 'Random country'}
                        </p>
                        <p className="mp-summary-note">
                          {pickedCountry
                            ? `${opponent.username} sees the country in the invitation. `
                            : `A random country is drawn when ${opponent.username} accepts. `}
                          {isUntimed(duration)
                            ? 'No clock: the first to find every region wins (it ends after 60 min at most).'
                            : 'Whoever finds more regions in time wins.'}
                        </p>
                      </>
                    ) : (
                      <p>Pick a friend to start a challenge.</p>
                    )}
                  </div>

                  <button type="button" className="mp-btn primary wide" disabled={!canSend} onClick={send}>
                    {actions.busy === 'challenge' ? 'Sending…' : opponent ? `Challenge ${opponent.username}` : 'Send challenge'}
                  </button>
                </section>

                {/* ---- history ---- */}
                <section className="mp-card mp-history" aria-labelledby="mp-history-title">
                  <div className="mp-card-head">
                    <h2 id="mp-history-title">Match history</h2>
                    {history.total > 0 && <span className="mp-count">{history.total}</span>}
                  </div>

                  {record && played > 0 && (
                    <div className="mp-record">
                      <div className="mp-bar" role="img" aria-label={`${record.wins} won, ${record.losses} lost, ${record.draws} drawn`}>
                        {record.wins > 0 && <span className="win" style={{ flexGrow: record.wins }} />}
                        {record.draws > 0 && <span className="draw" style={{ flexGrow: record.draws }} />}
                        {record.losses > 0 && <span className="loss" style={{ flexGrow: record.losses }} />}
                      </div>
                      <p className="mp-record-text">
                        <b className="win">{record.wins}</b> won ·{' '}
                        <b className="loss">{record.losses}</b> lost ·{' '}
                        <b>{record.draws}</b> {record.draws === 1 ? 'draw' : 'draws'}
                      </p>
                    </div>
                  )}

                  {history.total === 0 ? (
                    <div className="mp-empty">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 4h10v3.2c0 3-2.2 5.3-5 5.3s-5-2.3-5-5.3V4z" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M12 12.5V17m-3 3h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      <p className="mp-empty-title">{history.loaded ? 'No matches yet' : 'Loading…'}</p>
                      {history.loaded && <p>Your finished 1 vs 1 matches and your record will show up here.</p>}
                    </div>
                  ) : (
                    <ul className="mp-history-list">
                      {history.items.map((h) => (
                        <li key={h.id}>
                          <Link className={`mp-hrow ${h.result}`} to={`/partida/${h.id}`}>
                            <UserAvatar className="mp-avatar" userId={h.opponent.user_id} name={h.opponent.username} version={h.opponent.avatar_updated_at} />
                            <span className="mp-who">
                              <span className="mp-name">
                                <span className={`mp-result ${h.result}`}>{RESULT_LABEL[h.result]}</span>
                                {' '}vs {h.opponent.username}
                              </span>
                              <span className="mp-meta">{historyMeta(h)}</span>
                            </span>
                            <span className="mp-score">{h.my_score}<em>–</em>{h.opponent.score}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {history.error && <p className="mp-none">Couldn&apos;t load more matches. Check your connection.</p>}
                  {history.hasMore && (
                    <button type="button" className="mp-btn wide" disabled={history.loadingMore} onClick={history.loadMore}>
                      {history.loadingMore ? 'Loading…' : 'Show more'}
                    </button>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
