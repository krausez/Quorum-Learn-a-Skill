import React from 'react';
import { computeSplit, formatMoney } from './split';

// table under the calendar showing each person's share of the trip,
// what they've paid so far, and whether they owe money or are owed money.

export default function CostSplit({ items, members }) {
  const { rows, unassigned } = computeSplit(items, members);

  if (members.length === 0) {
    return <p className="tc-panel-empty">Add people to the trip to see the cost split.</p>;
  }

  return (
    <div className="cs-root">
      <table className="cs-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Share</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ member, share, paid, net }) => {
            // round to cents so floating point leftovers don't show "owes $0"
            const cents = Math.round(net * 100);
            let label = 'settled';
            let cls = '';
            if (cents > 0) {
              label = `gets back ${formatMoney(cents / 100)}`;
              cls = 'cs-pos';
            } else if (cents < 0) {
              label = `owes ${formatMoney(-cents / 100)}`;
              cls = 'cs-neg';
            }
            return (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{formatMoney(share)}</td>
                <td>{formatMoney(paid)}</td>
                <td className={cls}>{label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {unassigned > 0 && (
        <p className="cs-note">
          {formatMoney(unassigned)} in costs isn't assigned to anyone yet.
        </p>
      )}
    </div>
  );
}
