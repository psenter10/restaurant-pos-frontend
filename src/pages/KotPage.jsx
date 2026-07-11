import React from 'react';
import usePolling from '../hooks/usePolling.js';
import { getPendingKots, updateKotStatus } from '../services/api.js';

const PLACEHOLDER_KOTS = [
  {
    id: 101,
    tableName: 'Table 2',
    status: 'pending',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Paneer Tikka', qty: 2 },
      { name: 'Masala Chai', qty: 2, notes: 'less sugar' },
    ],
  },
  {
    id: 102,
    tableName: 'Table 5',
    status: 'preparing',
    createdAt: new Date().toISOString(),
    items: [{ name: 'Butter Chicken', qty: 1 }],
  },
];

const STATUS_LABEL = { pending: 'New', preparing: 'Preparing', ready: 'Ready' };
const STATUS_COLOR = { pending: 'bg-rust-light', preparing: 'bg-amber-light', ready: 'bg-sage-light' };

export default function KotPage() {
  const { data, error } = usePolling(async () => {
    try {
      const res = await getPendingKots();
      return res.data;
    } catch {
      return PLACEHOLDER_KOTS; // fallback so the screen is usable before the API exists
    }
  }, 4000);

  const kots = data || PLACEHOLDER_KOTS;

  async function advanceStatus(kot) {
    const next = kot.status === 'pending' ? 'preparing' : 'ready';
    try {
      await updateKotStatus(kot.id, next);
    } catch {
      // API not connected yet in local dev — ignore
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Kitchen Display</h1>
        <span className="text-xs text-ink-soft font-mono">
          {error ? 'Polling paused (API unreachable)' : 'Auto-refreshing every 4s'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kots.map((kot) => (
          <div key={kot.id} className={`ticket-card p-4 ${STATUS_COLOR[kot.status]}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold">{kot.tableName}</span>
              <span className="text-xs font-mono uppercase tracking-wide">
                {STATUS_LABEL[kot.status]}
              </span>
            </div>
            <ul className="text-sm space-y-1 mb-3">
              {kot.items.map((item, idx) => (
                <li key={idx}>
                  <span className="font-mono">{item.qty}x</span> {item.name}
                  {item.notes && <span className="text-ink-soft italic"> — {item.notes}</span>}
                </li>
              ))}
            </ul>
            {kot.status !== 'ready' && (
              <button onClick={() => advanceStatus(kot)} className="btn-secondary text-xs w-full">
                Mark as {kot.status === 'pending' ? 'Preparing' : 'Ready'}
              </button>
            )}
          </div>
        ))}
        {kots.length === 0 && (
          <p className="text-sm text-ink-soft">No active KOTs right now.</p>
        )}
      </div>
    </div>
  );
}
