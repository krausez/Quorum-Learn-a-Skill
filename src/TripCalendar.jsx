import React, { useState, useMemo } from 'react';
import MemberEditor from './MemberEditor';
import CostSplit from './CostSplit';
import { toISO, parseISO, isWithinTrip } from './dates';
import { computeSplit, formatMoney } from './split';
import './TripCalendar.css';

const TYPE_LABEL = {
  flight: 'Flight',
  lodging: 'Lodging',
  activity: 'Activity',
  meal: 'Meal',
};

// new items default to being split between everyone, paid by the first person
function makeDraft(members) {
  return {
    title: '',
    time: '',
    cost: '',
    type: 'activity',
    paidBy: members[0] ? members[0].id : '',
    memberIds: members.map((m) => m.id),
  };
}

export default function TripCalendar({
  trip,
  members = [],
  items = [],
  onAddItem = () => {},
  onRemoveItem = () => {},
  onToggleStatus = () => {},
  onAddMember = () => {},
  onRemoveMember = () => {},
  onResetTrip = () => {},
}) {
  const tripStart = parseISO(trip.startDate);

  const [viewDate, setViewDate] = useState(new Date(tripStart));
  const [selectedISO, setSelectedISO] = useState(null);
  const [draft, setDraft] = useState(() => makeDraft(members));
  const [addError, setAddError] = useState('');

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

  const selectedDate = selectedISO ? parseISO(selectedISO) : null;
  const selectedItems = selectedISO ? itemsByDate[selectedISO] || [] : [];
  const selectedInTrip = selectedISO ? isWithinTrip(selectedISO, trip) : false;

  function memberName(id) {
    const m = members.find((mm) => mm.id === id);
    return m ? m.name : null;
  }

  // net balance per person, shown next to their name in the member list
  const netById = useMemo(() => {
    const map = {};
    for (const r of computeSplit(items, members).rows) map[r.member.id] = r.net;
    return map;
  }, [items, members]);

  function goMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
  }

  function handleSelectDay(d) {
    setSelectedISO(toISO(d));
    setDraft(makeDraft(members));
    setAddError('');
  }

  function handleDraftChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function handleToggleSplit(memberId) {
    setDraft((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!selectedISO) return;

    // the panel could've been opened before someone was removed or added,
    // so only keep ids that still belong to someone on the trip
    const memberIds = draft.memberIds.filter((id) => memberName(id));
    const cost = draft.cost ? Number(draft.cost) : 0;

    if (!isWithinTrip(selectedISO, trip)) {
      setAddError(`Items have to be between ${trip.startDate} and ${trip.endDate}.`);
      return;
    }
    if (!draft.title.trim()) {
      setAddError('Give the item a title.');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      setAddError("Cost can't be negative.");
      return;
    }
    if (members.length > 0 && memberIds.length === 0) {
      setAddError('Pick at least one person to split this with.');
      return;
    }
    if (cost > 0 && members.length > 0 && !memberName(draft.paidBy)) {
      setAddError('Pick who paid for this.');
      return;
    }

    setAddError('');
    onAddItem(selectedISO, {
      id: `local-${Date.now()}`,
      date: selectedISO,
      type: draft.type,
      title: draft.title.trim(),
      time: draft.time || undefined,
      cost,
      status: 'pending',
      paidBy: cost > 0 ? draft.paidBy || null : null,
      memberIds,
    });
    setDraft(makeDraft(members));
  }

  return (
    <div className="tc-root">
      <header className="tc-header">
        <div>
          <h1 className="tc-title">{trip.name}</h1>
          <p className="tc-subtitle">{trip.startDate} &nbsp;&rarr;&nbsp; {trip.endDate}</p>
        </div>
        <div className="tc-header-right">
          <div className="tc-budget">
            <span className="tc-budget-label">Remaining</span>
            <span className={`tc-budget-value ${budgetRemaining < 0 ? 'tc-over' : ''}`}>
              {budgetRemaining < 0 ? '-' : ''}{formatMoney(Math.abs(budgetRemaining))}
            </span>
            <span className="tc-budget-sub">of {formatMoney(trip.budgetTotal)}</span>
          </div>
          <button className="tc-reset" onClick={onResetTrip}>New trip</button>
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
          const iso = toISO(d);
          const inMonth = d.getMonth() === month;
          const dayItems = itemsByDate[iso] || [];

          const classes = ['tc-day'];
          if (!inMonth) classes.push('tc-day--muted');
          if (isWithinTrip(iso, trip)) classes.push('tc-day--trip');
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
                    {it.cost ? ` · ${formatMoney(it.cost)}` : ''}
                    {it.paidBy && memberName(it.paidBy) ? ` · paid by ${memberName(it.paidBy)}` : ''}
                  </div>
                  {it.memberIds && it.memberIds.length > 0 && (
                    <div className="tc-panel-item-meta">
                      Split: {it.memberIds.map(memberName).filter(Boolean).join(', ')}
                    </div>
                  )}
                  <button
                    className={`tc-status ${it.status === 'pending' ? '' : 'tc-status--confirmed'}`}
                    onClick={() => onToggleStatus(it.id)}
                  >
                    {it.status === 'pending' ? 'Pending · click to confirm' : 'Confirmed'}
                  </button>
                </div>
                <button className="tc-panel-item-remove" onClick={() => onRemoveItem(it.id)} aria-label={`Remove ${it.title}`}>
                  &times;
                </button>
              </li>
            ))}
          </ul>

          {!selectedInTrip ? (
            <p className="tc-panel-note">
              This day is outside the trip ({trip.startDate} &rarr; {trip.endDate}), so nothing can be added here.
            </p>
          ) : (
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
                step="0.01"
                value={draft.cost}
                onChange={handleDraftChange}
                aria-label="Cost"
              />
              {members.length > 0 && (
                <>
                  <label className="tc-add-label">
                    Paid by
                    <select name="paidBy" value={draft.paidBy} onChange={handleDraftChange}>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="tc-split-pick">
                    <legend>Split between</legend>
                    {members.map((m) => (
                      <label key={m.id}>
                        <input
                          type="checkbox"
                          checked={draft.memberIds.includes(m.id)}
                          onChange={() => handleToggleSplit(m.id)}
                        />
                        {m.name}
                      </label>
                    ))}
                  </fieldset>
                </>
              )}
              {addError && <p className="tf-error" role="alert">{addError}</p>}
              <button type="submit">Add</button>
            </form>
          )}
        </aside>
      )}

      <section className="tc-group">
        <div className="tc-group-col">
          <h2 className="tc-section-title">The group</h2>
          <MemberEditor
            members={members}
            onAdd={onAddMember}
            onRemove={onRemoveMember}
            extra={(m) => {
              const cents = Math.round((netById[m.id] || 0) * 100);
              if (cents === 0) return null;
              return (
                <span className={`me-chip-net ${cents > 0 ? 'cs-pos' : 'cs-neg'}`}>
                  {cents > 0 ? '+' : '-'}{formatMoney(Math.abs(cents) / 100)}
                </span>
              );
            }}
          />
        </div>
        <div className="tc-group-col">
          <h2 className="tc-section-title">Cost split</h2>
          <CostSplit items={items} members={members} />
        </div>
      </section>
    </div>
  );
}
