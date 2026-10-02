import { memo, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { loadWorldMap } from '../../lib/worldMapData';
import { QUEUE_DURATIONS, formatDuration } from './matchText';

// Reveal of the randomly drawn country, on the world map. The server has already decided
// the country: this is only the show. A few dozen countries light up at once, then they go
// out one by one, slower and slower, until only the real one is left, which glows (with a
// ring when it is too small to spot, like Malta). In a quick match the length of the match
// is drawn at the same time: the time chip shuffles and stops on the real one.
//
// Phases: loading (map being fetched) -> spin (countries going out) -> landed (winner lit)
//         -> settled (name and details shown).
// With `animate` false, or if the user prefers reduced motion, it starts as `settled`.

const VIEWBOX = '30 5 1620 745'; // the world without Antarctica
const LIT_COUNT = 26; // countries lit at the start (the real one included)
const SPIN_MS = 4200; // from "all lit" to "only one left"
const HOLD_MS = 700; // winner highlighted before the details appear
const RING_MAX = 90; // map units: bigger countries don't need a ring
const STORAGE_PREFIX = 'geotaria:country-revealed:';

// The roulette plays once per match and browser tab: a reload (or opening an old match)
// shows the country straight away.
export function wasRevealed(matchId) {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + matchId) === '1';
  } catch {
    return false;
  }
}

export function markRevealed(matchId) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + matchId, '1');
  } catch {
    // no storage available: it will simply play again next time
  }
}

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Gaps (ms) between one country going out and the next: short at first, longer and longer,
// adding up to `total`. This is what makes it feel like a wheel slowing down.
function gaps(count, total) {
  const weights = Array.from({ length: count }, (_, i) => 1 + 5 * (i / Math.max(1, count - 1)) ** 2);
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (total * w) / sum);
}

// Bounding box of a path made only of M / L / Z with absolute x,y pairs (what world-map.json has).
function boxOf(d) {
  const n = d.match(/-?\d*\.?\d+/g) || [];
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    const x = Number(n[i]); const y = Number(n[i + 1]);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, size: Math.max(x1 - x0, y1 - y0) };
}

// One country. Memoised: when a country goes out only its own <path> is touched.
const Land = memo(function Land({ d, tone }) {
  return <path d={d} className={`mp-land${tone ? ` ${tone}` : ''}`} />;
});

// name: the drawn country · slug: its map slug · regions: how many regions it has ·
// durationSeconds: match length · drawTime: the length is drawn too (quick match) ·
// onDone: called when the reveal ends.
export default function CountryRoulette({ name, slug, regions, durationSeconds, drawTime, animate, onDone }) {
  const [animated] = useState(() => Boolean(animate) && !prefersReducedMotion());
  const [countries, setCountries] = useState(null); // null: not loaded yet (or it failed)
  const [lit, setLit] = useState(() => new Set());
  const [phase, setPhase] = useState(animated ? 'loading' : 'settled');
  const [shownTime, setShownTime] = useState(
    () => (animated && drawTime ? QUEUE_DURATIONS[0] : durationSeconds)
  );
  const [ring, setRing] = useState(null); // { cx, cy, r } around a small winner
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));
    const done = () => { if (onDoneRef.current) onDoneRef.current(); };

    // Shows the winner alone (no show): also the fallback when something fails.
    const showWinner = (list) => {
      setLit(new Set([slug]));
      const winner = list && list.find((c) => c.slug === slug);
      if (winner) {
        const box = boxOf(winner.main || winner.d);
        setRing(box.size < RING_MAX ? { cx: box.cx, cy: box.cy, r: Math.max(46, box.size / 2 + 28) } : null);
      }
    };

    if (!animated) {
      done(); // nothing to wait for
      loadWorldMap()
        .then((list) => { if (!cancelled) { setCountries(list); showWinner(list); } })
        .catch(() => {}); // no map: the name is shown anyway
      return () => { cancelled = true; };
    }

    // Only the countries that can really be drawn are lit (if the list can't be had, any).
    Promise.all([loadWorldMap(), api.getMatchCountries().catch(() => null)])
      .then(([list, playable]) => {
        if (cancelled) return;
        const playableSlugs = playable ? new Set(playable.map((c) => c.slug)) : null;
        const pool = list.map((c) => c.slug).filter((s) => s !== slug && (!playableSlugs || playableSlugs.has(s)));
        const others = shuffled(pool).slice(0, LIT_COUNT - 1);

        setCountries(list);
        setLit(new Set([slug, ...others]));
        setPhase('spin');

        // Out they go, one every step; the winner is never among them.
        const remaining = new Set([slug, ...others]);
        let at = 0;
        let lastTime = null;
        gaps(others.length, SPIN_MS).forEach((gap, i) => {
          at += gap;
          later(() => {
            remaining.delete(others[i]);
            setLit(new Set(remaining));
            if (drawTime) {
              const options = QUEUE_DURATIONS.filter((s) => s !== lastTime);
              lastTime = options[Math.floor(Math.random() * options.length)];
              setShownTime(lastTime);
            }
          }, at);
        });

        // Timer-based end (not transitionend), so a hidden tab can never leave it hanging.
        later(() => {
          showWinner(list);
          setShownTime(durationSeconds);
          setPhase('landed');
          done();
          later(() => setPhase('settled'), HOLD_MS);
        }, SPIN_MS + 150);
      })
      .catch(() => {
        // Couldn't get the map: skip the show, the country is still announced by name.
        if (cancelled) return;
        setPhase('settled');
        done();
      });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [animated, slug, drawTime, durationSeconds]);

  const done = phase === 'landed' || phase === 'settled';
  const winner = countries && done ? countries.find((c) => c.slug === slug) : null;
  const kicker = done ? 'Your country' : phase === 'loading' ? 'Loading the world…' : 'Drawing a random country…';

  return (
    <div className={`mp-country mp-roulette ${phase}${animated && drawTime ? ' drawtime' : ''}`}>
      <span className="mp-kicker">{kicker}</span>

      {(countries || animated) && (
        <svg className="mp-worldmap" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
          {countries && countries.map((c) => (
            <Land key={c.slug} d={c.d} tone={lit.has(c.slug) && !done ? 'lit' : ''} />
          ))}
          {/* the winner again, on top, so its neighbours' borders don't cover it */}
          {winner && <path d={winner.d} className="mp-land win" />}
          {winner && ring && (
            <>
              <circle className="mp-ring-still" cx={ring.cx} cy={ring.cy} r={ring.r * 0.62} />
              <circle className="mp-ring" cx={ring.cx} cy={ring.cy} r={ring.r} />
            </>
          )}
        </svg>
      )}

      <span className="mp-sr" role="status">{done ? `Your country: ${name}` : ''}</span>
      <span className="mp-country-name">{done ? name : '\u00A0'}</span>
      <span className="mp-country-meta">
        {regions != null && `${regions} regions`}
        {regions != null && durationSeconds != null && ' · '}
        {durationSeconds != null && (
          <span className={`mp-time${drawTime && !done ? ' drawing' : ''}`}>{formatDuration(shownTime)}</span>
        )}
      </span>
    </div>
  );
}
