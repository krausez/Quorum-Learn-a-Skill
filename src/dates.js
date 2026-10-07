// date helpers that stay in LOCAL time.
// toISOString() converts to UTC first, which can shift a day backwards/forwards
// depending on the user's timezone, so we build the YYYY-MM-DD string by hand.

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// YYYY-MM-DD strings compare correctly as plain strings
export function isWithinTrip(iso, trip) {
  return iso >= trip.startDate && iso <= trip.endDate;
}
