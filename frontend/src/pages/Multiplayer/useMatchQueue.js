import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { usePolled } from '../../lib/usePolled';
import { loadWorldMap } from '../../lib/worldMapData';
import { matchErrorText } from '../Match/matchText';

// Quick match: look for a random opponent in the general queue.
//
//   idle       -> not searching
//   searching  -> in the queue; the server is asked every 2 s (that is also the heartbeat
//                 that keeps me in it). When it answers with a match, go to its room.
//   lapsed     -> derived: the server says I'm no longer in the queue (e.g. the tab was in the
//                 background for a while and the heartbeat stopped)
//
// Leaving the page leaves the queue (best effort; the server also drops whoever stops asking).
//
// Returns { state, waited, busy, error, find, cancel, playSolo }, where `waited` is the
// seconds spent searching (counted by the server, so a reload doesn't reset it).

const POLL_MS = 2000;
const SOLO_PATH = '/mapas'; // where "play solo" goes

export function useMatchQueue(enabled) {
  const navigate = useNavigate();
  const [wanted, setWanted] = useState('idle'); // what I asked for: 'idle' | 'searching'
  const [sample, setSample] = useState(null); // { waited, at }: last waiting time the server told me
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);
  const wantedRef = useRef('idle');
  useEffect(() => { wantedRef.current = wanted; });

  const searching = wanted === 'searching';

  const goToMatch = useCallback(
    // `auto`: the room starts the match by itself a few seconds after the map is ready.
    (m) => navigate(`/partida/${m.id}`, { state: { auto: true } }),
    [navigate]
  );

  const poll = usePolled(
    async () => {
      const d = await api.getQueueStatus();
      setSample({ waited: d.waited_seconds, at: Date.now() });
      return d;
    },
    { enabled: enabled && searching, interval: POLL_MS }
  );

  // A reload while searching: pick the search up again instead of forgetting it.
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    api.getQueueStatus()
      .then((d) => {
        if (cancelled || !d.searching) return;
        setSample({ waited: d.waited_seconds, at: Date.now() });
        setWanted('searching');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled]);

  // A pair was formed: off to the room.
  const matched = searching && poll.data ? poll.data.match : null;
  useEffect(() => {
    if (matched) goToMatch(matched);
  }, [matched, goToMatch]);

  // While searching, download the world map for the draw animation, so it is already in the
  // browser when the pair is formed (best effort: the room asks for it again if this fails).
  useEffect(() => {
    if (searching) loadWorldMap().catch(() => {});
  }, [searching]);

  // Smooth seconds counter between two answers of the server.
  useEffect(() => {
    if (!searching) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [searching]);

  // Leaving the page = leaving the queue.
  useEffect(() => () => {
    if (wantedRef.current === 'searching') api.leaveQueue().catch(() => {});
  }, []);

  const lapsed = searching && Boolean(poll.data) && !poll.data.searching && !poll.data.match;
  const state = !searching ? 'idle' : lapsed ? 'lapsed' : 'searching';
  const waited = sample ? sample.waited + Math.max(0, Math.floor((now - sample.at) / 1000)) : 0;

  const find = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await api.joinQueue();
      setSample({ waited: res.waited_seconds, at: Date.now() });
      if (res.match) goToMatch(res.match);
      else {
        setWanted('searching');
        poll.reload(); // refresh now, so a stale "search ended" notice doesn't linger
      }
    } catch (err) {
      setError(matchErrorText(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [goToMatch, poll]);

  // Stops the search. Returns true when I really left the queue (false: I was paired just
  // before and went to that match instead).
  const leave = useCallback(async () => {
    setWanted('idle');
    try {
      const res = await api.leaveQueue();
      if (res.match) {
        goToMatch(res.match);
        return false;
      }
    } catch {
      // can't tell: the server drops me by itself in a few seconds
    }
    return true;
  }, [goToMatch]);

  const cancel = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await leave();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [leave]);

  const playSolo = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (await leave()) navigate(SOLO_PATH);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [leave, navigate]);

  return { state, waited, busy, error, find, cancel, playSolo };
}
