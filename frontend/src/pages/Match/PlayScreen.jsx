import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { buildTexts } from '../../lib/countryText';
import UserAvatar from '../../components/UserAvatar';
import CountryGame from '../Country/CountryGame';
import '../Country/Country.css';
import Countdown from './Countdown';
import { useServerNow } from './useServerNow';
import { toMs } from './serverClock';
import { matchErrorText } from './matchText';
import { clearPending, markPending } from './pendingResult';
import './MatchPlay.css';

// The playable screen of a 1 vs 1 match: status 'playing' and also 'finished' (the result:
// the same map, now showing what each player found).
//
//   - Same map, input and name boxes as the single-player game (CountryGame), driven by
//     the same engine in "online" mode: every guess goes to the server, and only what
//     the server confirms is painted.
//   - Everything about time comes from the SERVER clock (started_at / ends_at), so both
//     players see the same 3-2-1 and the same time left.
//   - The rival's score comes from the match poll that MatchRoom already runs every
//     second; mine is updated instantly from the confirmed guesses.

// How long "Go!" stays on screen after the countdown reaches zero.
const GO_FLASH_MS = 900;
// The clock turns red in the last seconds.
const LOW_TIME_MS = 10000;

// `m:ss` left on the clock; rounds up so it never shows 0:00 while time remains.
function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function Side({ player, score, isMe, leading }) {
  return (
    <div className={'mpg-side' + (isMe ? ' me' : '') + (leading ? ' lead' : '')}>
      <UserAvatar className="mpg-avatar" userId={player.user_id} name={player.username} version={player.avatar_updated_at} />
      <div className="mpg-who">
        <span className="mpg-name">{isMe ? 'You' : player.username}</span>
        <span className="mpg-score" aria-label={`${isMe ? 'Your' : `${player.username}'s`} score`}>{score}</span>
      </div>
    </div>
  );
}

function MapLoading({ preload }) {
  const failed = preload.status === 'error';
  return (
    <section className="game">
      <div className="map-area">
        <div className={'loading-overlay' + (failed ? ' error' : '')}>
          {failed ? null : <div className="spinner" aria-hidden="true" />}
          <span>{failed ? "Couldn't load the map." : 'Loading the map…'}</span>
          {failed && <button type="button" className="btn-primary" onClick={preload.retry}>Try again</button>}
        </div>
      </div>
    </section>
  );
}

// What happened, in words, from my side of the match.
function summarize(match, mine, rival) {
  const draw = match.winner_id == null;
  const won = match.winner_id === mine.user_id;
  const title = draw ? 'Draw' : won ? 'You won' : `${rival.username} won`;
  let reason = '';
  if (match.end_reason === 'time') reason = 'Time is up.';
  else if (match.end_reason === 'completed') reason = won ? 'You found every region.' : `${rival.username} found every region.`;
  else if (match.end_reason === 'forfeit') reason = won ? `${rival.username} left the match.` : 'You left the match.';
  return { title, reason, won, draw };
}

// Who found what, from the two lists of region ids the server gives once it's over.
function breakdown(answers, total) {
  if (!answers || !answers.opponent) return null;
  const mine = new Set(answers.mine);
  const theirs = new Set(answers.opponent);
  const both = [...mine].filter((id) => theirs.has(id)).length;
  const onlyMine = mine.size - both;
  const onlyTheirs = theirs.size - both;
  return { onlyMine, onlyTheirs, both, nobody: Math.max(0, total - (onlyMine + onlyTheirs + both)) };
}

export default function PlayScreen({ match, clock, preload, reload }) {
  const now = useServerNow(clock);
  const [myLocal, setMyLocal] = useState(0); // my confirmed hits, painted instantly
  const [dismissed, setDismissed] = useState(false); // "View map" on the final card
  const [answers, setAnswers] = useState(null); // { mine, opponent } once the match is over
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(null);

  const isHost = match.my_role === 'host';
  const mine = isHost ? match.host : match.guest;
  const rival = isHost ? match.guest : match.host;

  const untilStart = toMs(match.started_at) - now; // > 0: still counting down
  const left = toMs(match.ends_at) - now;
  const over = match.status !== 'playing';
  const phase = over || left <= 0 ? 'ended' : untilStart > 0 ? 'waiting' : 'playing';

  const myScore = Math.max(myLocal, mine.score);
  const rivalScore = rival.score;

  // Latest `reload` without rebuilding the callbacks the engine holds on to.
  const reloadRef = useRef(reload);
  useEffect(() => { reloadRef.current = reload; });

  const matchId = match.id;
  const online = useMemo(
    () => ({
      guess: async (text) => {
        try {
          const res = await api.guessMatch(matchId, text);
          if (res.status !== 'playing') reloadRef.current(); // this guess ended the match
          return res;
        } catch (err) {
          if (err && err.status === 409) reloadRef.current(); // the match is not running anymore
          throw err;
        }
      },
      loadAnswers: async () => (await api.getMatchAnswers(matchId)).mine,
      onScore: setMyLocal,
      errorText: matchErrorText,
    }),
    [matchId]
  );

  // Remember the match while it runs; forget it once its result is on screen.
  useEffect(() => {
    if (match.status === 'playing') markPending(matchId);
    else clearPending(matchId);
  }, [match.status, matchId]);

  // Over: ask for both players' regions (the server only reveals the rival's now).
  useEffect(() => {
    if (!over) return undefined;
    let cancelled = false;
    let timer = null;
    const load = (attempt) => {
      api.getMatchAnswers(matchId)
        .then((res) => { if (!cancelled) setAnswers(res); })
        .catch(() => { if (!cancelled && attempt < 3) timer = setTimeout(() => load(attempt + 1), 1500 * (attempt + 1)); });
    };
    load(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [over, matchId]);

  // Leaving: during the 3-2-1 it just cancels; with the clock running the rival wins.
  async function leave() {
    setLeaving(true);
    setLeaveError(null);
    try {
      await api.cancelMatch(matchId);
    } catch (err) {
      setLeaveError(matchErrorText(err));
    } finally {
      setConfirmLeave(false);
      setLeaving(false);
      reloadRef.current(); // shows the outcome (cancelled / finished), or whatever the server says now
    }
  }

  const data = preload.status === 'ready' ? preload.data : null;
  const texts = useMemo(() => (data ? buildTexts(data.country, data.slug) : null), [data]);

  const showCover = !over && untilStart > -GO_FLASH_MS;
  const clockMs = phase === 'waiting' ? match.duration_seconds * 1000 : Math.max(0, left);
  const low = phase === 'playing' && left <= LOW_TIME_MS;
  const summary = over ? summarize(match, mine, rival) : null;
  const split = over ? breakdown(answers, match.country.total_regions) : null;
  const rivalIds = over && answers ? answers.opponent : null;
  const counting = untilStart > 0;

  // Bottom bar of the game screen. Memoised: this component re-renders ten times a second
  // (the clock) and the game below must not.
  const bottom = useMemo(() => {
    if (over) {
      return (
        <>
          <div className="left-actions">
            {dismissed && <button type="button" className="secondary" onClick={() => setDismissed(false)}>Show result</button>}
          </div>
          <div className="right-actions"><Link className="btn-ghost mpg-link" to="/">Back to menu</Link></div>
        </>
      );
    }
    if (confirmLeave) {
      return (
        <>
          <p className="mpg-confirm" role="alert">
            {counting ? 'Leave before it starts? No penalty.' : `Leave the match? ${rival.username} wins.`}
          </p>
          <div className="right-actions">
            <button type="button" className="secondary" disabled={leaving} onClick={() => setConfirmLeave(false)}>Stay</button>
            <button type="button" className="secondary danger" disabled={leaving} onClick={leave}>{leaving ? 'Leaving…' : 'Leave'}</button>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="left-actions">
          <button type="button" className="secondary" onClick={() => setConfirmLeave(true)}>Leave match</button>
        </div>
        {leaveError && <p className="mpg-confirm" role="alert">{leaveError}</p>}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `leave` only reads refs/stable setters
  }, [over, dismissed, confirmLeave, counting, leaving, leaveError, rival.username, matchId]);

  return (
    <div className="country-page mpg">
      <div className="page">
        <header className="mpg-bar">
          <Link to="/" className="btn-back" title="Back to the menu (the match keeps running)">
            <span className="arrow" aria-hidden="true">←</span>
            <span className="label">Menu</span>
          </Link>
          <Side player={mine} score={myScore} isMe leading={myScore > rivalScore} />
          <div className="mpg-mid">
            <span className={'mpg-clock' + (low ? ' low' : '')} aria-label="Time left">{formatClock(clockMs)}</span>
            <span className="mpg-country">{match.country.nombre}</span>
          </div>
          <Side player={rival} score={rivalScore} isMe={false} leading={rivalScore > myScore} />
        </header>

        {data && texts ? (
          <CountryGame
            key={data.slug}
            country={data.country}
            texts={texts}
            geoUrl={data.geoUrl}
            online={online}
            phase={phase}
            rivalIds={rivalIds}
            bottom={bottom}
          />
        ) : (
          <MapLoading preload={preload} />
        )}
      </div>

      {showCover && (
        <div className={'match-page mpg-cover' + (untilStart <= 0 ? ' go' : '')}>
          <Countdown remainingMs={untilStart} />
          <p className="mp-note mp-count-note">{untilStart > 0 ? `Get ready · ${match.country.nombre}` : ''}</p>
        </div>
      )}

      {over && !dismissed && (
        <div className="match-page mpg-cover end" role="dialog" aria-modal="true" aria-labelledby="mpg-end-title">
          <div className="mpg-end-card">
            <p className="mp-kicker">Final result</p>
            <h2 id="mpg-end-title">{summary.title}</h2>
            {summary.reason && <p className="mp-note">{summary.reason}</p>}
            <p className="mpg-final" aria-label="Final score">
              <span>{mine.score}</span>
              <span className="mpg-final-sep" aria-hidden="true">–</span>
              <span>{rival.score}</span>
            </p>
            <p className="mpg-final-names">You · {rival.username}</p>
            {split && (
              <ul className="mpg-split" aria-label="Who found what">
                <li><i className="sw mine" aria-hidden="true" />Only you<b>{split.onlyMine}</b></li>
                <li><i className="sw rival" aria-hidden="true" />Only {rival.username}<b>{split.onlyTheirs}</b></li>
                <li><i className="sw mine" aria-hidden="true" />Both (gold)<b>{split.both}</b></li>
                <li><i className="sw none" aria-hidden="true" />Nobody<b>{split.nobody}</b></li>
              </ul>
            )}
            <div className="mp-actions">
              <button type="button" className="mp-btn" onClick={() => setDismissed(true)}>View map</button>
              <Link className="mp-btn primary" to="/">Back to menu</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
