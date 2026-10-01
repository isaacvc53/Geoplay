import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { clearPending, getPending } from '../Match/pendingResult';

// A match that ended while the player was away from its screen (closed the tab, went back
// to the menu, lost the connection): the room remembers its id in this browser, and the
// menu offers its result until it has been seen or dismissed.
//
// Only looks while there is no open match (`busy` false); checks once per change, not on a
// timer. -> { result: match | null, dismiss }
const FRESH_MS = 6 * 60 * 60 * 1000; // older results are not worth a reminder

export function useLastResult(loggedIn, busy) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loggedIn || busy) return undefined;
    const id = getPending();
    if (!id) return undefined;

    let cancelled = false;
    api.getMatch(id)
      .then((m) => {
        if (cancelled) return;
        const done = m.status === 'finished';
        const stale = done && m.finished_at && Date.now() - Date.parse(m.finished_at) > FRESH_MS;
        if (done && !stale) {
          setResult(m);
        } else if (m.status !== 'playing') {
          clearPending(id); // cancelled / expired / too old: nothing to show
        }
      })
      .catch((err) => {
        // 404/403: not mine (another account) or gone. Network errors: try again next time.
        if (err && (err.status === 404 || err.status === 403)) clearPending(id);
      });
    return () => { cancelled = true; };
  }, [loggedIn, busy]);

  const dismiss = useCallback(() => {
    if (result) clearPending(result.id);
    setResult(null);
  }, [result]);

  return { result: loggedIn && !busy ? result : null, dismiss };
}
