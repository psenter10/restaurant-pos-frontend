import React, { useState } from 'react';
import { useTables } from '../context/TableContext.jsx';
import { IconPlus, IconTrash } from '../components/icons.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import StatRow from '../components/StatRow.jsx';

const SECTION_ORDER_TYPES = ['Dine In', 'Delivery'];

export default function TableManagementPage() {
  const { sections, addSection, renameSection, deleteSection, toggleSectionAvailability, setSectionOrderType } =
    useTables();
  const [newSection, setNewSection] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete-section' | 'deactivate-section', name }

  const allTables = sections.flatMap((s) => s.tables);
  const availableTables = allTables.filter((t) => t.available !== false).length;

  function handleAddSection(e) {
    e.preventDefault();
    if (!newSection.trim()) return;
    addSection(newSection);
    setNewSection('');
  }

  function startEdit(name) {
    setEditingSection(name);
    setEditValue(name);
  }

  function commitEdit() {
    if (editingSection && editValue.trim() && editValue.trim() !== editingSection) {
      renameSection(editingSection, editValue.trim());
    }
    setEditingSection(null);
  }

  function handleToggleSection(section) {
    if (section.available === false) {
      toggleSectionAvailability(section.name);
    } else {
      setConfirmAction({ type: 'deactivate-section', name: section.name });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete-section') deleteSection(confirmAction.name);
    else if (confirmAction.type === 'deactivate-section') toggleSectionAvailability(confirmAction.name);
    setConfirmAction(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Table &amp; Floor Management</h1>
      </div>

      <StatRow
        stats={[
          { label: 'Total Sections', value: sections.length },
          { label: 'Total Tables', value: allTables.length },
          { label: 'Available', value: availableTables, tone: 'text-sage' },
          { label: 'Unavailable', value: allTables.length - availableTables, tone: 'text-rust' },
        ]}
      />

      <form onSubmit={handleAddSection} className="flex items-center gap-2 mb-6 max-w-lg">
        <input
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          placeholder="New section name (e.g. Rooftop)"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90"
        >
          Add Section
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section) => {
          const sectionAvailable = section.available !== false;
          const sectionAvailableTables = section.tables.filter((t) => t.available !== false).length;
          return (
            <div key={section.name} className={`ticket-card p-4 ${sectionAvailable ? 'bg-white' : 'bg-line/20'}`}>
              <div className="flex items-center justify-between mb-1">
                {editingSection === section.name ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="border border-line rounded-md px-2 py-1 text-sm font-semibold outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(section.name)}
                    className={`font-display font-semibold hover:underline ${sectionAvailable ? '' : 'text-ink-soft'}`}
                  >
                    {section.name}
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={sectionAvailable}
                    onChange={() => handleToggleSection(section)}
                    label={sectionAvailable ? 'Available' : 'Unavailable'}
                  />
                  <button
                    onClick={() => setConfirmAction({ type: 'delete-section', name: section.name })}
                    className="text-rust hover:text-rust/80"
                    aria-label={`Delete section ${section.name}`}
                    title="Deletes this section and all its tables"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-ink-soft font-mono mb-3">
                {section.tables.length} table{section.tables.length === 1 ? '' : 's'} · {sectionAvailableTables}{' '}
                available · {section.tables.length - sectionAvailableTables} unavailable
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-ink-soft">Table Type</span>
                <div className="flex border border-line rounded-md overflow-hidden text-xs">
                  {SECTION_ORDER_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSectionOrderType(section.name, type)}
                      className={`px-2.5 py-1 transition-colors ${
                        (section.orderType || 'Dine In') === type
                          ? 'bg-navy text-white'
                          : 'bg-white text-ink-soft hover:bg-line/40'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <SectionTables sectionName={section.name} tables={section.tables} />
            </div>
          );
        })}
        {sections.length === 0 && <p className="text-sm text-ink-soft">No sections yet.</p>}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete-section' ? 'Delete section?' : 'Mark section unavailable?'}
          message={
            confirmAction.type === 'delete-section'
              ? `"${confirmAction.name}" and all its tables will be permanently removed.`
              : `"${confirmAction.name}" and all its tables will be hidden from the Table View until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete-section' ? 'Delete' : 'Mark Unavailable'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}

function SectionTables({ sectionName, tables }) {
  const { addTable, updateTable, removeTable, toggleTableAvailability } = useTables();
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [editingTable, setEditingTable] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete-table' | 'deactivate-table', table }

  function handleAddTable(e) {
    e.preventDefault();
    if (!newTableName.trim()) return;
    addTable(sectionName, newTableName, newTableCapacity);
    setNewTableName('');
    setNewTableCapacity('');
  }

  function startEdit(table) {
    setEditingTable(table.id);
    setEditValue(table.name);
    setEditCapacity(table.capacity ?? '');
  }

  function commitEdit() {
    if (editingTable) {
      updateTable(sectionName, editingTable, {
        name: editValue.trim() || undefined,
        capacity: editCapacity ? Number(editCapacity) : undefined,
      });
    }
    setEditingTable(null);
  }

  function handleToggleTable(table) {
    if (table.available === false) {
      toggleTableAvailability(sectionName, table.id);
    } else {
      setConfirmAction({ type: 'deactivate-table', table });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete-table') removeTable(sectionName, confirmAction.table.id);
    else toggleTableAvailability(sectionName, confirmAction.table.id);
    setConfirmAction(null);
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {tables.map((table) => {
          const available = table.available !== false;
          return (
            <div
              key={table.id}
              className={`flex items-center justify-between gap-2 border rounded-md px-2.5 py-1.5 ${
                available ? 'border-line' : 'border-line bg-line/30'
              }`}
            >
              {editingTable === table.id ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="w-16 border border-line rounded px-1 py-0.5 text-xs outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    placeholder="pax"
                    className="w-12 border border-line rounded px-1 py-0.5 text-xs outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => startEdit(table)}
                  className={`text-xs font-medium text-left hover:underline truncate ${available ? '' : 'text-ink-soft'}`}
                >
                  {table.name}
                  {table.capacity ? <span className="text-ink-soft"> · {table.capacity} pax</span> : null}
                </button>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <ToggleSwitch checked={available} onChange={() => handleToggleTable(table)} />
                <button
                  onClick={() => setConfirmAction({ type: 'delete-table', table })}
                  className="text-rust hover:text-rust/80"
                  aria-label={`Delete ${table.name}`}
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {tables.length === 0 && <p className="text-xs text-ink-soft col-span-full">No tables in this section.</p>}
      </div>

      <form onSubmit={handleAddTable} className="flex items-center gap-2">
        <input
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
          placeholder="Table name"
          className="flex-1 border border-line rounded-md px-2.5 py-1.5 text-xs outline-none"
        />
        <input
          type="number"
          min="1"
          value={newTableCapacity}
          onChange={(e) => setNewTableCapacity(e.target.value)}
          placeholder="Pax"
          className="w-16 border border-line rounded-md px-2.5 py-1.5 text-xs outline-none"
        />
        <button
          type="submit"
          className="flex items-center gap-1 text-xs text-navy font-medium hover:underline whitespace-nowrap"
        >
          <IconPlus className="w-3.5 h-3.5" /> Add Table
        </button>
      </form>

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete-table' ? 'Delete table?' : 'Mark table unavailable?'}
          message={
            confirmAction.type === 'delete-table'
              ? `"${confirmAction.table.name}" will be permanently removed.`
              : `"${confirmAction.table.name}" will be hidden from the Table View until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete-table' ? 'Delete' : 'Mark Unavailable'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
