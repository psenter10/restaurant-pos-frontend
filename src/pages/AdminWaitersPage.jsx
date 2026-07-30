import React, { useEffect, useState } from 'react';
import { useWaiters } from '../context/WaiterContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import { getWaiterStats } from '../services/api.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a waiter name.');
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
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Rohit"
            className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${error ? 'border-rust' : 'border-line'}`}
          />
          {error && <p className="text-xs text-rust mt-1">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Add Waiter</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function RenameWaiterModal({ waiter, onClose, onSave }) {
  const [name, setName] = useState(waiter.name);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a waiter name.');
      return;
    }
    if (trimmed === waiter.name) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      await onSave(trimmed);
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
          <h3 className="font-display font-semibold text-lg">Rename Waiter</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Waiter Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Rohit"
            className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${error ? 'border-rust' : 'border-line'}`}
          />
          {error && <p className="text-xs text-rust mt-1">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Save Changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function WaiterStatsModal({ waiter, stats, badge, onClose }) {
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

const EMPTY_STATS = {
  ordersToday: 0, salesToday: 0, tipsToday: 0,
  ordersAllTime: 0, salesAllTime: 0, tipsAllTime: 0,
};

export default function AdminWaitersPage() {
  const { waiters, addWaiter, renameWaiter, removeWaiter, toggleWaiterActive } = useWaiters();
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // waiter object
  const [statsTarget, setStatsTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', waiter }
  const [statsById, setStatsById] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    getWaiterStats()
      .then((res) => setStatsById(Object.fromEntries(res.data.map((s) => [s.id, s]))))
      .catch(() => {
        // Backend unreachable — cards just show no stats/badges.
      });
  }, [waiters]);

  const activeCount = waiters.filter((w) => w.active !== false).length;
  const filtered = search.trim()
    ? waiters.filter((w) => w.name.toLowerCase().includes(search.trim().toLowerCase()))
    : waiters;

  async function handleAddWaiter(name) {
    try {
      await addWaiter(name);
      showSuccess('Waiter added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the waiter. Please try again.'));
      throw err;
    }
  }

  async function handleRenameWaiter(newName) {
    try {
      await renameWaiter(renameTarget.id, newName);
      showSuccess('Waiter renamed.');
      setRenameTarget(null);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not rename the waiter. Please try again.'));
      throw err;
    }
  }

  async function handleToggleActive(waiter) {
    if (waiter.active === false) {
      setTogglingId(waiter.id);
      try {
        await toggleWaiterActive(waiter.id);
        showSuccess('Waiter marked active.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the waiter. Please try again.'));
      } finally {
        setTogglingId(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate', waiter });
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete') {
        await removeWaiter(confirmAction.waiter.id);
        showSuccess('Waiter deleted.');
      } else {
        await toggleWaiterActive(confirmAction.waiter.id);
        showSuccess('Waiter marked inactive.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the waiter. Please try again.'));
    }
    setConfirming(false);
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

      <div className="flex items-center justify-between gap-3 mb-4">
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
          const badge = statsById[waiter.id]?.badge;
          return (
            <div key={waiter.id} className={`ticket-card p-3 ${active ? 'bg-white' : 'bg-line/20'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-medium truncate ${active ? '' : 'text-ink-soft'}`}>{waiter.name}</span>
                <ToggleSwitch
                  checked={active}
                  onChange={() => handleToggleActive(waiter)}
                  loading={togglingId === waiter.id}
                />
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
                <IconTextButton icon={IconEdit} tone="navy" onClick={() => setRenameTarget(waiter)}>
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

      {showAddModal && <AddWaiterModal onClose={() => setShowAddModal(false)} onSave={handleAddWaiter} />}

      {renameTarget && (
        <RenameWaiterModal
          waiter={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={handleRenameWaiter}
        />
      )}

      {statsTarget && (
        <WaiterStatsModal
          waiter={statsTarget}
          stats={statsById[statsTarget.id] || EMPTY_STATS}
          badge={statsById[statsTarget.id]?.badge}
          onClose={() => setStatsTarget(null)}
        />
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
          danger={confirmAction.type === 'delete'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
