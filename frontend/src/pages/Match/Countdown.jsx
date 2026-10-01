import { useState } from 'react';

// The big 3-2-1. `remainingMs` is the time left until the match clock starts (server
// time); at 0 or below it shows "Go!". It is a pure function of that number, so every
// screen that shows the same server time shows the same digit.

const SECOND = 1000;

// One digit. Remounted (key) whenever the digit changes, so its animation restarts. A
// player who arrives mid-second starts the ring part-way round: `elapsed` is read once,
// on mount, because changing an animation-delay mid-flight would make it jump.
function Face({ label, go, elapsed }) {
  const [delay] = useState(elapsed);
  const style = go ? undefined : { animationDelay: `-${Math.round(delay)}ms` };
  return (
    <div className={'mp-count' + (go ? ' go' : '')} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <circle className="mp-count-track" cx="60" cy="60" r="54" />
        <circle className="mp-count-arc" cx="60" cy="60" r="54" style={style} />
      </svg>
      <span className="mp-count-num" style={style}>{label}</span>
    </div>
  );
}

export default function Countdown({ remainingMs }) {
  const go = remainingMs <= 0;
  // Digits are always 3, 2 or 1: if the clocks disagree a little, never show a 4.
  const n = go ? 0 : Math.min(3, Math.max(1, Math.ceil(remainingMs / SECOND)));
  const elapsed = go ? 0 : Math.max(0, n * SECOND - remainingMs);

  return (
    <div className="mp-countdown">
      <Face key={go ? 'go' : n} label={go ? 'Go!' : String(n)} go={go} elapsed={elapsed} />
      <p className="mp-sr" role="status">{go ? 'Go!' : `Starting in ${n}`}</p>
    </div>
  );
}
