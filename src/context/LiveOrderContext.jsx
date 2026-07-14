import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'pos_live_orders';

// Tracks each table's actual ordered items (across multiple KOT rounds) so the
// "View Details" / "Settle" screens can show what was really ordered instead
// of just the running total. Keyed by table id: { [tableId]: { items: [...] } }
function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return {};
}

const LiveOrderContext = createContext(null);

export function LiveOrderProvider({ children }) {
  const [orders, setOrders] = useState(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  function getItems(tableId) {
    return orders[tableId]?.items || [];
  }

  // Appends a fresh round of items (from a new KOT) onto the table's running
  // order, tagged with which KOT they came from. Items are kept as separate
  // lines per round (not merged by id across rounds) so the bill view can
  // show which items were ordered under which KOT number. Returns the merged
  // list so the caller can immediately compute the new running total.
  function addItems(tableId, newItems, kotMeta = {}) {
    const existing = orders[tableId]?.items || [];
    const tagged = newItems.map((item, idx) => ({
      ...item,
      kotNo: kotMeta.kotNo,
      kotTime: kotMeta.kotTime,
      // Same item can now appear on multiple KOT rounds, so `id` alone is no
      // longer unique — this is the stable key used for qty/remove actions.
      lineId: `${item.id}-${kotMeta.kotNo ?? 'x'}-${idx}`,
    }));
    const merged = [...existing, ...tagged];
    setOrders((prev) => ({ ...prev, [tableId]: { items: merged } }));
    return merged;
  }

  function setItems(tableId, items) {
    setOrders((prev) => ({ ...prev, [tableId]: { items } }));
  }

  function clearOrder(tableId) {
    setOrders((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
  }

  return (
    <LiveOrderContext.Provider value={{ getItems, addItems, setItems, clearOrder }}>
      {children}
    </LiveOrderContext.Provider>
  );
}

export function useLiveOrders() {
  const ctx = useContext(LiveOrderContext);
  if (!ctx) throw new Error('useLiveOrders must be used within a LiveOrderProvider');
  return ctx;
}
