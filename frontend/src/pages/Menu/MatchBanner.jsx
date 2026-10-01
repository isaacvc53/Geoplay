import { Link } from 'react-router-dom';
import { useMatchActions } from '../Match/useMatchActions';
import { formatDuration, opponentOf } from '../Match/matchText';
import './Matches.css';

// Strip under the top bar: tells you about a challenge you received, or about the
// match you have open, without having to open the friends drawer.
export default function MatchBanner({ matches, onOpenFriends }) {
  const { current, invitations, reload } = matches;
  const actions = useMatchActions({ reload });
  const disabled = Boolean(actions.busy);

  if (!current && invitations.length === 0) return null;

  let content;
  if (current) {
    const rival = opponentOf(current).username;
    const waiting = current.status === 'invited';
    content = (
      <>
        <p className="match-banner-text">
          {waiting
            ? <>Waiting for <strong>{rival}</strong> to accept your challenge.</>
            : current.status === 'ready'
              ? <>Your match against <strong>{rival}</strong> is ready.</>
              : <>Match against <strong>{rival}</strong> in progress.</>}
        </p>
        <span className="friend-actions">
          <Link className="friend-btn primary" to={`/partida/${current.id}`}>Open</Link>
          {(waiting || current.status === 'ready') && (
            <button
              type="button"
              className="friend-btn"
              disabled={disabled}
              onClick={() => actions.cancel(current.id)}
            >
              {waiting ? 'Cancel' : 'Leave'}
            </button>
          )}
        </span>
      </>
    );
  } else {
    const first = invitations[0];
    const extra = invitations.length - 1;
    content = (
      <>
        <p className="match-banner-text">
          <strong>{first.host.username}</strong> challenged you to a {formatDuration(first.duration_seconds)} match.
          {extra > 0 && (
            <>
              {' '}
              <button type="button" className="match-banner-link" onClick={onOpenFriends}>
                +{extra} more
              </button>
            </>
          )}
        </p>
        <span className="friend-actions">
          <button
            type="button"
            className="friend-btn primary"
            disabled={disabled}
            onClick={() => actions.accept(first.id)}
          >
            Accept
          </button>
          <button
            type="button"
            className="friend-btn"
            disabled={disabled}
            onClick={() => actions.decline(first.id)}
          >
            Decline
          </button>
        </span>
      </>
    );
  }

  return (
    <div className="match-banner" role="status" aria-live="polite">
      <span className="match-banner-tag">1 vs 1</span>
      {content}
      {actions.error && <p className="match-banner-error">{actions.error}</p>}
    </div>
  );
}
