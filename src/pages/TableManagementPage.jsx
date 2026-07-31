import React, { useEffect, useState } from 'react';
import { useTables } from '../context/TableContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import { IconPlus, IconTrash } from '../components/icons.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import StatRow from '../components/StatRow.jsx';

const SECTION_ORDER_TYPES = ['Dine In', 'Delivery'];

function AddSectionModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a section name.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(name);
    } catch {
      // parent already showed a toast with the reason; keep the modal open to retry
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[380px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Add Section</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Section Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Rooftop"
            className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${error ? 'border-rust' : 'border-line'}`}
          />
          {error && <p className="text-xs text-rust mt-1">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Add Section</SubmitButton>
        </div>
      </form>
    </div>
  );
}

export default function TableManagementPage() {
  const { sections, addSection, renameSection, deleteSection, toggleSectionAvailability, setSectionOrderType, refreshTables } =
    useTables();
  const { showSuccess, showError } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editValue, setEditValue] = useState('');
  // { type: 'delete-section' | 'deactivate-section' | 'rename-section' | 'order-type', name, newName?, orderType? }
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // TableContext is mounted once for the whole app session (POS Tables/Order
  // screens need it too), so without this its one-time initial fetch would
  // go stale across navigating away and back to this page — refetch every
  // time it mounts.
  useEffect(() => {
    refreshTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [togglingSection, setTogglingSection] = useState(null);

  const allTables = sections.flatMap((s) => s.tables);
  const availableTables = allTables.filter((t) => t.available !== false).length;

  async function handleAddSection(name) {
    try {
      await addSection(name);
      showSuccess('Section added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the section. Please try again.'));
      throw err;
    }
  }

  function startEdit(name) {
    setEditingSection(name);
    setEditValue(name);
  }

  function commitEdit() {
    if (!editingSection) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      showError('Section name cannot be empty.');
      return;
    }
    if (trimmed !== editingSection) {
      setConfirmAction({ type: 'rename-section', name: editingSection, newName: trimmed });
    }
    setEditingSection(null);
  }

  async function handleToggleSection(section) {
    if (section.available === false) {
      setTogglingSection(section.name);
      try {
        await toggleSectionAvailability(section.name);
        showSuccess('Section marked available.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the section. Please try again.'));
      } finally {
        setTogglingSection(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate-section', name: section.name });
    }
  }

  function handleSetSectionOrderType(sectionName, orderType) {
    const section = sections.find((s) => s.name === sectionName);
    if (section && (section.orderType || 'Dine In') === orderType) return;
    setConfirmAction({ type: 'order-type', name: sectionName, orderType });
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete-section') {
        await deleteSection(confirmAction.name);
        showSuccess('Section deleted.');
      } else if (confirmAction.type === 'deactivate-section') {
        await toggleSectionAvailability(confirmAction.name);
        showSuccess('Section marked unavailable.');
      } else if (confirmAction.type === 'rename-section') {
        await renameSection(confirmAction.name, confirmAction.newName);
        showSuccess('Section renamed.');
      } else if (confirmAction.type === 'order-type') {
        await setSectionOrderType(confirmAction.name, confirmAction.orderType);
        showSuccess('Table type updated.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the section. Please try again.'));
    }
    setConfirming(false);
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

      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 whitespace-nowrap"
        >
          <IconPlus className="w-4 h-4" /> Add Section
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
                    loading={togglingSection === section.name}
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
                      onClick={() => handleSetSectionOrderType(section.name, type)}
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

      {showAddModal && (
        <AddSectionModal onClose={() => setShowAddModal(false)} onSave={handleAddSection} />
      )}

      {confirmAction && (
        <ConfirmModal
          title={
            {
              'delete-section': 'Delete section?',
              'deactivate-section': 'Mark section unavailable?',
              'rename-section': 'Rename section?',
              'order-type': 'Change table type?',
            }[confirmAction.type]
          }
          message={
            confirmAction.type === 'delete-section'
              ? `"${confirmAction.name}" and all its tables will be permanently removed.`
              : confirmAction.type === 'deactivate-section'
              ? `"${confirmAction.name}" and all its tables will be hidden from the Table View until you turn it back on.`
              : confirmAction.type === 'rename-section'
              ? `Rename "${confirmAction.name}" to "${confirmAction.newName}"?`
              : `Change "${confirmAction.name}" to ${confirmAction.orderType}?`
          }
          confirmLabel={
            {
              'delete-section': 'Delete',
              'deactivate-section': 'Mark Unavailable',
              'rename-section': 'Rename',
              'order-type': 'Change',
            }[confirmAction.type]
          }
          danger={confirmAction.type === 'delete-section'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}

function isValidCapacity(value) {
  if (!value) return true; // capacity is optional
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function AddTableModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [errors, setErrors] = useState({}); // { name, capacity }
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = 'Enter a table name.';
    if (!isValidCapacity(capacity)) next.capacity = 'Capacity must be a positive whole number.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSave(name, capacity);
    } catch {
      // parent already showed a toast with the reason; keep the modal open to retry
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[380px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Add Table</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Table Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Table 12"
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${errors.name ? 'border-rust' : 'border-line'}`}
            />
            {errors.name && <p className="text-xs text-rust mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Capacity (optional)</label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => {
                setCapacity(e.target.value);
                setErrors((prev) => ({ ...prev, capacity: undefined }));
              }}
              placeholder="Pax"
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${errors.capacity ? 'border-rust' : 'border-line'}`}
            />
            {errors.capacity && <p className="text-xs text-rust mt-1">{errors.capacity}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting} tone="navy">Add Table</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function SectionTables({ sectionName, tables }) {
  const { addTable, updateTable, removeTable, toggleTableAvailability } = useTables();
  const { showSuccess, showError } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  // { type: 'delete-table' | 'deactivate-table' | 'edit-table', table, patch? }
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [togglingTableId, setTogglingTableId] = useState(null);

  async function handleAddTable(name, capacity) {
    try {
      await addTable(sectionName, name, capacity);
      showSuccess('Table added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the table. Please try again.'));
      throw err;
    }
  }

  function startEdit(table) {
    setEditingTable(table.id);
    setEditValue(table.name);
    setEditCapacity(table.capacity ?? '');
  }

  function commitEdit() {
    if (!editingTable) return;
    const trimmedName = editValue.trim();
    if (!trimmedName) {
      showError('Table name cannot be empty.');
      return;
    }
    if (!isValidCapacity(editCapacity)) {
      showError('Capacity must be a positive whole number.');
      return;
    }
    const table = tables.find((t) => t.id === editingTable);
    const patch = {
      name: trimmedName,
      capacity: editCapacity ? Number(editCapacity) : undefined,
    };
    const changed = patch.name !== table?.name || patch.capacity !== table?.capacity;
    if (changed) {
      setConfirmAction({ type: 'edit-table', table, patch });
    }
    setEditingTable(null);
  }

  async function handleToggleTable(table) {
    if (table.available === false) {
      setTogglingTableId(table.id);
      try {
        await toggleTableAvailability(sectionName, table.id);
        showSuccess('Table marked available.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the table. Please try again.'));
      } finally {
        setTogglingTableId(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate-table', table });
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete-table') {
        await removeTable(sectionName, confirmAction.table.id);
        showSuccess('Table deleted.');
      } else if (confirmAction.type === 'edit-table') {
        await updateTable(sectionName, confirmAction.table.id, confirmAction.patch);
        showSuccess('Table updated.');
      } else {
        await toggleTableAvailability(sectionName, confirmAction.table.id);
        showSuccess('Table marked unavailable.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the table. Please try again.'));
    }
    setConfirming(false);
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
                <ToggleSwitch
                  checked={available}
                  onChange={() => handleToggleTable(table)}
                  loading={togglingTableId === table.id}
                />
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

      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-1.5 bg-navy text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-navy-light whitespace-nowrap"
      >
        <IconPlus className="w-3.5 h-3.5" /> Add New Table
      </button>

      {showAddModal && (
        <AddTableModal onClose={() => setShowAddModal(false)} onSave={handleAddTable} />
      )}

      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'delete-table'
              ? 'Delete table?'
              : confirmAction.type === 'edit-table'
              ? 'Save changes?'
              : 'Mark table unavailable?'
          }
          message={
            confirmAction.type === 'delete-table'
              ? `"${confirmAction.table.name}" will be permanently removed.`
              : confirmAction.type === 'edit-table'
              ? `Save changes to "${confirmAction.table.name}"?`
              : `"${confirmAction.table.name}" will be hidden from the Table View until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete-table' ? 'Delete' : confirmAction.type === 'edit-table' ? 'Save Changes' : 'Mark Unavailable'}
          danger={confirmAction.type === 'delete-table'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
