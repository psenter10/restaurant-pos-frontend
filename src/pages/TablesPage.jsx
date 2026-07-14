import React, { useEffect, useState } from 'react';
import TableCard from '../components/TableCard.jsx';
import SettleBillModal from '../components/SettleBillModal.jsx';
import { IconRefresh, IconPlus } from '../components/icons.jsx';
import { useTables } from '../context/TableContext.jsx';
import { useLiveOrders } from '../context/LiveOrderContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import TableReservationModal from '../components/TableReservationModal.jsx';

const LEGEND = [
  { status: 'blank', label: 'Blank Table', dot: 'bg-white border border-ink-soft/40' },
  { status: 'running', label: 'Running Table', dot: 'bg-sky' },
  { status: 'printed', label: 'Bill Printed', dot: 'bg-sage' },
  { status: 'reserved', label: 'Reserved Table', dot: 'bg-rust' },
];

export default function TablesPage() {
  const { sections, updateTable } = useTables();
  const { getItems, clearOrder } = useLiveOrders();
  const { settings } = useSettings();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null); // { table, sectionName }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setNow(Date.now());
    setTimeout(() => setRefreshing(false), 400);
  }

  function findSectionName(tableId) {
    return sections.find((s) => s.tables.some((t) => t.id === tableId))?.name;
  }

  function handleOpenSettle(table) {
    const sectionName = findSectionName(table.id);
    const items = getItems(table.id);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = subtotal + subtotal * (settings.taxRate / 100);
    setSettleTarget({ table, sectionName, items, total });
  }

  function handleConfirmSettle() {
    const { table } = settleTarget;
    const idsToFree = [table.id, ...(table.mergedWith || [])];
    idsToFree.forEach((id) => {
      clearOrder(id);
      const sn = findSectionName(id);
      if (sn) {
        updateTable(sn, id, { status: 'blank', mergedWith: [] });
      }
    });
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
