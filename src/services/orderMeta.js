// Small per-table cache for the Waiter/Pax captured on a table's first KOT.
// The API only persists pax (and re-persists waiter_id) on the order once a
// bill is generated (PUT /orders/:id/bill) — not at KOT-save time — so this
// bridges the gap: once set, the values keep prefilling every later KOT
// round, Bill, and Settle screen for this table until it's settled/freed.
const STORAGE_KEY = 'pos_order_meta';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota/storage errors — prefill just won't persist
  }
}

export function getOrderMeta(tableId) {
  return readAll()[tableId] || {};
}

export function setOrderMeta(tableId, meta) {
  const all = readAll();
  all[tableId] = { ...all[tableId], ...meta };
  writeAll(all);
}

export function clearOrderMeta(tableId) {
  const all = readAll();
  delete all[tableId];
  writeAll(all);
}
