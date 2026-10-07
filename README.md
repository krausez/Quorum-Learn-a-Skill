# Quorum – Trip Calendar

React + Vite prototype of the Quorum group trip planner: create a trip, add the people going, and plan flights, lodging, activities, and meals on a calendar while tracking the group budget and who owes what.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Features

- **Trip form** (`TripForm.jsx`) – name, dates, group budget, and the list of people going, with validation.
- **Calendar** (`TripCalendar.jsx`) – month grid with trip days outlined; click a day to see and add items.
  - Items can only be added on days inside the trip.
  - Each item records who paid and who it's split between, and can be toggled pending/confirmed.
- **Group + cost split** (`MemberEditor.jsx`, `CostSplit.jsx`, `split.js`) – add/remove people after the trip is created and see each person's share, what they've paid, and their balance.
- **Saving** (`storage.js`) – the trip is saved to localStorage so a refresh keeps it. "New trip" clears it.
- **Dates** (`dates.js`) – local-time date helpers (avoids the UTC shift from `toISOString()`).
