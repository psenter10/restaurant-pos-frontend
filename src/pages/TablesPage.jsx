import React, { useEffect, useState } from 'react';
import TableCard from '../components/TableCard.jsx';
import SettleBillModal from '../components/SettleBillModal.jsx';
import Spinner from '../components/Spinner.jsx';
import { IconRefresh, IconPlus } from '../components/icons.jsx';
import { useTables } from '../context/TableContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import { getTableOrder, settleOrder } from '../services/api.js';
import TableReservationModal from '../components/TableReservationModal.jsx';

const LEGEND = [
  { status: 'blank', label: 'Blank Table', dot: 'bg-white border border-ink-soft/40' },
  { status: 'running', label: 'Running Table', dot: 'bg-sky' },
  { status: 'printed', label: 'Bill Printed', dot: 'bg-sage' },
  { status: 'reserved', label: 'Reserved Table', dot: 'bg-rust' },
];

export default function TablesPage() {
  const { sections, loading, refreshTables } = useTables();
  const { showSuccess, showError } = useToast();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null); // { table, orderId, items, total }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Staff leave this screen open all shift — poll in the background so
  // admin-side changes (new/disabled tables, sections, etc.) show up without
  // needing a manual refresh.
  useEffect(() => {
    const id = setInterval(() => {
      refreshTables();
    }, 60000);
    return () => clearInterval(id);
  }, [refreshTables]);

  async function handleRefresh() {
    setRefreshing(true);
    setNow(Date.now());
    await refreshTables();
    setRefreshing(false);
  }

  // Pulls the table's real open order from the API so the Settle modal shows
  // the actual persisted totals (from Generate Bill) rather than recomputing
  // them client-side.
  async function handleOpenSettle(table) {
    try {
      const res = await getTableOrder(table.id);
      const { order, items } = res.data;
      setSettleTarget({
        table,
        orderId: order?.id,
        items: (items || []).map((i) => ({ name: i.name, price: Number(i.price), qty: i.qty })),
        total: Number(order?.total) || 0,
      });
    } catch (err) {
      showError(apiErrorMessage(err, "Could not load this table's order. Please try again."));
    }
  }

  // Settling frees this table and anything merged into it automatically —
  // guarded server-side (409) if the table isn't currently Printed.
  async function handleConfirmSettle(payload) {
    if (!settleTarget?.orderId) return;
    try {
      await settleOrder(settleTarget.orderId, payload);
      showSuccess('Bill settled.');
      await refreshTables();
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not settle the bill. Please try again.'));
      throw err;
    }
  }

  // Direct link: this table's own mergedWith list, resolved to names.
  // Reverse link: for tables referenced by someone else's mergedWith, show
  // which table pulled them in, so both sides of a merge are visible.
  // Section-prefixed so identically-named tables in different sections
  // (e.g. "Table 1" in both A/C and Rooftop) aren't ambiguous in the tooltip.
  const sectionedTables = sections.flatMap((s) =>
    s.tables.map((t) => ({ ...t, sectionedName: `${s.name} - ${t.name}` }))
  );
  const nameById = Object.fromEntries(sectionedTables.map((t) => [t.id, t.sectionedName]));
  const mergedIntoMap = {};
  sectionedTables.forEach((t) => {
    (t.mergedWith || []).forEach((otherId) => {
      mergedIntoMap[otherId] = t.sectionedName;
    });
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold">Table View</h1>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {LEGEND.map((l) => (
              <div key={l.status} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className={`status-dot ${l.dot}`} />
                {l.label}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowReservation(true)}
            className="flex items-center gap-1 bg-rust text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-rust/90"
          >
            <IconPlus className="w-4 h-4" /> Table Reservation
          </button>

          <button
            onClick={handleRefresh}
            aria-label="Refresh"
            title="Refresh"
            className="p-2 rounded-md border border-line hover:bg-line/40"
          >
            <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && sections.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-ink-soft text-sm">
          <Spinner className="w-6 h-6" />
          <span>Loading tables…</span>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.name} className="mb-8">
          <h2 className="font-display text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">
            {section.name}
            {section.available === false && (
              <span className="ml-2 normal-case font-body font-normal text-rust">(Unavailable today)</span>
            )}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-4">
            {section.tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onSettle={handleOpenSettle}
                now={now}
                mergedWithNames={(table.mergedWith || []).map((id) => nameById[id]).filter(Boolean)}
                mergedIntoName={mergedIntoMap[table.id]}
                unavailable={section.available === false || table.available === false}
              />
            ))}
          </div>
        </div>
      ))}

      {showReservation && (
        <TableReservationModal onClose={() => setShowReservation(false)} />
      )}

      {settleTarget && (
        <SettleBillModal
          tableName={settleTarget.table.name}
          items={settleTarget.items}
          total={settleTarget.total}
          onClose={() => setSettleTarget(null)}
          onConfirm={handleConfirmSettle}
        />
      )}
    </div>
  );
}
