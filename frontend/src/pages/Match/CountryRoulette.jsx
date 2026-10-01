import { useEffect, useRef, useState } from 'react';
import { COUNTRY_NAMES } from '../../lib/countryNames';

// Slot-machine reveal of the randomly drawn country. The server has already decided the
// country: this is only the show. Names scroll through a three-row window, slow down and
// stop on the real one, which is then framed and the window closes around it.
//
// Phases: idle (first frame) -> spin (reel moving) -> landed (winner lit, neighbours fade)
//         -> settled (window shrinks to a single row).
// With `animate` false, or if the user prefers reduced motion, it starts as `settled`.

const SPIN_ITEMS = 30; // names that scroll past before the real one
const SPIN_MS = 4200; // keep in sync with --spin-ms in Match.css
const HOLD_MS = 700; // winner highlighted before the window closes
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

// [...SPIN_ITEMS random names, the real one, one more name below it]
function buildReel(name) {
  const fillers = shuffled(COUNTRY_NAMES.filter((n) => n !== name));
  const before = fillers.slice(0, SPIN_ITEMS);
  return { items: [...before, name, fillers[SPIN_ITEMS] || ''], winIndex: before.length };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// name: the drawn country · meta: small line under it · onDone: called when the reel stops.
export default function CountryRoulette({ name, meta, animate, onDone }) {
  const [animated] = useState(() => Boolean(animate) && !prefersReducedMotion());
  const [reel] = useState(() => (animated ? buildReel(name) : { items: [name], winIndex: 0 }));
  const [phase, setPhase] = useState(animated ? 'idle' : 'settled');
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!animated) {
      if (onDoneRef.current) onDoneRef.current();
      return undefined;
    }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPhase('spin'));
    });
    const timers = [];
    // Timer-based end (not transitionend), so a hidden tab can never leave it hanging.
    timers.push(setTimeout(() => {
      setPhase('landed');
      if (onDoneRef.current) onDoneRef.current();
      timers.push(setTimeout(() => setPhase('settled'), HOLD_MS));
    }, SPIN_MS + 150));
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [animated]);

  // How many rows the strip is shifted up. `spin`/`landed` centre the winner in the
  // three-row window; `settled` puts it first, in the one-row window.
  const offset = phase === 'idle' ? 0 : phase === 'settled' ? reel.winIndex : reel.winIndex - 1;
  const done = phase === 'landed' || phase === 'settled';

  return (
    <div className={`mp-country mp-roulette ${phase}`}>
      <span className="mp-kicker">{done ? 'Your country' : 'Drawing a random country…'}</span>
      <div className="mp-reel" aria-hidden="true">
        <div className="mp-reel-strip" style={{ '--off': offset }}>
          {reel.items.map((item, i) => (
            <div key={`${i}-${item}`} className={`mp-reel-item${i === reel.winIndex ? ' win' : ''}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="mp-reel-sel" />
      </div>
      <span className="mp-sr" role="status">{done ? `Your country: ${name}` : ''}</span>
      <span className="mp-country-meta">{meta}</span>
    </div>
  );
}
