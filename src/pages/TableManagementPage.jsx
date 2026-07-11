import React, { useState } from 'react';
import { useTables } from '../context/TableContext.jsx';
import { IconPlus, IconTrash } from '../components/icons.jsx';

export default function TableManagementPage() {
  const { sections, addSection, renameSection, deleteSection } = useTables();
  const [newSection, setNewSection] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [editValue, setEditValue] = useState('');

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Table &amp; Floor Management</h1>
      </div>

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
        {sections.map((section) => (
          <div key={section.name} className="ticket-card bg-white p-4">
            <div className="flex items-center justify-between mb-3">
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
                  className="font-display font-semibold hover:underline"
                >
                  {section.name}
                </button>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-soft font-mono">
                  {section.tables.length} table{section.tables.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={() => deleteSection(section.name)}
                  className="text-rust hover:text-rust/80"
                  aria-label={`Delete section ${section.name}`}
                  title="Deletes this section and all its tables"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            <SectionTables sectionName={section.name} tables={section.tables} />
          </div>
        ))}
        {sections.length === 0 && <p className="text-sm text-ink-soft">No sections yet.</p>}
      </div>
    </div>
  );
}

function SectionTables({ sectionName, tables }) {
  const { addTable, updateTable, removeTable } = useTables();
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [editingTable, setEditingTable] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

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

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between gap-2 border border-line rounded-md px-2.5 py-1.5"
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
                className="text-xs font-medium text-left hover:underline truncate"
              >
                {table.name}
                {table.capacity ? <span className="text-ink-soft"> · {table.capacity} pax</span> : null}
              </button>
            )}
            <button
              onClick={() => removeTable(sectionName, table.id)}
              className="text-rust hover:text-rust/80 shrink-0"
              aria-label={`Delete ${table.name}`}
            >
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
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
    </div>
  );
}
