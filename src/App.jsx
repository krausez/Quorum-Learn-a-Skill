import React, { useState, useEffect } from 'react';
import TripForm from './TripForm';
import TripCalendar from './TripCalendar';
import { loadTrip, saveTrip } from './storage';

// starts on the trip creation form. once you submit it, the trip + group
// members get stored in state and the calendar takes over. everything is
// mirrored to localStorage so a refresh picks up where you left off.

export default function App() {
  const [saved] = useState(loadTrip);
  const [trip, setTrip] = useState(saved ? saved.trip : null);
  const [members, setMembers] = useState(saved ? saved.members : []);
  const [items, setItems] = useState(saved ? saved.items : []);

  useEffect(() => {
    saveTrip({ trip, members, items });
  }, [trip, members, items]);

  function handleCreateTrip(newTrip, newMembers) {
    setTrip(newTrip);
    setMembers(newMembers);
    setItems([]);
  }

  function handleResetTrip() {
    if (!window.confirm('Start a new trip? This clears the current calendar.')) return;
    setTrip(null);
    setMembers([]);
    setItems([]);
  }

  function handleAddItem(date, newItem) {
    setItems((prev) => [...prev, newItem]);
  }

  function handleRemoveItem(itemId) {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  function handleToggleStatus(itemId) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, status: it.status === 'pending' ? 'confirmed' : 'pending' }
          : it
      )
    );
  }

  function handleAddMember(member) {
    setMembers((prev) => [...prev, member]);
  }

  // when someone leaves the trip, take them off every item too so the
  // cost split doesn't keep charging a person who isn't there anymore
  function handleRemoveMember(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        memberIds: (it.memberIds || []).filter((id) => id !== memberId),
        paidBy: it.paidBy === memberId ? null : it.paidBy,
      }))
    );
  }

  if (!trip) {
    return <TripForm onCreate={handleCreateTrip} />;
  }

  return (
    <TripCalendar
      trip={trip}
      members={members}
      items={items}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onToggleStatus={handleToggleStatus}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
      onResetTrip={handleResetTrip}
    />
  );
}
