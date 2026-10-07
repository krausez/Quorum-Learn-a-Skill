// works out how the trip cost splits across the group.
// each item's cost is divided evenly between the members it's assigned to.
// "paid" is what that person actually put down, "share" is what they owe overall,
// and net = paid - share (positive means the group owes them money back).

export function computeSplit(items, members) {
  const rows = {};
  for (const m of members) {
    rows[m.id] = { member: m, share: 0, paid: 0 };
  }

  let unassigned = 0;

  for (const item of items) {
    const cost = Number(item.cost) || 0;
    if (cost <= 0) continue;

    const splitIds = (item.memberIds || []).filter((id) => rows[id]);
    if (splitIds.length === 0) {
      unassigned += cost;
    } else {
      const each = cost / splitIds.length;
      for (const id of splitIds) rows[id].share += each;
    }

    if (item.paidBy && rows[item.paidBy]) {
      rows[item.paidBy].paid += cost;
    }
  }

  return {
    rows: members.map((m) => {
      const r = rows[m.id];
      return { ...r, net: r.paid - r.share };
    }),
    unassigned,
  };
}

export function formatMoney(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
