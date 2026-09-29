import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Round avatar for a friend (or yourself): the photo if there is one, otherwise
// the first letter of the username. The shape/size come from the `className`
// each page already styles (friend-avatar, cmp-avatar...). `fallback` replaces
// the initial when there is no photo (e.g. a generic account icon).
//
// `version` is the user's avatar_updated_at (null/undefined = no photo, so no
// request is made). Downloaded photos are cached per user+version, so lists
// that re-render don't fetch them again, and a changed photo gets a new key.

const cache = new Map(); // "userId:version" -> object URL

export default function UserAvatar({ userId, name, version, className, fallback }) {
  const key = version ? `${userId}:${version}` : null;
  const [url, setUrl] = useState(() => (key && cache.get(key)) || null);

  useEffect(() => {
    if (!key) { setUrl(null); return undefined; }
    if (cache.has(key)) { setUrl(cache.get(key)); return undefined; }
    let cancelled = false;
    api.getUserAvatarBlob(userId)
      .then((blob) => {
        if (!blob) return;
        const objectUrl = URL.createObjectURL(blob);
        cache.set(key, objectUrl);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch(() => {}); // without the photo, the initial is shown
    return () => { cancelled = true; };
  }, [key, userId]);

  return (
    <span className={className} aria-hidden="true">
      {url ? <img src={url} alt="" /> : (fallback ?? name.charAt(0).toUpperCase())}
    </span>
  );
}
