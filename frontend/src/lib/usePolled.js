import { useCallback, useEffect, useRef, useState } from 'react';

// Calls `fetcher` every `interval` ms and exposes the latest answer.
//  - Pauses while the tab is hidden and refreshes as soon as it is visible again.
//  - Never runs two requests at once; a reload() during one request queues a single re-run.
//  - On failure it backs off (interval x2, x4... up to 15 s) and keeps the last good data.
//  - A 401/403/404 stops the polling (retrying can't fix it); reload() restarts it.
//  - `stopWhen(data)` -> true stops the polling too (e.g. a finished match).
// Returns { data, error, loaded, reload }.

const MAX_DELAY = 15000;
const INITIAL = { data: null, error: null, loaded: false };

export function usePolled(fetcher, { enabled = true, interval = 2500, stopWhen } = {}) {
  const [state, setState] = useState(INITIAL);
  const fetcherRef = useRef(fetcher);
  const stopRef = useRef(stopWhen);
  const reloadRef = useRef(() => {});

  // Always call the latest fetcher / stopWhen without restarting the loop.
  useEffect(() => {
    fetcherRef.current = fetcher;
    stopRef.current = stopWhen;
  });

  useEffect(() => {
    if (!enabled) {
      reloadRef.current = () => {};
      return undefined;
    }

    let cancelled = false;
    let stopped = false;
    let running = false;
    let again = false;
    let failures = 0;
    let timer = null;

    function schedule() {
      if (cancelled || stopped) return;
      clearTimeout(timer);
      timer = setTimeout(tick, Math.min(interval * 2 ** failures, MAX_DELAY));
    }

    async function tick() {
      if (cancelled || stopped) return;
      if (running) { again = true; return; }
      if (document.visibilityState === 'hidden') { schedule(); return; }

      running = true;
      try {
        const data = await fetcherRef.current();
        if (cancelled) return;
        failures = 0;
        setState({ data, error: null, loaded: true });
        if (stopRef.current && stopRef.current(data)) stopped = true;
      } catch (err) {
        if (cancelled) return;
        failures += 1;
        setState((s) => ({ ...s, error: err, loaded: true }));
        const status = err && err.status;
        if (status === 401 || status === 403 || status === 404) stopped = true;
      } finally {
        running = false;
      }

      if (cancelled) return;
      if (again) {
        again = false;
        tick();
      } else {
        schedule();
      }
    }

    reloadRef.current = () => {
      if (cancelled) return;
      stopped = false;
      failures = 0;
      clearTimeout(timer);
      tick();
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible' || stopped) return;
      clearTimeout(timer);
      tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      // Forget the last answer (e.g. after logging out) so the next user never
      // sees the previous one's data while the first request is in flight.
      setState(INITIAL);
    };
  }, [enabled, interval]);

  const reload = useCallback(() => reloadRef.current(), []);

  // Disabled -> always empty, derived while rendering.
  return { ...(enabled ? state : INITIAL), reload };
}
