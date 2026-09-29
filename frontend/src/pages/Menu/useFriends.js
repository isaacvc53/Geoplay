import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

// Loads { friends, incoming, outgoing } once when the user is signed in, and
// exposes reload() to refresh it (opening the drawer, after an action...).
export function useFriends(loggedIn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0); // ignore answers that arrive out of order

  const reload = useCallback(async () => {
    if (!api.isLoggedIn()) return;
    const id = ++latest.current;
    setLoading(true);
    try {
      const overview = await api.getFriends();
      if (id === latest.current) {
        setData(overview);
        setError(false);
      }
    } catch {
      if (id === latest.current) setError(true);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      reload();
    } else {
      latest.current += 1;
      setData(null);
      setError(false);
      setLoading(false);
    }
  }, [loggedIn, reload]);

  // Requests can arrive while the tab is in the background: refresh when the
  // user comes back, so the badge and the lists don't go stale.
  useEffect(() => {
    if (!loggedIn) return undefined;
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loggedIn, reload]);

  return { data, error, loading, reload };
}
