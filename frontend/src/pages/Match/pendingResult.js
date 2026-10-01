// Remembers (in this browser) the match the player was in, so that if they leave the page
// or lose the connection and the match ends meanwhile, the menu can still offer them its
// result. It is cleared as soon as the result has been shown. Everything is best-effort:
// storage can be blocked, and then the player simply doesn't get the reminder.

const KEY = 'geotaria_pending_result';

export function markPending(matchId) {
  try { localStorage.setItem(KEY, String(matchId)); } catch { /* ignore */ }
}

export function clearPending(matchId) {
  try {
    if (matchId == null || localStorage.getItem(KEY) === String(matchId)) localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function getPending() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
