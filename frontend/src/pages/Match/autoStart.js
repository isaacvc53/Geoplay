// Quick-match rooms start by themselves (no Start button). The room learns it from the
// navigation state; this remembers it for the tab, so a reload of the room doesn't bring
// the Start button back. Best-effort: with storage blocked, a reload just shows the button.

const PREFIX = 'geotaria:auto-start:';

export function rememberAuto(matchId) {
  try { sessionStorage.setItem(PREFIX + matchId, '1'); } catch { /* ignore */ }
}

export function wasAuto(matchId) {
  try { return sessionStorage.getItem(PREFIX + matchId) === '1'; } catch { return false; }
}
