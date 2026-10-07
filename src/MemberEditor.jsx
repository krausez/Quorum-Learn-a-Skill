import React, { useState } from 'react';

// small "add a person" input + list of name chips. used on the trip form
// (before the trip exists) and on the calendar (to add people later).

let nextId = 0;
function makeMember(name) {
  nextId += 1;
  return { id: `m-${Date.now()}-${nextId}`, name };
}

export default function MemberEditor({ members, onAdd, onRemove, extra = () => null }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name first.');
      return;
    }
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`${trimmed} is already on the trip.`);
      return;
    }
    setError('');
    onAdd(makeMember(trimmed));
    setName('');
  }

  // pressing enter in the name box adds the person instead of submitting
  // whatever form this editor is sitting inside of
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="me-root">
      <ul className="me-list">
        {members.length === 0 && <li className="me-empty">No one added yet.</li>}
        {members.map((m) => (
          <li key={m.id} className="me-chip">
            <span>{m.name}</span>
            {extra(m)}
            <button
              type="button"
              className="me-chip-remove"
              onClick={() => onRemove(m.id)}
              aria-label={`Remove ${m.name}`}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      <div className="me-add">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ted Mosby"
          aria-label="Member name"
        />
        <button type="button" onClick={handleAdd}>Add person</button>
      </div>
      {error && <p className="tf-error" role="alert">{error}</p>}
    </div>
  );
}
