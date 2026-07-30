import React, { createContext, useContext, useEffect, useState } from 'react';
import { getKots, updateKotStatus as apiUpdateKotStatus, cancelKot as apiCancelKot } from '../services/api.js';

const KotContext = createContext(null);

function toEpoch(value) {
  if (value == null) return null;
  return typeof value === 'number' ? value : new Date(value).getTime();
}

// GET /kots returns the raw row plus joined table_name/waiter_name/etc; the
// Kitchen Display (KotPage/KotCard) has always used this camelCase shape
// with epoch-ms timestamps for its live stopwatch, so that mapping happens here.
function mapKot(row) {
  return {
    id: row.id,
    kotNo: row.kot_no,
    tableId: row.table_id,
    tableName: row.table_name,
    waiter: row.waiter_name,
    orderType: row.order_type,
    note: row.note,
    status: row.status,
    items: (row.items || []).map((item) => ({ name: item.name, qty: item.qty, notes: item.notes })),
    createdAt: toEpoch(row.created_at),
    preparingAt: toEpoch(row.preparing_at),
    completedAt: toEpoch(row.completed_at),
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Backs the Kitchen Display's 3-column board (New/Preparing/Completed).
// KOT rows are created server-side by saveKot() in api.js (called from
// OrderPage.handleSaveKot) — this context only reads/transitions them.
// Scoped to one calendar day at a time (see `date`/`setDate`), defaulting to
// today so the board doesn't keep growing with every KOT ever fired.
export function KotProvider({ children }) {
  const [kots, setKots] = useState([]);
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function refresh() {
    return getKots(date)
      .then((res) => setKots(res.data.map(mapKot)))
      .catch(() => {
        // Backend unreachable — leave the board empty rather than show stale data.
      });
  }

  async function updateKotStatus(id, status) {
    await apiUpdateKotStatus(id, status);
    await refresh();
  }

  async function cancelKot(id) {
    await apiCancelKot(id);
    await refresh();
  }

  return (
    <KotContext.Provider value={{ kots, date, setDate, refreshKots: refresh, updateKotStatus, cancelKot }}>
      {children}
    </KotContext.Provider>
  );
}

export function useKots() {
  const ctx = useContext(KotContext);
  if (!ctx) throw new Error('useKots must be used within a KotProvider');
  return ctx;
}
