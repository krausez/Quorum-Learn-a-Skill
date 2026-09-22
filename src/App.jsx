import React, { useState } from 'react';
import TripForm from './TripForm';
import TripCalendar from './TripCalendar';

// starts on the trip creation form. once you submit it, the trip gets
// stored in state and the calendar takes over with an empty itinerary
// you can add flights/lodging/activities/meals to from there.

export default function App() {
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);

  function handleCreateTrip(newTrip) {
    setTrip(newTrip);
    setItems([]);
  }

  function handleAddItem(date, newItem) {
    setItems((prev) => [...prev, newItem]);
  }

  function handleRemoveItem(itemId) {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  if (!trip) {
    return <TripForm onCreate={handleCreateTrip} />;
  }

  return (
    <TripCalendar
      trip={trip}
      items={items}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
    />
  );
}