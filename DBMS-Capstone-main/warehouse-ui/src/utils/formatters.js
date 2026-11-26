export function fmtTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(iso);
  }
}

export function fmtDateDayMonth(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('T')[0].split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return String(dateStr);
  }
}

export function fmtNumber(n) {
  if (typeof n !== 'number') {
    const num = Number(n);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US');
  }
  return n.toLocaleString('en-US');
}

export function fmtPrice(p) {
  if (p === null || p === undefined || p === '') return '0.00';
  const num = Number(p);
  if (isNaN(num)) return String(p);
  return num.toFixed(2);
}

export function build30DayHistory(historyRows) {
  const daysMap = new Map();
  const now = new Date();

  // Generate 30 days up to today in chronological order
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    daysMap.set(key, { date: key, unitsIn: 0, unitsOut: 0 });
  }

  if (Array.isArray(historyRows)) {
    for (const row of historyRows) {
      if (!row.created_at) continue;
      const d = new Date(row.created_at);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (daysMap.has(key)) {
        const entry = daysMap.get(key);
        const qty = Number(row.quantity) || 0;
        if (row.type === 'IN') {
          entry.unitsIn += qty;
        } else if (row.type === 'OUT') {
          entry.unitsOut += qty;
        }
      }
    }
  }

  return Array.from(daysMap.values());
}
