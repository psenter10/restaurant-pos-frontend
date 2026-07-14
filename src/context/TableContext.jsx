import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTables } from '../services/api.js';

const STORAGE_KEY = 'pos_table_data';

// Seed data so the app renders before the CI4 API + admin edits are in place.
// Each occupied table override carries the running bill total and how long
// ago it was seated, so TableCard can show a live amount + elapsed timer.
function makeTables(prefix, start, end, overrides) {
  const tables = [];
  const now = Date.now();
  for (let n = start; n <= end; n++) {
    const override = overrides[n];
    if (!override) {
      tables.push({ id: `${prefix}-${n}`, name: `Table ${n}`, status: 'blank' });
      continue;
    }
    const table = { id: `${prefix}-${n}`, name: `Table ${n}`, status: override.status };
    if (override.amount != null) table.amount = override.amount;
    if (override.minutesAgo != null) table.occupiedSince = now - override.minutesAgo * 60 * 1000;
    tables.push(table);
  }
  return tables;
}

const SEED_SECTIONS = [
  {
    name: 'A/C',
    orderType: 'Dine In',
    tables: [
      ...makeTables('ac', 1, 11, {
        2: { status: 'running', amount: 860, minutesAgo: 22 },
        5: { status: 'running', amount: 540, minutesAgo: 10 },
        8: { status: 'running', amount: 1200, minutesAgo: 35 },
        9: { status: 'printed', amount: 1420, minutesAgo: 50 },
      }),
      ...makeTables('ac', 12, 22, {
        12: { status: 'running', amount: 320, minutesAgo: 6 },
        14: { status: 'printed', amount: 980, minutesAgo: 40 },
        19: { status: 'printed', amount: 1650, minutesAgo: 65 },
      }),
      ...makeTables('ac', 23, 28, {
        26: { status: 'printed', amount: 750, minutesAgo: 28 },
        27: { status: 'printed', amount: 890, minutesAgo: 44 },
        28: { status: 'printed', amount: 315, minutesAgo: 15 },
      }),
    ],
  },
  {
    name: 'Non A/C',
    orderType: 'Dine In',
    tables: makeTables('nac', 1, 9, {
      2: { status: 'printed', amount: 640, minutesAgo: 20 },
      5: { status: 'printed', amount: 410, minutesAgo: 12 },
      8: { status: 'printed', amount: 980, minutesAgo: 33 },
    }),
  },
  {
    name: 'Bar',
    orderType: 'Dine In',
    tables: makeTables('bar', 1, 6, {
      3: { status: 'reserved' },
    }),
  },
];

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.sections) return parsed.sections;
    }
  } catch {
    // ignore corrupt storage, fall back to seed data
  }
  return SEED_SECTIONS;
}

const TableContext = createContext(null);

export function TableProvider({ children }) {
  const [sections, setSections] = useState(loadInitial);

  useEffect(() => {
    getTables()
      .then((res) => setSections(res.data))
      .catch(() => {
        // API not reachable yet — keep localStorage/seed data
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections }));
  }, [sections]);

  function addSection(name) {
    const trimmed = name.trim();
    if (!trimmed || sections.some((s) => s.name === trimmed)) return;
    setSections((prev) => [...prev, { name: trimmed, orderType: 'Dine In', tables: [] }]);
  }

  function renameSection(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || sections.some((s) => s.name === trimmed)) return;
    setSections((prev) => prev.map((s) => (s.name === oldName ? { ...s, name: trimmed } : s)));
  }

  function setSectionOrderType(sectionName, orderType) {
    setSections((prev) => prev.map((s) => (s.name === sectionName ? { ...s, orderType } : s)));
  }

  function deleteSection(name) {
    setSections((prev) => prev.filter((s) => s.name !== name));
  }

  function toggleSectionAvailability(name) {
    setSections((prev) =>
      prev.map((s) => (s.name === name ? { ...s, available: s.available === false } : s))
    );
  }

  function addTable(sectionName, tableName, capacity) {
    const trimmed = tableName.trim();
    if (!trimmed) return;
    const id = `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setSections((prev) =>
      prev.map((s) =>
        s.name === sectionName
          ? {
              ...s,
              tables: [
                ...s.tables,
                { id, name: trimmed, status: 'blank', ...(capacity ? { capacity: Number(capacity) } : {}) },
              ],
            }
          : s
      )
    );
  }

  function updateTable(sectionName, tableId, patch) {
    setSections((prev) =>
      prev.map((s) =>
        s.name === sectionName
          ? { ...s, tables: s.tables.map((t) => (t.id === tableId ? { ...t, ...patch } : t)) }
          : s
      )
    );
  }

  function removeTable(sectionName, tableId) {
    setSections((prev) =>
      prev.map((s) =>
        s.name === sectionName ? { ...s, tables: s.tables.filter((t) => t.id !== tableId) } : s
      )
    );
  }

  function toggleTableAvailability(sectionName, tableId) {
    setSections((prev) =>
      prev.map((s) =>
        s.name === sectionName
          ? {
              ...s,
              tables: s.tables.map((t) =>
                t.id === tableId ? { ...t, available: t.available === false } : t
              ),
            }
          : s
      )
    );
  }

  return (
    <TableContext.Provider
      value={{
        sections,
        addSection,
        renameSection,
        deleteSection,
        toggleSectionAvailability,
        setSectionOrderType,
        addTable,
        updateTable,
        removeTable,
        toggleTableAvailability,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

export function useTables() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTables must be used within a TableProvider');
  return ctx;
}
