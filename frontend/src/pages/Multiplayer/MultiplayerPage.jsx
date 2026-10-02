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
import '../Menu/Friends.css';
import '../Menu/Matches.css';
import './Multiplayer.css';

const RESULT_LABEL = { win: 'Won', loss: 'Lost', draw: 'Draw' };

// "Spain · 3 min · they left · 2d ago" pieces for one finished match.
function historyMeta(h) {
  const parts = [];
  if (h.country) parts.push(countryLabel(h.country));
  parts.push(formatDuration(h.duration_seconds));
  if (h.end_reason === 'forfeit') parts.push(h.result === 'win' ? 'they left' : 'you left');
  parts.push(formatRelative(h.finished_at));
  return parts.join(' · ');
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Multiplayer hub: your open match, the challenges you received, challenge a friend
// (1 vs 1) and your match history. Friend management itself lives in the friends drawer
// of the main menu.
export default function MultiplayerPage() {
  const { loggedIn } = useAuth();
  const friends = useFriends(loggedIn);
  const matches = useMyMatches(loggedIn);
  const history = useMatchHistory(loggedIn);
  const { current: currentMatch, invitations } = matches;
  const actions = useMatchActions({ reload: matches.reload });

  const [challengeUserId, setChallengeUserId] = useState(null); // friend whose picker is open
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [countryId, setCountryId] = useState(''); // '' = random country (drawn when they accept)
  const [countries, setCountries] = useState(null); // playable countries, loaded on first open
  const [countriesFailed, setCountriesFailed] = useState(false);
  const [countriesAttempt, setCountriesAttempt] = useState(0); // bumped by "Try again"

  // Friends and history are fetched when the page opens (matches are polled by the hook).
  const reloadHistory = history.reload;
  useEffect(() => {
    if (loggedIn) reloadHistory();
  }, [loggedIn, reloadHistory]);

  // When a match ends (it leaves "current"), refresh the history so it shows up.
  const hasCurrent = Boolean(currentMatch);
  useEffect(() => {
    if (loggedIn && !hasCurrent) reloadHistory();
  }, [hasCurrent, loggedIn, reloadHistory]);

  // The country list is fetched the first time a challenge picker opens. If it fails the
  // challenge still works: it just stays a random country.
  useEffect(() => {
    if (challengeUserId == null || countries) return undefined;
    let cancelled = false;
    api.getMatchCountries()
      .then((list) => { if (!cancelled) { setCountries(list); setCountriesFailed(false); } })
      .catch(() => { if (!cancelled) setCountriesFailed(true); });
    return () => { cancelled = true; };
  }, [challengeUserId, countries, countriesAttempt]);

  const countryOptions = useMemo(
    () => (countries || [])
      .map((c) => ({ id: c.id, label: countryLabel(c) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [countries]
  );
  const pickedCountry = countryOptions.find((o) => o.id === countryId);

  const friendList = friends.data ? friends.data.friends : [];
  const disabled = Boolean(actions.busy);

  return (
    <div className="menu-page multiplayer-page">
      <div className="chart-ground" aria-hidden="true" />
      <div className="page">
        <header className="multi-head">
          <Link className="btn-back" to="/"><span>←</span> Main menu</Link>
          <div className="multi-title">
            <div className="icon-circle big">
              <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="13.5" r="7.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 13.5V9.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M9.3 3.5h5.4M12 3.5v1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1>Multiplayer</h1>
              <p className="multi-sub">Challenge a friend to a 1 vs 1 on the same country: against the clock or with no time limit.</p>
            </div>
          </div>
        </header>

        <main className="multi-main">
          {!loggedIn ? (
            <div className="drawer-empty">
              <p className="drawer-empty-title">Sign in to play with friends</p>
              <p className="drawer-empty-desc">Add friends, send challenges and keep track of your match record.</p>
              <Link to="/login" className="signin account-cta">Sign in</Link>
            </div>
          ) : (
            <>
              <div className="friends-msg-slot" aria-live="polite">
                {actions.error && <p className="friends-msg error">{actions.error}</p>}
              </div>

              {currentMatch && (
                <section className="friends-section">
                  <h3>Your match</h3>
                  <ul>
                    <li className="friend-row">
                      <UserAvatar
                        className="friend-avatar"
                        userId={opponentOf(currentMatch).user_id}
                        name={opponentOf(currentMatch).username}
                        version={opponentOf(currentMatch).avatar_updated_at}
                      />
                      <span className="friend-who">
                        <span className="friend-name">vs {opponentOf(currentMatch).username}</span>
                        <span className="friend-meta">
                          {currentMatch.status === 'invited'
                            ? 'waiting for a reply'
                            : currentMatch.status === 'ready' ? 'ready to play' : 'in progress'}
                          {' · '}{formatDuration(currentMatch.duration_seconds)}
                          {currentMatch.country && ` · ${countryLabel(currentMatch.country)}`}
                        </span>
                      </span>
                      <span className="friend-actions">
                        <Link className="friend-btn primary" to={`/partida/${currentMatch.id}`}>
                          {currentMatch.status === 'playing' ? 'Rejoin' : 'Open'}
                        </Link>
                        {(currentMatch.status === 'invited' || currentMatch.status === 'ready') && (
                          <button
                            type="button"
                            className="friend-btn"
                            disabled={disabled}
                            onClick={() => actions.cancel(currentMatch.id)}
                          >
                            {currentMatch.status === 'invited' ? 'Cancel' : 'Leave'}
                          </button>
                        )}
                      </span>
                    </li>
                  </ul>
                </section>
              )}

              {invitations.length > 0 && (
                <section className="friends-section">
                  <h3>Challenges <span className="friends-count">{invitations.length}</span></h3>
                  <ul>
                    {invitations.map((m) => (
                      <li className="friend-row" key={m.id}>
                        <UserAvatar className="friend-avatar" userId={m.host.user_id} name={m.host.username} version={m.host.avatar_updated_at} />
                        <span className="friend-who">
                          <span className="friend-name">{m.host.username}</span>
                          <span className="friend-meta">
                            challenged you · {formatDuration(m.duration_seconds)} · {m.country_chosen && m.country ? countryLabel(m.country) : 'random country'}
                          </span>
                        </span>
                        <span className="friend-actions">
                          <button
                            type="button"
                            className="friend-btn primary"
                            disabled={disabled || Boolean(currentMatch)}
                            title={currentMatch ? 'Leave your current match first' : undefined}
                            onClick={() => actions.accept(m.id)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="friend-btn"
                            disabled={disabled}
                            onClick={() => actions.decline(m.id)}
                          >
                            Decline
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="friends-section">
                <h3>Challenge a friend {friendList.length > 0 && <span className="friends-count">{friendList.length}</span>}</h3>

                {!friends.data && friends.loading && <p className="friends-note">Loading…</p>}

                {!friends.data && !friends.loading && friends.error && (
                  <div className="friends-note">
                    <p>Couldn&apos;t load your friends.</p>
                    <button type="button" className="friend-btn" onClick={friends.reload}>Try again</button>
                  </div>
                )}

                {friends.data && friendList.length === 0 && (
                  <div className="multi-empty">
                    <p className="drawer-empty-title">No friends to challenge yet</p>
                    <p className="drawer-empty-desc">Add a friend from the friends panel and they will show up here.</p>
                    <Link to="/?panel=friends" className="friend-btn primary">Add friends</Link>
                  </div>
                )}

                {friendList.length > 0 && (
                  <ul>
                    {friendList.map((f) => (
                      <li className="friend-row has-footer" key={f.friendship_id}>
                        <UserAvatar className="friend-avatar" userId={f.user_id} name={f.username} version={f.avatar_updated_at} />
                        <span className="friend-who">
                          <span className="friend-name">{f.username}</span>
                          <span className="friend-meta">
                            {plural(f.games_played, 'game', 'games')} · {plural(f.countries_played, 'country', 'countries')}
                          </span>
                        </span>
                        <span className="friend-actions">
                          <button
                            type="button"
                            className="friend-btn primary"
                            disabled={disabled || Boolean(currentMatch)}
                            title={currentMatch ? 'Finish or cancel your current match first' : `Challenge ${f.username} to a 1 vs 1`}
                            aria-expanded={challengeUserId === f.user_id}
                            onClick={() => {
                              // The picker always opens on "random country" (its input is remounted empty).
                              setCountryId('');
                              setChallengeUserId((cur) => (cur === f.user_id ? null : f.user_id));
                            }}
                          >
                            Challenge
                          </button>
                        </span>
                        {challengeUserId === f.user_id && (
                          <div className="challenge-picker">
                            <span className="challenge-picker-label" id={`dur-${f.user_id}`}>Match length</span>
                            <div className="challenge-durations" role="radiogroup" aria-labelledby={`dur-${f.user_id}`}>
                              {DURATIONS.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  role="radio"
                                  aria-checked={duration === d}
                                  className="challenge-chip"
                                  disabled={disabled}
                                  onClick={() => setDuration(d)}
                                >
                                  {formatDuration(d)}
                                </button>
                              ))}
                            </div>
                            <span className="challenge-picker-label" id={`cty-${f.user_id}`}>Country</span>
                            {countriesFailed && !countries ? (
                              <p className="challenge-note">
                                Couldn&apos;t load the countries, so it will be a random one.{' '}
                                <button type="button" className="match-banner-link" onClick={() => { setCountriesFailed(false); setCountriesAttempt((n) => n + 1); }}>
                                  Try again
                                </button>
                              </p>
                            ) : (
                              <div className="challenge-country">
                                <CountryPicker
                                  key={f.user_id}
                                  options={countryOptions}
                                  allLabel="Random country"
                                  ariaLabel={`Country for your challenge to ${f.username}`}
                                  onSelect={setCountryId}
                                />
                              </div>
                            )}
                            <p className="challenge-note">
                              {pickedCountry
                                ? `${pickedCountry.label} it is. ${f.username} sees it in the invitation. `
                                : `A random country is drawn when ${f.username} accepts. `}
                              {isUntimed(duration)
                                ? 'No clock: the first to find every region wins (it ends after 60 min at most).'
                                : 'Whoever finds more regions in time wins.'}
                            </p>
                            <span className="friend-actions">
                              <button
                                type="button"
                                className="friend-btn primary"
                                disabled={disabled}
                                onClick={() => actions.challenge(f.username, duration, countryId === '' ? null : countryId)}
                              >
                                {actions.busy === 'challenge' ? 'Sending…' : 'Send challenge'}
                              </button>
                              <button type="button" className="friend-btn" onClick={() => setChallengeUserId(null)}>
                                Close
                              </button>
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {history.total > 0 && (
                <section className="friends-section">
                  <h3>Match history <span className="friends-count">{history.total}</span></h3>
                  {history.record && (
                    <p className="history-record" aria-label="Your record">
                      <b className="win">{history.record.wins}</b> won ·{' '}
                      <b className="loss">{history.record.losses}</b> lost ·{' '}
                      <b>{history.record.draws}</b> {history.record.draws === 1 ? 'draw' : 'draws'}
                    </p>
                  )}
                  <ul>
                    {history.items.map((h) => (
                      <li className="friend-row" key={h.id}>
                        <UserAvatar className="friend-avatar" userId={h.opponent.user_id} name={h.opponent.username} version={h.opponent.avatar_updated_at} />
                        <span className="friend-who">
                          <span className="friend-name">
                            <span className={`history-result ${h.result}`}>{RESULT_LABEL[h.result]}</span>
                            {' '}vs {h.opponent.username}
                          </span>
                          <span className="friend-meta">
                            <span className="history-score">{h.my_score}–{h.opponent.score}</span>
                            {' · '}{historyMeta(h)}
                          </span>
                        </span>
                        <span className="friend-actions">
                          <Link className="friend-btn" to={`/partida/${h.id}`}>View</Link>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {history.error && (
                    <p className="challenge-note">Couldn&apos;t load more matches. Check your connection.</p>
                  )}
                  {history.hasMore && (
                    <button type="button" className="friend-btn history-more" disabled={history.loadingMore} onClick={history.loadMore}>
                      {history.loadingMore ? 'Loading…' : 'Show more'}
                    </button>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
