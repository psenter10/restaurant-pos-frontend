import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getTableSections,
  createTableSection,
  updateTableSection,
  deleteTableSection,
  toggleTableSectionAvailability,
  getTables,
  createTable as apiCreateTable,
  updateTable as apiUpdateTable,
  deleteTable as apiDeleteTable,
  toggleTableAvailability as apiToggleTableAvailability,
  updateTableStatus,
  updateTableMerge,
} from '../services/api.js';

const TableContext = createContext(null);

function toEpoch(value) {
  if (value == null) return null;
  return typeof value === 'number' ? value : new Date(value).getTime();
}

// API rows are snake_case with 0/1 flags; the app has always used camelCase
// booleans for this shape (TablesPage, TableManagementPage, OrderPage), so
// every consumer keeps working unchanged as long as this mapping stays in sync.
function mapTable(row) {
  const table = {
    id: row.id,
    name: row.name,
    status: row.status,
    available: row.available !== 0,
  };
  if (row.capacity != null) table.capacity = row.capacity;
  const amount = Number(row.current_amount);
  if (amount) table.amount = amount;
  const occupiedSince = toEpoch(row.occupied_since);
  if (occupiedSince != null) table.occupiedSince = occupiedSince;
  if (row.merged_with?.length) table.mergedWith = row.merged_with;
  return table;
}

function mapSection(row, tables) {
  return {
    id: row.id,
    name: row.name,
    orderType: row.order_type,
    available: row.available !== 0,
    tables,
  };
}

export function TableProvider({ children }) {
  const [sections, setSections] = useState([]);
  // Only true until the very first load completes — the background poll and
  // post-mutation refreshes shouldn't re-flash a full loading state.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function refresh() {
    return Promise.all([getTableSections(), getTables()])
      .then(([sectionsRes, tablesRes]) => {
        const tablesBySection = {};
        tablesRes.data.forEach((row) => {
          (tablesBySection[row.section_id] ??= []).push(mapTable(row));
        });
        setSections(sectionsRes.data.map((row) => mapSection(row, tablesBySection[row.id] || [])));
      })
      .catch(() => {
        // Backend unreachable — leave the list empty rather than show stale data.
      });
  }

  async function addSection(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createTableSection({ name: trimmed });
    await refresh();
  }

  async function renameSection(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const section = sections.find((s) => s.name === oldName);
    if (!section) return;
    await updateTableSection(section.id, { name: trimmed });
    await refresh();
  }

  async function setSectionOrderType(sectionName, orderType) {
    const section = sections.find((s) => s.name === sectionName);
    if (!section) return;
    await updateTableSection(section.id, { order_type: orderType });
    await refresh();
  }

  async function deleteSection(name) {
    const section = sections.find((s) => s.name === name);
    if (!section) return;
    await deleteTableSection(section.id);
    await refresh();
  }

  async function toggleSectionAvailability(name) {
    const section = sections.find((s) => s.name === name);
    if (!section) return;
    await toggleTableSectionAvailability(section.id);
    await refresh();
  }

  async function addTable(sectionName, tableName, capacity) {
    const trimmed = tableName.trim();
    if (!trimmed) return;
    const section = sections.find((s) => s.name === sectionName);
    if (!section) return;
    await apiCreateTable(section.id, { name: trimmed, ...(capacity ? { capacity: Number(capacity) } : {}) });
    await refresh();
  }

  async function updateTable(sectionName, tableId, patch) {
    const { status, amount, occupiedSince, mergedWith, name, capacity } = patch;
    const calls = [];

    if (status !== undefined || amount !== undefined || occupiedSince !== undefined) {
      const body = {};
      if (status !== undefined) body.status = status;
      if (amount !== undefined) body.current_amount = amount;
      if (occupiedSince !== undefined) body.occupied_since = occupiedSince;
      calls.push(updateTableStatus(tableId, body));
    }
    if (mergedWith !== undefined) {
      calls.push(updateTableMerge(tableId, mergedWith));
    }
    if (name !== undefined || capacity !== undefined) {
      const body = {};
      if (name !== undefined) body.name = name;
      if (capacity !== undefined) body.capacity = capacity;
      calls.push(apiUpdateTable(tableId, body));
    }

    await Promise.all(calls);
    await refresh();
  }

  async function removeTable(sectionName, tableId) {
    await apiDeleteTable(tableId);
    await refresh();
  }

  async function toggleTableAvailability(sectionName, tableId) {
    await apiToggleTableAvailability(tableId);
    await refresh();
  }

  return (
    <TableContext.Provider
      value={{
        sections,
        loading,
        addSection,
        renameSection,
        deleteSection,
        toggleSectionAvailability,
        setSectionOrderType,
        addTable,
        updateTable,
        removeTable,
        toggleTableAvailability,
        // Exposed so pages that drive table status as a side effect of
        // another API call (order/tables/status/kots) — not through
        // updateTable — can pull the latest table state after that call.
        refreshTables: refresh,
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
