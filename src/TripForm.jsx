import React, { useState } from 'react';
import MemberEditor from './MemberEditor';
import './TripCalendar.css';

export default function TripForm({ onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    budgetTotal: '',
  });
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const { name, startDate, endDate, budgetTotal } = formData;

    if (!name.trim() || !startDate || !endDate || !budgetTotal) {
      setError('Fill in every field before creating the trip.');
      return;
    }

    if (endDate < startDate) {
      setError("End date has to be after the start date.");
      return;
    }

    if (Number(budgetTotal) <= 0) {
      setError('Budget has to be more than $0.');
      return;
    }

    if (members.length === 0) {
      setError("Add at least one person who's going on the trip.");
      return;
    }

    setError('');
    onCreate(
      {
        name: name.trim(),
        startDate,
        endDate,
        budgetTotal: Number(budgetTotal),
      },
      members
    );
  }

  return (
    <div className="tc-root">
      <h1 className="tc-title">Start a new trip</h1>
      <p className="tc-subtitle">
        Set the basics — you can add flights, lodging, and activities once it's created.
      </p>

      <form className="tf-form" onSubmit={handleSubmit}>
        <label htmlFor="tf-name">
          Trip name
          <input
            id="tf-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Marshall Eriksen's Bachelor Weekend"
          />
        </label>

        <div className="tf-row">
          <label htmlFor="tf-start-date">
            Start date
            <input
              id="tf-start-date"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="tf-end-date">
            End date
            <input
              id="tf-end-date"
              type="date"
              name="endDate"
              min={formData.startDate || undefined}
              value={formData.endDate}
              onChange={handleChange}
            />
          </label>
        </div>

        <label htmlFor="tf-budget">
          Group budget ($)
          <input
            id="tf-budget"
            type="number"
            name="budgetTotal"
            min="0"
            value={formData.budgetTotal}
            onChange={handleChange}
            placeholder="4200"
          />
        </label>

        <fieldset className="tf-fieldset">
          <legend>Who's going?</legend>
          <MemberEditor
            members={members}
            onAdd={(m) => setMembers((prev) => [...prev, m])}
            onRemove={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
          />
        </fieldset>

        {error && <p className="tf-error" role="alert">{error}</p>}

        <button type="submit">Create trip</button>
      </form>
    </div>
  );
}
