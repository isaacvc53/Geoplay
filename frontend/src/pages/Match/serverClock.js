// A clock that follows the SERVER's time, so both players see the same countdown even
// if their own clocks are off by seconds (or minutes).
//
// Every match response carries `server_time`. For each request we note when it was sent
// and when the answer arrived: the server stamped it somewhere in between, most likely
// near the middle, so   offset = server_time - (sent + received) / 2   with an error of
// at most half the round trip. Of the last few samples we trust the one with the
// SHORTEST round trip (the most precise one).

const MAX_SAMPLES = 8;

// Date.parse reads fractional seconds beyond milliseconds differently from browser to
// browser; the server sends microseconds, so cut them to 3 digits first.
export function toMs(iso) {
  if (!iso) return NaN;
  return Date.parse(String(iso).replace(/(\.\d{3})\d+/, '$1'));
}

export function createServerClock() {
  const samples = []; // { offset, rtt }

  function bestOffset() {
    if (!samples.length) return 0; // no sample yet: trust the local clock
    return samples.reduce((best, s) => (s.rtt < best.rtt ? s : best)).offset;
  }

  return {
    // sentAt / receivedAt: Date.now() right before the request and right after the answer.
    sample(serverTime, sentAt, receivedAt) {
      const serverMs = toMs(serverTime);
      if (!Number.isFinite(serverMs)) return;
      samples.push({
        offset: serverMs - (sentAt + receivedAt) / 2,
        rtt: Math.max(0, receivedAt - sentAt),
      });
      if (samples.length > MAX_SAMPLES) samples.shift();
    },
    // Estimated server time, in ms since the epoch.
    now() {
      return Date.now() + bestOffset();
    },
    // How far this device's clock is from the server's (ms). Handy for debugging.
    offset: bestOffset,
  };
}
