import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatRelative } from '../Profile/profileLogic';
import './Friends.css';

// The backend answers with a stable `code`; the texts live here.
const ERROR_MESSAGES = {
  user_not_found: 'No user found with that username.',
  cannot_add_self: "You can't add yourself.",
  already_friends: "You're already friends.",
  request_already_sent: 'You already sent a request to this user.',
  too_many_pending: 'You have too many pending requests. Wait for some to be answered.',
  request_not_found: 'That request no longer exists.',
  friend_not_found: 'That friend is no longer in your list.',
  cannot_accept_own: "You can't accept your own request.",
  try_again: 'Something went wrong. Please try again.',
};

function errorText(err) {
  if (err && err.code && ERROR_MESSAGES[err.code]) return ERROR_MESSAGES[err.code];
  if (err && err.status === 429) return 'Too many attempts. Try again in a moment.';
  if (err && err.status === 422) return 'Enter a valid username.';
  if (!err || err.status == null) return "Couldn't reach the server. Check your connection.";
  return 'Something went wrong. Please try again.';
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// "78% accuracy · last played 2d ago" (or a hint when they haven't played yet).
function activityText(f) {
  if (!f.last_played_at) return "Hasn't played yet";
  const parts = [];
  if (f.accuracy != null) parts.push(`${f.accuracy}% accuracy`);
  parts.push(`last played ${formatRelative(f.last_played_at).toLowerCase()}`);
  return parts.join(' · ');
}

function Avatar({ name }) {
  return <span className="friend-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>;
}

export default function FriendsPanel({ loggedIn, friends }) {
  const { data, error, loading, reload } = friends;
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(null); // key of the action in flight, or null
  const [message, setMessage] = useState(null); // { kind: 'ok' | 'error', text }
  const [confirmId, setConfirmId] = useState(null); // friendship waiting for "Confirm"

  // Feedback messages fade after a few seconds so they don't linger forever.
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!loggedIn) {
    return (
      <div className="friends-panel">
        <div className="drawer-empty">
          <p className="drawer-empty-title">Sign in to add friends</p>
          <p className="drawer-empty-desc">
            Add friends by username and keep an eye on how many maps they&apos;ve played.
          </p>
          <Link to="/login" className="signin account-cta">Sign in</Link>
        </div>
      </div>
    );
  }

  // Runs an API action, refreshes the lists and shows the result.
  // Returns true when it worked.
  async function run(key, action, okText) {
    if (busy) return false;
    setBusy(key);
    setMessage(null);
    setConfirmId(null);
    try {
      const result = await action();
      await reload();
      if (okText) setMessage({ kind: 'ok', text: typeof okText === 'function' ? okText(result) : okText });
      return true;
    } catch (err) {
      setMessage({ kind: 'error', text: errorText(err) });
      if (err && err.status === 404) reload(); // the list was out of date
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    const ok = await run(
      'add',
      () => api.sendFriendRequest(name),
      (r) => (r.status === 'accepted'
        ? `You and ${r.username} are now friends!`
        : `Request sent to ${r.username}.`)
    );
    if (ok) setUsername('');
  }

  const friendList = data ? data.friends : [];
  const incoming = data ? data.incoming : [];
  const outgoing = data ? data.outgoing : [];
  const isEmpty = data && !friendList.length && !incoming.length && !outgoing.length;
  const disabled = Boolean(busy);

  return (
    <div className="friends-panel">
      <form className="drawer-search" onSubmit={handleAdd}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Add a friend by username"
          aria-label="Friend's username"
          maxLength={50}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button type="submit" disabled={busy === 'add' || !username.trim()}>
          {busy === 'add' ? '…' : 'Add'}
        </button>
      </form>

      <div className="friends-msg-slot" aria-live="polite">
        {message && <p className={`friends-msg ${message.kind}`}>{message.text}</p>}
      </div>

      {!data && loading && <p className="friends-note">Loading…</p>}

      {!data && !loading && error && (
        <div className="friends-note">
          <p>Couldn&apos;t load your friends.</p>
          <button type="button" className="friend-btn" onClick={reload}>Try again</button>
        </div>
      )}

      {incoming.length > 0 && (
        <section className="friends-section">
          <h3>Requests <span className="friends-count">{incoming.length}</span></h3>
          <ul>
            {incoming.map((r) => (
              <li className="friend-row" key={r.friendship_id}>
                <Avatar name={r.username} />
                <span className="friend-who">
                  <span className="friend-name">{r.username}</span>
                  <span className="friend-meta">wants to be your friend</span>
                </span>
                <span className="friend-actions">
                  <button
                    type="button"
                    className="friend-btn primary"
                    disabled={disabled}
                    onClick={() => run(
                      `accept:${r.friendship_id}`,
                      () => api.acceptFriendRequest(r.friendship_id),
                      `You and ${r.username} are now friends!`
                    )}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="friend-btn"
                    disabled={disabled}
                    onClick={() => run(
                      `decline:${r.friendship_id}`,
                      () => api.removeFriendRequest(r.friendship_id)
                    )}
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="friends-section">
          <h3>Sent</h3>
          <ul>
            {outgoing.map((r) => (
              <li className="friend-row" key={r.friendship_id}>
                <Avatar name={r.username} />
                <span className="friend-who">
                  <span className="friend-name">{r.username}</span>
                  <span className="friend-meta">waiting for a reply</span>
                </span>
                <span className="friend-actions">
                  <button
                    type="button"
                    className="friend-btn"
                    disabled={disabled}
                    onClick={() => run(
                      `cancel:${r.friendship_id}`,
                      () => api.removeFriendRequest(r.friendship_id),
                      `Request to ${r.username} cancelled.`
                    )}
                  >
                    Cancel
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {friendList.length > 0 && (
        <section className="friends-section">
          <h3>Friends <span className="friends-count">{friendList.length}</span></h3>
          <ul>
            {friendList.map((f) => (
              <li className="friend-row has-footer" key={f.friendship_id}>
                <Avatar name={f.username} />
                <span className="friend-who">
                  <span className="friend-name">{f.username}</span>
                  <span className="friend-meta">
                    {plural(f.games_played, 'game', 'games')} · {plural(f.countries_played, 'country', 'countries')}
                  </span>
                  <span className="friend-meta dim">{activityText(f)}</span>
                </span>
                <span className="friend-actions spread">
                  <Link
                    className="friend-btn primary"
                    to={`/comparar?con=${encodeURIComponent(f.username)}`}
                  >
                    Compare
                  </Link>
                  {confirmId === f.friendship_id ? (
                    <span className="friend-actions">
                      <button
                        type="button"
                        className="friend-btn danger"
                        disabled={disabled}
                        onClick={() => run(
                          `remove:${f.friendship_id}`,
                          () => api.removeFriend(f.friendship_id),
                          `${f.username} was removed from your friends.`
                        )}
                      >
                        Confirm
                      </button>
                      <button type="button" className="friend-btn" onClick={() => setConfirmId(null)}>
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="friend-btn"
                      disabled={disabled}
                      onClick={() => setConfirmId(f.friendship_id)}
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isEmpty && (
        <div className="drawer-empty">
          <p className="drawer-empty-title">No friends yet</p>
          <p className="drawer-empty-desc">
            Type a username above to send a friend request. It shows up here once they accept.
          </p>
        </div>
      )}
    </div>
  );
}
