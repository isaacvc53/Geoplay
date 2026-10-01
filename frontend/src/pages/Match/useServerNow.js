import { useEffect, useState } from 'react';

// Server time (ms), refreshed every `intervalMs` while the component is mounted.
export function useServerNow(clock, intervalMs = 100) {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(clock.now()), intervalMs);
    return () => clearInterval(timer);
  }, [clock, intervalMs]);
  return now;
}
