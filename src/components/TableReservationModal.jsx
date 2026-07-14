import React, { useState } from 'react';
import { useTables } from '../context/TableContext.jsx';

const SELECTABLE_STATUSES = ['blank', 'reserved'];

export default function TableReservationModal({ onClose }) {
  const { sections, updateTable } = useTables();
  const [selected, setSelected] = useState(null); // { sectionName, table }
  const [confirming, setConfirming] = useState(false);

  function selectTable(sectionName, table) {
    setConfirming(false);
    if (!SELECTABLE_STATUSES.includes(table.status)) return;
    setSelected({ sectionName, table });
  }

  function commit() {
    const isReserved = selected.table.status === 'reserved';
    updateTable(selected.sectionName, selected.table.id, {
      status: isReserved ? 'blank' : 'reserved',
    });
    setSelected(null);
    setConfirming(false);
  }

  const isReserved = selected?.table.status === 'reserved';

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-md w-[560px] max-w-[92vw] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="font-display font-semibold text-lg">Table Reservation</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <p className="text-xs text-ink-soft mb-3">
            Select a table to reserve it, or select an already-reserved table to unbook it.
          </p>

          {sections.map((section) => (
            <div key={section.name} className="mb-4">
              <div className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                {section.name}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {section.tables.map((table) => {
                  const selectable = SELECTABLE_STATUSES.includes(table.status);
                  const isSelected = selected?.table.id === table.id;
                  const reserved = table.status === 'reserved';
                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectTable(section.name, table)}
                      className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                        reserved
                          ? 'bg-rust-light border-rust text-rust'
                          : 'bg-white border-line text-ink-soft'
                      } ${
                        isSelected ? 'ring-2 ring-navy ring-offset-1' : ''
                      } ${!selectable ? 'opacity-40 cursor-not-allowed' : 'hover:border-navy/40'}`}
                      title={!selectable ? 'Table is currently in use' : undefined}
                    >
                      {table.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="px-5 py-4 border-t border-line shrink-0">
            {!confirming ? (
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {isReserved ? (
                    <>
                      <span className="font-medium">{selected.table.name}</span> is currently reserved.
                    </>
                  ) : (
                    <>
                      Reserve <span className="font-medium">{selected.table.name}</span>?
                    </>
                  )}
                </span>
                <button
                  onClick={() => setConfirming(true)}
                  className={`text-sm font-medium px-4 py-2 rounded-md text-white ${
                    isReserved ? 'bg-ink hover:bg-ink/90' : 'bg-rust hover:bg-rust/90'
                  }`}
                >
                  {isReserved ? 'Unbook Table' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-line/30 rounded-md px-4 py-3">
                <span className="text-sm">
                  Are you sure you want to {isReserved ? 'unbook' : 'reserve'}{' '}
                  <span className="font-medium">{selected.table.name}</span>?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={commit}
                    className="bg-rust text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-rust/90"
                  >
                    {isReserved ? 'Yes, Unbook' : 'Yes, Reserve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
