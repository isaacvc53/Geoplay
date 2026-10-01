import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { usePolled } from '../../lib/usePolled';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import { useMatchActions } from './useMatchActions';
import { TERMINAL_STATUSES, formatDuration } from './matchText';
import './Match.css';

// Match room (/partida/:id). Part 2 covers the waiting phase only:
//   invited  -> the host waits, the guest accepts or declines
//   ready    -> the random country is revealed (starting the match comes in part 3)
//   declined / cancelled / expired -> a closing message
// The room asks the server for the match every 1.5 s, so both players see changes
// (accepted, declined, cancelled...) almost instantly without any extra setup.

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

function MatchRoom({ id }) {
  const navigate = useNavigate();
  const poll = usePolled(() => api.getMatch(id), {
    interval: 1500,
    stopWhen: (m) => TERMINAL_STATUSES.has(m.status),
  });
  const goHome = () => navigate('/');
  const actions = useMatchActions({
    reload: poll.reload,
    onAccepted: () => {}, // stay here: the poll shows the revealed country
    onDeclined: goHome,
    onCancelled: goHome,
  });
  const disabled = Boolean(actions.busy);
  const m = poll.data;

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
          <p className="mp-note">
            You&apos;ll both play on the same map. Starting the match comes in the next update.
          </p>
          <div className="mp-actions">
            <button type="button" className="mp-btn primary" disabled title="Coming soon">
              Start match (soon)
            </button>
            <button type="button" className="mp-btn" disabled={disabled} onClick={() => actions.cancel(m.id)}>
              Leave match
            </button>
          </div>
        </div>
      );
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
      body = <Closed title="Match in progress" text="Playing the match isn't available yet." />;
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
