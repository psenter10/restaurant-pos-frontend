import React, { useMemo, useState } from 'react';
import { useWaiters } from '../context/WaiterContext.jsx';
import { getWaiterStats, getWaiterBadges } from '../services/waiterStatsMock.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import StatRow from '../components/StatRow.jsx';
import IconTextButton from '../components/IconTextButton.jsx';
import { IconPlus, IconTrash, IconEdit, IconSearch, IconChartBar } from '../components/icons.jsx';

const BADGE_STYLES = {
  'Top Server': 'bg-gold text-ink',
  '2nd Most Server': 'bg-line text-ink-soft',
  '3rd Most Server': 'bg-amber-light text-amber',
};

function AddWaiterModal({ onClose, onSave }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[380px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Add Waiter</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Waiter Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rohit"
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button type="submit" className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
            Add Waiter
          </button>
        </div>
      </form>
    </div>
  );
}

function WaiterStatsModal({ waiter, badge, onClose }) {
  const stats = getWaiterStats(waiter.name);
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-md w-[440px] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-lg">{waiter.name}</h3>
            {badge && (
              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[badge]}`}>
                {badge}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-line">
                <th className="py-2 font-medium">Metric</th>
                <th className="py-2 font-medium text-right">Today</th>
                <th className="py-2 font-medium text-right">All Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60">
                <td className="py-2">Orders Served</td>
                <td className="py-2 text-right font-mono">{stats.ordersToday}</td>
                <td className="py-2 text-right font-mono">{stats.ordersAllTime}</td>
              </tr>
              <tr className="border-b border-line/60">
                <td className="py-2">Total Sales</td>
                <td className="py-2 text-right font-mono">₹{stats.salesToday.toLocaleString('en-IN')}</td>
                <td className="py-2 text-right font-mono">₹{stats.salesAllTime.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-2">Total Tips</td>
                <td className="py-2 text-right font-mono">₹{stats.tipsToday.toLocaleString('en-IN')}</td>
                <td className="py-2 text-right font-mono">₹{stats.tipsAllTime.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminWaitersPage() {
  const { waiters, addWaiter, renameWaiter, removeWaiter, toggleWaiterActive } = useWaiters();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [statsTarget, setStatsTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', waiter }

  const badges = useMemo(() => getWaiterBadges(waiters), [waiters]);
  const activeCount = waiters.filter((w) => w.active !== false).length;
  const filtered = search.trim()
    ? waiters.filter((w) => w.name.toLowerCase().includes(search.trim().toLowerCase()))
    : waiters;

  function startEdit(waiter) {
    setEditingWaiter(waiter.id);
    setEditValue(waiter.name);
  }

  function commitEdit() {
    if (editingWaiter && editValue.trim()) {
      renameWaiter(editingWaiter, editValue.trim());
    }
    setEditingWaiter(null);
  }

  function handleToggleActive(waiter) {
    if (waiter.active === false) {
      toggleWaiterActive(waiter.id);
    } else {
      setConfirmAction({ type: 'deactivate', waiter });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') removeWaiter(confirmAction.waiter.id);
    else toggleWaiterActive(confirmAction.waiter.id);
    setConfirmAction(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Waiter Management</h1>
      </div>
      <p className="text-sm text-ink-soft mb-4 max-w-2xl">
        These names populate the Waiter dropdown on the Order page for KOT and bill attribution.
      </p>

      <StatRow
        stats={[
          { label: 'Total Waiters', value: waiters.length },
          { label: 'Active', value: activeCount, tone: 'text-sage' },
          { label: 'Inactive', value: waiters.length - activeCount, tone: 'text-rust' },
        ]}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
          <IconSearch className="w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search waiters"
            className="outline-none bg-transparent text-sm w-full"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 whitespace-nowrap"
        >
          <IconPlus className="w-4 h-4" /> Add Waiter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((waiter) => {
          const active = waiter.active !== false;
          const badge = badges[waiter.name];
          return (
            <div key={waiter.id} className={`ticket-card p-3 ${active ? 'bg-white' : 'bg-line/20'}`}>
              <div className="flex items-center justify-between gap-2">
                {editingWaiter === waiter.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="flex-1 border border-line rounded-md px-2 py-1 text-sm outline-none"
                  />
                ) : (
                  <span className={`text-sm font-medium truncate ${active ? '' : 'text-ink-soft'}`}>{waiter.name}</span>
                )}
                <ToggleSwitch checked={active} onChange={() => handleToggleActive(waiter)} />
              </div>

              {badge && (
                <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[badge]}`}>
                  {badge}
                </span>
              )}

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-line/60 flex-wrap">
                <IconTextButton icon={IconChartBar} tone="navy" onClick={() => setStatsTarget(waiter)}>
                  View Stats
                </IconTextButton>
                <IconTextButton icon={IconEdit} tone="navy" onClick={() => startEdit(waiter)}>
                  Edit
                </IconTextButton>
                <IconTextButton
                  icon={IconTrash}
                  tone="rust"
                  onClick={() => setConfirmAction({ type: 'delete', waiter })}
                >
                  Delete
                </IconTextButton>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-ink-soft">No waiters match.</p>}
      </div>

      {showAddModal && <AddWaiterModal onClose={() => setShowAddModal(false)} onSave={addWaiter} />}

      {statsTarget && (
        <WaiterStatsModal waiter={statsTarget} badge={badges[statsTarget.name]} onClose={() => setStatsTarget(null)} />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete' ? 'Delete waiter?' : 'Deactivate waiter?'}
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.waiter.name}" will be permanently removed from the waiter list.`
              : `"${confirmAction.waiter.name}" will no longer appear in the Order page's Waiter dropdown until reactivated.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : 'Deactivate'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
