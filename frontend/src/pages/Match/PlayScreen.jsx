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
import './MatchPlay.css';

// The playable screen of a 1 vs 1 match (status 'playing', and 'finished' right after).
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

export default function PlayScreen({ match, clock, preload, reload }) {
  const now = useServerNow(clock);
  const [myLocal, setMyLocal] = useState(0); // my confirmed hits, painted instantly
  const [dismissed, setDismissed] = useState(false); // "View map" on the final card

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

  const data = preload.status === 'ready' ? preload.data : null;
  const texts = useMemo(() => (data ? buildTexts(data.country, data.slug) : null), [data]);

  const showCover = !over && untilStart > -GO_FLASH_MS;
  const clockMs = phase === 'waiting' ? match.duration_seconds * 1000 : Math.max(0, left);
  const low = phase === 'playing' && left <= LOW_TIME_MS;
  const summary = over ? summarize(match, mine, rival) : null;

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
