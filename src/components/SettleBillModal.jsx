import React, { useState } from 'react';
import { IconCheck } from './icons.jsx';

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Hybrid'];
const HYBRID_MODES = ['UPI', 'Cash', 'Card'];

export default function SettleBillModal({ tableName, items, total, onClose, onConfirm, onDone }) {
  const [method, setMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState(() => (total ?? 0).toFixed(2));
  const [hybridAmounts, setHybridAmounts] = useState({ UPI: '', Cash: '', Card: '' });
  const [tip, setTip] = useState('');
  const [settled, setSettled] = useState(false);

  const hybridTotal = HYBRID_MODES.reduce((sum, m) => sum + (Number(hybridAmounts[m]) || 0), 0);
  const tipAmount = Number(tip) || 0;

  function updateHybridAmount(mode, value) {
    setHybridAmounts((prev) => ({ ...prev, [mode]: value }));
  }

  function handleSave() {
    const payload =
      method === 'Hybrid'
        ? {
            method,
            amounts: HYBRID_MODES.reduce((acc, m) => ({ ...acc, [m]: Number(hybridAmounts[m]) || 0 }), {}),
            amountReceived: hybridTotal,
            tip: tipAmount,
          }
        : { method, amountReceived: Number(amountReceived) || 0, tip: tipAmount };
    onConfirm(payload);
    setSettled(true);
  }

  function handleDone() {
    (onDone || onClose)?.();
  }

  if (settled) {
    return (
      <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-md w-80 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
            <IconCheck className="w-7 h-7 text-sage" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-1">Bill Settled!</h3>
          <p className="text-sm text-ink-soft mb-1">
            ₹{(total ?? 0).toFixed(2)} received via {method}
            {tipAmount > 0 ? ` + ₹${tipAmount.toFixed(2)} tip` : ''}.
          </p>
          {tableName && <p className="text-xs text-ink-soft mb-4">{tableName} is now free.</p>}
          <button
            onClick={handleDone}
            className="w-full bg-rust text-white text-sm font-semibold py-2.5 rounded-md hover:bg-rust/90 mt-3"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-md w-80 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Settle Bill{tableName ? ` — ${tableName}` : ''}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="text-sm space-y-1 mb-3 max-h-40 overflow-y-auto">
          {(items || []).map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{item.qty} x {item.name}</span>
              <span>₹{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          {(!items || items.length === 0) && (
            <p className="text-ink-soft text-xs">No items on this order.</p>
          )}
        </div>

        <div className="border-t border-line pt-3 mb-4 flex justify-between font-semibold text-sm">
          <span>Amount Due</span>
          <span>₹{(total ?? 0).toFixed(2)}</span>
        </div>

        <div className="mb-3">
          <div className="text-xs font-medium text-ink-soft mb-1.5">Payment Mode</div>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                  method === m ? 'bg-navy text-white border-navy' : 'border-line text-ink-soft hover:bg-line/40'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {method === 'Hybrid' ? (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2">
              {HYBRID_MODES.map((m) => (
                <div key={m}>
                  <label className="block text-[11px] font-medium text-ink-soft mb-1">{m}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hybridAmounts[m]}
                    onChange={(e) => updateHybridAmount(m, e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-line rounded-md px-2 py-1.5 text-xs text-center outline-none"
                  />
                </div>
              ))}
            </div>
            <div
              className={`flex justify-between text-xs pt-2 ${
                hybridTotal === Number((total ?? 0).toFixed(2)) ? 'text-sage' : 'text-ink-soft'
              }`}
            >
              <span>Entered</span>
              <span className="font-mono">₹{hybridTotal.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Amount Received</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Tip (optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="0.00"
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-rust text-white text-sm font-semibold py-2.5 rounded-md hover:bg-rust/90"
        >
          Save &amp; Settle
        </button>
      </div>
    </div>
  );
}
