import React, { useState, useMemo } from 'react';
import './TripCalendar.css';

const TYPE_LABEL = {
  flight: 'Flight',
  lodging: 'Lodging',
  activity: 'Activity',
  meal: 'Meal',
};

const EMPTY_DRAFT = { title: '', time: '', cost: '', type: 'activity' };

export default function TripCalendar({
  trip,
  members = [],
  items = [],
  onAddItem = () => {},
  onRemoveItem = () => {},
}) {
  const [startY, startM, startD] = trip.startDate.split('-').map(Number);
  const tripStart = new Date(startY, startM - 1, startD);
  const [endY, endM, endD] = trip.endDate.split('-').map(Number);
  const tripEnd = new Date(endY, endM - 1, endD);

  const [viewDate, setViewDate] = useState(new Date(tripStart));
  const [selectedISO, setSelectedISO] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // always 42 cells so the grid height doesn't jump between months
  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  const itemsByDate = useMemo(() => {
    const map = {};
    for (const item of items) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }
    for (const key in map) {
      map[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return map;
  }, [items]);

  const spentTotal = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
  const budgetRemaining = trip.budgetTotal - spentTotal;

  const [selY, selM, selD] = selectedISO ? selectedISO.split('-').map(Number) : [];
  const selectedDate = selectedISO ? new Date(selY, selM - 1, selD) : null;
  const selectedItems = selectedISO ? itemsByDate[selectedISO] || [] : [];

  function goMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
  }

  function handleSelectDay(d) {
    setSelectedISO(d.toISOString().slice(0, 10));
    setDraft(EMPTY_DRAFT);
  }

  function handleDraftChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!draft.title.trim() || !selectedISO) return;

    onAddItem(selectedISO, {
      id: `local-${Date.now()}`,
      date: selectedISO,
      type: draft.type,
      title: draft.title.trim(),
      time: draft.time || undefined,
      cost: draft.cost ? Number(draft.cost) : 0,
      status: 'pending',
      memberIds: [],
    });
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="tc-root">
      <header className="tc-header">
        <div>
          <h1 className="tc-title">{trip.name}</h1>
          <p className="tc-subtitle">{trip.startDate} &nbsp;&rarr;&nbsp; {trip.endDate}</p>
        </div>
        <div className="tc-budget">
          <span className="tc-budget-label">Remaining</span>
          <span className={`tc-budget-value ${budgetRemaining < 0 ? 'tc-over' : ''}`}>
            ${budgetRemaining.toLocaleString()}
          </span>
          <span className="tc-budget-sub">of ${trip.budgetTotal.toLocaleString()}</span>
        </div>
      </header>

      <div className="tc-nav">
        <button className="tc-nav-btn" onClick={() => goMonth(-1)} aria-label="Previous month">&#8592;</button>
        <span className="tc-nav-month">
          {viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button className="tc-nav-btn" onClick={() => goMonth(1)} aria-label="Next month">&#8594;</button>
      </div>

      <div className="tc-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="tc-weekday">{d}</div>
        ))}

        {grid.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const inMonth = d.getMonth() === month;
          const dayItems = itemsByDate[iso] || [];

          const classes = ['tc-day'];
          if (!inMonth) classes.push('tc-day--muted');
          if (d >= tripStart && d <= tripEnd) classes.push('tc-day--trip');
          if (iso === selectedISO) classes.push('tc-day--selected');

          return (
            <button key={iso} className={classes.join(' ')} onClick={() => handleSelectDay(d)}>
              <span className="tc-day-number">{d.getDate()}</span>
              <div className="tc-day-items">
                {dayItems.slice(0, 3).map((it) => (
                  <span
                    key={it.id}
                    className={`tc-dot tc-dot--${it.type} ${it.status === 'pending' ? 'tc-dot--pending' : ''}`}
                    title={`${TYPE_LABEL[it.type]}: ${it.title}`}
                  />
                ))}
                {dayItems.length > 3 && <span className="tc-day-more">+{dayItems.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <aside className="tc-panel">
          <div className="tc-panel-head">
            <h2>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
            <button className="tc-panel-close" onClick={() => setSelectedISO(null)}>Close</button>
          </div>

          <ul className="tc-panel-list">
            {selectedItems.length === 0 && <li className="tc-panel-empty">Nothing scheduled yet.</li>}
            {selectedItems.map((it) => (
              <li key={it.id} className="tc-panel-item">
                <span className={`tc-dot tc-dot--${it.type}`} />
                <div className="tc-panel-item-body">
                  <div className="tc-panel-item-title">{it.title}</div>
                  <div className="tc-panel-item-meta">
                    {TYPE_LABEL[it.type]}
                    {it.time ? ` · ${it.time}` : ''}
                    {it.cost ? ` · $${it.cost}` : ''}
                    {it.status === 'pending' ? ' · pending' : ''}
                  </div>
                </div>
                <button className="tc-panel-item-remove" onClick={() => onRemoveItem(it.id)} aria-label={`Remove ${it.title}`}>
                  &times;
                </button>
              </li>
            ))}
          </ul>

          <form className="tc-add-form" onSubmit={handleAddSubmit}>
            <select
              name="type"
              value={draft.type}
              onChange={handleDraftChange}
              aria-label="Item type"
            >
              {Object.entries(TYPE_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              name="title"
              placeholder="Eat a massive steak"
              value={draft.title}
              onChange={handleDraftChange}
              aria-label="Title"
            />
            <input
              type="time"
              name="time"
              value={draft.time}
              onChange={handleDraftChange}
              aria-label="Time"
            />
            <input
              type="number"
              name="cost"
              placeholder="$"
              min="0"
              value={draft.cost}
              onChange={handleDraftChange}
              aria-label="Cost"
            />
            <button type="submit">Add</button>
          </form>
        </aside>
      )}
    </div>
  );
}