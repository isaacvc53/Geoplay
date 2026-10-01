import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

// My finished 1 vs 1 matches (newest first) and my record. Not polled: the menu reloads it
// every time the friends drawer opens, and `loadMore` appends the next page.
// -> { items, total, record, loaded, error, loadingMore, hasMore, reload, loadMore }
const PAGE = 10;
const EMPTY = { items: [], total: 0, record: null };

export function useMatchHistory(loggedIn) {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const busyRef = useRef(false); // one request at a time
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  });

  // Logging out clears everything, so the next account never sees the previous one's list.
  useEffect(() => {
    if (!loggedIn) {
      setData(EMPTY);
      setLoaded(false);
      setError(false);
    }
  }, [loggedIn]);

  // First page (also the refresh): replaces the list.
  const reload = useCallback(async () => {
    if (!loggedIn || busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await api.getMatchHistory(PAGE, 0);
      setData(res);
      setError(false);
    } catch {
      setError(true);
    } finally {
      busyRef.current = false;
      setLoaded(true);
    }
  }, [loggedIn]);

  // Next page: appended (skipping any match already shown, in case the list shifted).
  const loadMore = useCallback(async () => {
    if (!loggedIn || busyRef.current) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.getMatchHistory(PAGE, dataRef.current.items.length);
      setData((cur) => {
        const seen = new Set(cur.items.map((i) => i.id));
        return { ...res, items: [...cur.items, ...res.items.filter((i) => !seen.has(i.id))] };
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, [loggedIn]);

  return {
    items: data.items,
    total: data.total,
    record: data.record,
    loaded,
    error,
    loadingMore,
    hasMore: data.items.length < data.total,
    reload,
    loadMore,
  };
}
