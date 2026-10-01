import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { matchErrorText } from './matchText';

// Challenge / accept / decline / cancel / start with one shared "busy" + error state, so the
// menu banner, the friends drawer and the match room behave the same way.
//
// Options (all optional):
//   reload       refresh the caller's data after every action
//   onCreated    (match) after a challenge was sent   — default: go to the match room
//   onAccepted   (match) after accepting              — default: go to the match room
//   onDeclined / onCancelled / onStarted              — default: nothing (just reload)
export function useMatchActions({ reload, onCreated, onAccepted, onDeclined, onCancelled, onStarted } = {}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null); // key of the action in flight, or null
  const [error, setError] = useState(null);
  const busyRef = useRef(null); // blocks a second click before React re-renders

  // Error messages fade after a few seconds so they don't linger forever.
  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const goToRoom = useCallback((m) => navigate(`/partida/${m.id}`), [navigate]);

  const run = useCallback(
    async (key, action, after) => {
      if (busyRef.current) return false;
      busyRef.current = key;
      setBusy(key);
      setError(null);
      try {
        const result = await action();
        if (after) after(result);
        if (reload) await reload();
        return true;
      } catch (err) {
        setError(matchErrorText(err));
        // 404 / 409: what we were showing is out of date.
        if (reload && err && (err.status === 404 || err.status === 409)) reload();
        return false;
      } finally {
        busyRef.current = null;
        setBusy(null);
      }
    },
    [reload]
  );

  return {
    busy,
    error,
    challenge: (username, duration) =>
      run('challenge', () => api.createMatch(username, duration), onCreated ?? goToRoom),
    accept: (id) => run(`accept:${id}`, () => api.acceptMatch(id), onAccepted ?? goToRoom),
    decline: (id) => run(`decline:${id}`, () => api.declineMatch(id), onDeclined),
    cancel: (id) => run(`cancel:${id}`, () => api.cancelMatch(id), onCancelled),
    start: (id) => run(`start:${id}`, () => api.startMatch(id), onStarted),
  };
}
