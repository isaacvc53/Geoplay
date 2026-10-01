import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { usePolled } from '../../lib/usePolled';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import { useMatchActions } from './useMatchActions';
import { useCountryPreload } from './useCountryPreload';
import { useServerNow } from './useServerNow';
import { createServerClock, toMs } from './serverClock';
import Countdown from './Countdown';
import { TERMINAL_STATUSES, formatDuration } from './matchText';
import './Match.css';

// Match room (/partida/:id). It covers everything before the first guess:
//   invited  -> the host waits, the guest accepts or declines
//   ready    -> the random country is revealed and its map is preloaded; either player
//               can press Start
//   playing  -> 3-2-1 countdown, the same for both players (server clock), then the
//               match clock runs (the playable map arrives in part 3C)
//   declined / cancelled / expired / finished -> a closing message
// The room asks the server for the match every second, so both players see changes
// (accepted, started, cancelled...) almost instantly without any extra setup.

// How long "Go!" stays on screen after the countdown reaches zero.
const GO_FLASH_MS = 900;

function Player({ player, isMe, role }) {
  return (
    <div className="mp-player">
      <UserAvatar className="mp-avatar" userId={player.user_id} name={player.username} version={player.avatar_updated_at} />
      <span className="mp-player-name">{player.username}</span>
      <span className="mp-player-tag">{isMe ? `You · ${role}` : role}</span>
    </div>
  );
}

// "Expires in 8 min" — refreshed every 30 s. Minutes only: the exact second would be
// wrong whenever the two clocks differ a little.
function ExpiryNote({ expiresAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (!expiresAt) return null;
  const minutes = Math.max(1, Math.ceil((Date.parse(expiresAt) - now) / 60000));
  return <p className="mp-note">Invitation expires in about {minutes} min.</p>;
}

function Closed({ title, text }) {
  return (
    <div className="mp-state">
      <h2>{title}</h2>
      <p className="mp-note">{text}</p>
      <Link className="mp-btn primary" to="/">Back to menu</Link>
    </div>
  );
}

// Progress of the map preload, so nobody starts a match without the map on their device.
function MapStatus({ preload }) {
  if (preload.status === 'error') {
    return (
      <div className="mp-load error" role="status">
        <span>Couldn&apos;t load the map.</span>
        <button type="button" className="mp-btn" onClick={preload.retry}>Try again</button>
      </div>
    );
  }
  if (preload.status === 'ready') {
    return <div className="mp-load ok" role="status">Map ready</div>;
  }
  return (
    <div className="mp-load" role="status">
      <span className="mp-spinner" aria-hidden="true" />
      Loading the map…
    </div>
  );
}

// `mm:ss` left on the clock; rounds up so it never shows 0:00 while time remains.
function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// status === 'playing'. Everything here is computed from the SERVER's clock: started_at
// is when the match clock begins (the 3-2-1 comes before it) and ends_at when it stops.
function Playing({ match, clock }) {
  const now = useServerNow(clock);
  const untilStart = toMs(match.started_at) - now;

  if (untilStart > -GO_FLASH_MS) {
    return (
      <div className="mp-state">
        <Countdown remainingMs={untilStart} />
        <p className="mp-note mp-count-note">{untilStart > 0 ? 'Get ready.' : ''}</p>
      </div>
    );
  }

  const left = toMs(match.ends_at) - now;
  return (
    <div className="mp-state">
      <div className="mp-country">
        <span className="mp-kicker">Playing on</span>
        <span className="mp-country-name">{match.country.nombre}</span>
        <span className="mp-country-meta">{match.country.total_regions} regions</span>
      </div>
      <p className="mp-clock" aria-label="Time left">{formatClock(left)}</p>
      <p className="mp-note">
        {left > 0
          ? 'The match is running. The playable map arrives in the next update.'
          : 'Time is up. Waiting for the result…'}
      </p>
    </div>
  );
}

function MatchRoom({ id }) {
  const navigate = useNavigate();
  const [clock] = useState(createServerClock);
  const poll = usePolled(
    async () => {
      const sentAt = Date.now();
      const match = await api.getMatch(id);
      clock.sample(match.server_time, sentAt, Date.now()); // keep the server clock fresh
      return match;
    },
    {
      // Short on purpose: when one player presses Start, the other one learns about it
      // within a second and still sees most of the 3-2-1.
      interval: 1000,
      stopWhen: (m) => TERMINAL_STATUSES.has(m.status),
    }
  );
  const m = poll.data;

  // The map starts downloading as soon as the country is drawn (status 'ready').
  const preloadSlug = m && m.country && (m.status === 'ready' || m.status === 'playing')
    ? m.country.slug
    : null;
  const preload = useCountryPreload(preloadSlug);

  const goHome = () => navigate('/');
  const actions = useMatchActions({
    reload: poll.reload,
    onAccepted: () => {}, // stay here: the poll shows the revealed country
    onDeclined: goHome,
    onCancelled: goHome,
  });
  const disabled = Boolean(actions.busy);

  let body;
  if (!poll.loaded) {
    body = <p className="mp-note">Loading match…</p>;
  } else if (!m) {
    const missing = poll.error && poll.error.status === 404;
    body = missing ? (
      <Closed title="Match not found" text="It doesn't exist, or it isn't yours." />
    ) : (
      <div className="mp-state">
        <h2>Couldn&apos;t load the match</h2>
        <p className="mp-note">Check your connection. We&apos;ll keep trying.</p>
        <button type="button" className="mp-btn" onClick={poll.reload}>Try now</button>
      </div>
    );
  } else {
    const isHost = m.my_role === 'host';
    const rival = isHost ? m.guest : m.host;
    const length = formatDuration(m.duration_seconds);

    if (m.status === 'invited' && isHost) {
      body = (
        <div className="mp-state">
          <h2>Waiting for {rival.username}…</h2>
          <p className="mp-note">
            Your {length} challenge was sent. A random country is drawn as soon as they accept.
          </p>
          <ExpiryNote expiresAt={m.invite_expires_at} />
          <button type="button" className="mp-btn" disabled={disabled} onClick={() => actions.cancel(m.id)}>
            Cancel challenge
          </button>
        </div>
      );
    } else if (m.status === 'invited') {
      body = (
        <div className="mp-state">
          <h2>{rival.username} challenged you</h2>
          <p className="mp-note">
            A {length} match on a random country: whoever finds more regions in time wins.
          </p>
          <ExpiryNote expiresAt={m.invite_expires_at} />
          <div className="mp-actions">
            <button type="button" className="mp-btn primary" disabled={disabled} onClick={() => actions.accept(m.id)}>
              {actions.busy === `accept:${m.id}` ? 'Accepting…' : 'Accept'}
            </button>
            <button type="button" className="mp-btn" disabled={disabled} onClick={() => actions.decline(m.id)}>
              Decline
            </button>
          </div>
        </div>
      );
    } else if (m.status === 'ready') {
      const canStart = preload.status === 'ready' && !disabled;
      body = (
        <div className="mp-state">
          <h2>Match ready</h2>
          {m.country && (
            <div className="mp-country">
              <span className="mp-kicker">Your country</span>
              <span className="mp-country-name">{m.country.nombre}</span>
              <span className="mp-country-meta">{m.country.total_regions} regions · {length}</span>
            </div>
          )}
          <MapStatus preload={preload} />
          <p className="mp-note">
            Either of you can start. You both get a 3-second countdown, then the clock runs.
          </p>
          <div className="mp-actions">
            <button
              type="button"
              className="mp-btn primary"
              disabled={!canStart}
              title={preload.status === 'ready' ? undefined : 'Waiting for the map to load'}
              onClick={() => actions.start(m.id)}
            >
              {actions.busy === `start:${m.id}` ? 'Starting…' : 'Start match'}
            </button>
            <button type="button" className="mp-btn" disabled={disabled} onClick={() => actions.cancel(m.id)}>
              Leave match
            </button>
          </div>
        </div>
      );
    } else if (m.status === 'playing') {
      body = <Playing match={m} clock={clock} />;
    } else if (m.status === 'finished') {
      // Bare-bones summary: the full result screen comes in part 3D.
      const mine = isHost ? m.host : m.guest;
      const title = m.winner_id == null ? 'Draw' : m.winner_id === mine.user_id ? 'You won' : `${rival.username} won`;
      body = <Closed title={title} text={`Final score: you ${mine.score} – ${rival.score} ${rival.username}.`} />;
    } else if (m.status === 'declined') {
      body = (
        <Closed
          title={isHost ? `${rival.username} declined` : 'Challenge declined'}
          text={isHost ? 'They are not up for a match right now.' : 'You declined this challenge.'}
        />
      );
    } else if (m.status === 'cancelled') {
      body = <Closed title="Match cancelled" text="One of you left before the match started." />;
    } else if (m.status === 'expired') {
      body = <Closed title="Challenge expired" text="Nobody started the match in time." />;
    } else {
      body = <Closed title="Match not available" text="This match can't be shown." />;
    }
  }

  return (
    <>
      {m && (
        <div className="mp-versus" aria-label="Players">
          <Player player={m.host} isMe={m.my_role === 'host'} role="host" />
          <span className="mp-vs" aria-hidden="true">vs</span>
          <Player player={m.guest} isMe={m.my_role === 'guest'} role="guest" />
        </div>
      )}
      {m && poll.error && <p className="mp-warn">Connection lost — retrying…</p>}
      {actions.error && <p className="mp-error" role="alert">{actions.error}</p>}
      {body}
    </>
  );
}

export default function MatchPage() {
  const { loggedIn } = useAuth();
  const { id } = useParams();

  useEffect(() => {
    document.title = 'Geotaria — Multiplayer';
    return () => { document.title = 'Geotaria'; };
  }, []);

  if (!loggedIn) return <Navigate to="/login" replace />;
  const valid = /^\d+$/.test(id || '');

  return (
    <div className="match-page">
      <div className="mp-card">
        <div className="mp-brand">
          <Link className="mp-brand-id" to="/">
            <div className="mark">G</div>
            <span className="word">Geo<i>taria</i></span>
          </Link>
          <span className="mp-brand-tag">1 vs 1</span>
        </div>
        {valid
          ? <MatchRoom key={id} id={id} />
          : <Closed title="Match not found" text="That link isn't valid." />}
      </div>
    </div>
  );
}
