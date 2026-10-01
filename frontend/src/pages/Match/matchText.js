// Texts and small helpers shared by every multiplayer screen (UI is in English,
// like the menu). The backend answers with a stable `code`; the texts live here.

export const DURATIONS = [60, 120, 180, 300, 0]; // 0 = no time limit
export const DEFAULT_DURATION = 180;
export const UNTIMED = 0;

export const isUntimed = (seconds) => seconds === UNTIMED;

// "3 min", or "No limit" for an untimed match (chips, small meta lines).
export function formatDuration(seconds) {
  if (isUntimed(seconds)) return 'No limit';
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes} min` : `${seconds} s`;
}

// For sentences: "a 3 min match" / "an untimed match" (capital: "A 3 min match").
export function describeMatch(seconds, { capital = false } = {}) {
  const text = isUntimed(seconds) ? 'an untimed match' : `a ${formatDuration(seconds)} match`;
  return capital ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

// "m:ss" from milliseconds, rounded down (time elapsed in an untimed match).
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// The other player, seen from my side of the match.
export function opponentOf(match) {
  return match.my_role === 'host' ? match.guest : match.host;
}

// Country name shown in the multiplayer screens: the same one the match room and the roulette
// already use (Country.nombre). Change it here to show English names everywhere at once.
export function countryLabel(country) {
  return country ? country.nombre : null;
}

export const TERMINAL_STATUSES = new Set(['declined', 'cancelled', 'expired', 'finished']);

const ERROR_MESSAGES = {
  friend_not_found: 'That friend is no longer in your list.',
  already_in_match: 'You already have an open match. Finish or cancel it first.',
  friend_busy: 'Your friend is in another match right now. Try again in a moment.',
  invalid_duration: 'Choose a valid match length.',
  country_not_playable: "That country isn't available for matches. Pick another one.",
  match_not_found: "This match doesn't exist anymore.",
  not_invited: 'Only the invited player can do that.',
  match_not_pending: 'This invitation is no longer available.',
  match_not_cancellable: "This match can't be cancelled anymore.",
  match_not_ready: "This match can't be started anymore.",
  match_not_playing: 'The match is over.',
  match_not_started: 'Wait for the countdown to finish.',
  no_countries_available: 'No countries are available to draw right now.',
};

export function matchErrorText(err) {
  if (err && err.code && ERROR_MESSAGES[err.code]) return ERROR_MESSAGES[err.code];
  if (err && err.status === 429) return 'Too many attempts. Try again in a moment.';
  if (!err || err.status == null) return "Couldn't reach the server. Check your connection.";
  return 'Something went wrong. Please try again.';
}
