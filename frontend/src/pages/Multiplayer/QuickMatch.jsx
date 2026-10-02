import { useState } from 'react';
import { formatElapsed } from '../Match/matchText';

// "Quick match" card: look for a random opponent. The country (shown lighting up on the world
// map) and the length (1 to 5 minutes, never untimed) are both drawn when the pair is formed,
// and the match starts by itself a few seconds later: there is no Start button. After
// WAIT_NOTICE_S seconds without a rival it offers to keep waiting or to play solo meanwhile.

const WAIT_NOTICE_S = 30;

// Mounted only while searching, so "Keep waiting" is forgotten on the next search.
function Searching({ queue }) {
  const [keepWaiting, setKeepWaiting] = useState(false);
  const showNotice = queue.waited >= WAIT_NOTICE_S && !keepWaiting;

  return (
    <>
      <div className="mq-search" role="status" aria-live="polite">
        <span className="mq-spinner" aria-hidden="true" />
        <div className="mq-search-text">
          <strong>Looking for an opponent…</strong>
          <span className="mq-hint">Keep this page open. We&apos;ll take you to the match as soon as someone joins.</span>
        </div>
        <span className="mq-timer" aria-label="Time searching">{formatElapsed(queue.waited * 1000)}</span>
      </div>

      {showNotice && (
        <div className="mq-notice" role="status">
          <p>
            <strong>Nobody yet.</strong> There may not be many players online right now.
            Keep waiting, or practise on your own and come back later.
          </p>
          <div className="mq-notice-actions">
            <button type="button" className="mp-btn primary" disabled={queue.busy} onClick={() => setKeepWaiting(true)}>
              Keep waiting
            </button>
            <button type="button" className="mp-btn" disabled={queue.busy} onClick={queue.playSolo}>
              Play solo
            </button>
          </div>
        </div>
      )}

      <button type="button" className="mp-btn mq-cancel" disabled={queue.busy} onClick={queue.cancel}>
        Cancel search
      </button>
    </>
  );
}

export default function QuickMatch({ queue }) {
  const { state } = queue;

  return (
    <section className="mp-card mq-card" aria-labelledby="mq-title">
      <div className="mp-card-head">
        <h2 id="mq-title">Quick match</h2>
        <span className="mp-card-hint">Random opponent</span>
      </div>

      {queue.error && <p className="mp-error" role="alert">{queue.error}</p>}

      {state === 'searching' && <Searching queue={queue} />}

      {state === 'lapsed' && (
        <div className="mq-body">
          <p className="mq-text">Your search ended because this page was in the background for a while.</p>
          <button type="button" className="mp-btn primary mq-cta" disabled={queue.busy} onClick={queue.find}>
            {queue.busy ? 'Searching…' : 'Search again'}
          </button>
        </div>
      )}

      {state === 'idle' && (
        <div className="mq-body">
          <p className="mq-text">
            Get matched with another player who is looking for a game. The <strong>country</strong> and
            the <strong>length</strong> (1 to 5 minutes) are drawn at random for both of you, and the match
            starts on its own a few seconds later.
          </p>
          <button type="button" className="mp-btn primary mq-cta" disabled={queue.busy} onClick={queue.find}>
            {queue.busy ? 'Searching…' : 'Find an opponent'}
          </button>
        </div>
      )}
    </section>
  );
}
