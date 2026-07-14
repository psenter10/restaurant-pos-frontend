import React, { useEffect, useState } from 'react';
import { useKots } from '../context/KotContext.jsx';
import { IconChevronDown, IconReceipt } from '../components/icons.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

const TABS = [
  { status: 'new', title: 'New KOT', dot: 'bg-rust' },
  { status: 'preparing', title: 'Preparing KOT', dot: 'bg-amber' },
  { status: 'completed', title: 'Completed KOT', dot: 'bg-sage' },
];

// Live hh:mm:ss stopwatch — same format as the Table View's occupied timer.
function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

// Static "how long it took" once a KOT is completed — no more ticking.
function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function KotCard({ kot, now, onRequestAction }) {
  const [itemsOpen, setItemsOpen] = useState(false);

  return (
    <div className="ticket-card bg-white p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-display font-semibold">{kot.tableName}</span>
        <span className="text-xs font-mono text-ink-soft">KOT #{kot.kotNo}</span>
      </div>
      <div className="text-xs text-ink-soft mb-2">
        Waiter: <span className="font-medium text-ink">{kot.waiter || '-'}</span>
        {kot.orderType && <span> · {kot.orderType}</span>}
      </div>

      {kot.note && (
        <div className="text-xs bg-amber-light text-ink rounded-md px-2.5 py-1.5 mb-2">
          <span className="font-semibold">Note:</span> {kot.note}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-ink-soft mb-2 bg-line/40 rounded-full px-2.5 py-1 w-fit">
        {kot.status === 'completed'
          ? `Took ${formatDuration(kot.completedAt - kot.createdAt)}`
          : formatElapsed(now - kot.createdAt)}
      </div>

      <button
        type="button"
        onClick={() => setItemsOpen((v) => !v)}
        className="flex items-center justify-between w-full text-xs font-medium text-navy border border-line rounded-md px-2.5 py-1.5 hover:bg-line/40"
      >
        <span>Items ({kot.items.length})</span>
        <IconChevronDown className={`w-3.5 h-3.5 transition-transform ${itemsOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          itemsOpen ? 'max-h-96 mt-2' : 'max-h-0'
        }`}
      >
        <ul className="text-sm space-y-1 pb-1">
          {kot.items.map((item, idx) => (
            <li key={idx}>
              <span className="font-mono">{item.qty}x</span> {item.name}
              {item.notes && <span className="text-ink-soft italic"> — {item.notes}</span>}
            </li>
          ))}
        </ul>
      </div>

      {kot.status !== 'completed' && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => onRequestAction(kot.status === 'new' ? 'preparing' : 'completed', kot)}
            className={`text-xs font-semibold text-white rounded-md py-2 transition-colors ${
              kot.status === 'new' ? 'bg-amber hover:bg-amber/90' : 'bg-sage hover:bg-sage/90'
            }`}
          >
            Mark as {kot.status === 'new' ? 'Preparing' : 'Completed'}
          </button>
          <button
            onClick={() => onRequestAction('cancel', kot)}
            className="text-xs font-semibold text-white bg-rust hover:bg-rust/90 rounded-md py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const CONFIRM_COPY = {
  preparing: {
    title: 'Mark KOT as Preparing?',
    message: 'This moves the ticket to the Preparing KOT tab and keeps its timer running.',
    confirmLabel: 'Mark as Preparing',
    danger: false,
  },
  completed: {
    title: 'Mark KOT as Completed?',
    message: 'This moves the ticket to the Completed KOT tab and stops its timer.',
    confirmLabel: 'Mark as Completed',
    danger: false,
  },
  cancel: {
    title: 'Cancel this KOT?',
    message: 'The ticket will be removed from the Kitchen Display. This cannot be undone.',
    confirmLabel: 'Yes, Cancel KOT',
    danger: true,
  },
};

export default function KotPage() {
  const { kots, markPreparing, markCompleted, cancelKot } = useKots();
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState('new');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'preparing' | 'completed' | 'cancel', kot }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visibleKots = kots.filter((k) => k.status === activeTab);

  function runConfirmedAction() {
    if (!confirmAction) return;
    const { type, kot } = confirmAction;
    if (type === 'preparing') markPreparing(kot.id);
    else if (type === 'completed') markCompleted(kot.id);
    else if (type === 'cancel') cancelKot(kot.id);
    setConfirmAction(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Kitchen Display</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-line mb-6">
        {TABS.map(({ status, title, dot }) => {
          const count = kots.filter((k) => k.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === status ? 'border-navy text-navy' : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <span className={`status-dot ${dot}`} />
              {title}
              <span className="text-xs text-ink-soft font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {visibleKots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center py-24">
          <IconReceipt className="w-14 h-14 text-line" />
          <div className="font-medium text-ink">No KOT Found</div>
          <div className="text-xs text-ink-soft">There are no tickets in this tab right now.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleKots.map((kot) => (
            <KotCard key={kot.id} kot={kot} now={now} onRequestAction={(type, k) => setConfirmAction({ type, kot: k })} />
          ))}
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title={CONFIRM_COPY[confirmAction.type].title}
          message={CONFIRM_COPY[confirmAction.type].message}
          confirmLabel={CONFIRM_COPY[confirmAction.type].confirmLabel}
          danger={CONFIRM_COPY[confirmAction.type].danger}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
