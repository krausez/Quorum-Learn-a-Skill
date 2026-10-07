// saves the trip to the browser's localStorage so a refresh doesn't wipe it.
// wrapped in try/catch because storage can be blocked (private mode, etc.)
// and the app should still work, just without saving.

const KEY = 'quorum-trip-v1';

export function loadTrip() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.trip) return null;
    return {
      trip: data.trip,
      members: Array.isArray(data.members) ? data.members : [],
      items: Array.isArray(data.items) ? data.items : [],
    };
  } catch {
    return null;
  }
}

export function saveTrip(data) {
  try {
    if (data.trip) {
      localStorage.setItem(KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // ignore, nothing we can do
  }
}
