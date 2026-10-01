import { api } from '../../lib/api';
import { usePolled } from '../../lib/usePolled';

// My open match + the challenges I've received, refreshed every few seconds while
// the menu is open (GET /matches/mine is a single cheap query).
export function useMyMatches(loggedIn) {
  const { data, loaded, reload } = usePolled(() => api.getMyMatches(), {
    enabled: loggedIn,
    interval: 3000,
  });
  return {
    current: data ? data.current : null,
    invitations: data ? data.invitations : [],
    loaded,
    reload,
  };
}
