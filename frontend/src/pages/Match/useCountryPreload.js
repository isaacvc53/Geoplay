import { useEffect, useState } from 'react';
import { preloadCountry } from '../../lib/countryPreload';

// Preloads the map of `slug` (null = do nothing yet).
// -> { status: 'idle' | 'loading' | 'ready' | 'error', data, retry }
//    data = { country, slug, geoUrl } once ready: the same thing the playable screen needs.
export function useCountryPreload(slug) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, status: 'idle', data: null });
  const key = slug ? `${slug}#${attempt}` : null;

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    preloadCountry(slug).then(
      (data) => { if (!cancelled) setResult({ key, status: 'ready', data }); },
      (err) => {
        console.error('Map preload failed', err);
        if (!cancelled) setResult({ key, status: 'error', data: null });
      }
    );
    return () => { cancelled = true; };
  }, [slug, key]);

  // A result belongs to one slug + attempt; anything else means "still loading".
  const current = result.key === key ? result : { status: slug ? 'loading' : 'idle', data: null };
  return { status: current.status, data: current.data, retry: () => setAttempt((n) => n + 1) };
}
