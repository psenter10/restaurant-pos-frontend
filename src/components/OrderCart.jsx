import React, { useEffect, useRef, useState } from 'react';
import { IconEdit, IconPlate, IconReceipt, IconMerge } from './icons.jsx';

const TAX_RATE = 0.05; // adjust to your GST slab
const ORDER_TYPES = ['Dine In', 'Delivery', 'Pick Up'];
const TABLE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const WAITERS = ['Ramesh', 'Suresh', 'Anita', 'Kavya', 'Vikram'];

export default function OrderCart({ tableId, items, onRemove, onQtyChange, onSendKot, onSettle }) {
  const [orderType, setOrderType] = useState('Dine In');

  const [orderNo] = useState(() => Math.floor(Math.random() * 90) + 10);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergedTables, setMergedTables] = useState([]);
  const [pax, setPax] = useState(1);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [waiter, setWaiter] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState('');
  const mergeRef = useRef(null);
  const noteRef = useRef(null);

  function toggleMergedTable(table) {
    setMergedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  }

  useEffect(() => {
    if (!mergeOpen) return;
    function handleClickOutside(e) {
      if (mergeRef.current && !mergeRef.current.contains(e.target)) {
        setMergeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mergeOpen]);

  useEffect(() => {
    if (!noteOpen) return;
    function handleClickOutsideNote(e) {
      if (noteRef.current && !noteRef.current.contains(e.target)) {
        setNoteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideNote);
    return () => document.removeEventListener('mousedown', handleClickOutsideNote);
  }, [noteOpen]);

  const tableLabel =
    mergedTables.length > 0 ? `Table ${tableId} & ${mergedTables.join(' & ')}` : `Table ${tableId}`;

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const rawDiscount =
    discountType === 'percent'
      ? subtotal * (Number(discountValue || 0) / 100)
      : Number(discountValue || 0);
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;
  const hasItems = items.length > 0;

  return (
    <div className="w-[420px] shrink-0 bg-white border-l border-line flex flex-col h-full">
      <div className="grid grid-cols-3 text-sm font-medium">
        {ORDER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`py-2.5 transition-colors ${
              orderType === type ? 'bg-rust text-white' : 'bg-ink text-white/70 hover:bg-ink/90'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="px-4 py-2.5 border-b border-line space-y-2.5">
        <button
          onClick={() => setCustomerOpen((v) => !v)}
          className="text-sm text-navy font-medium hover:underline"
        >
          + Add Customer Details
        </button>

        {customerOpen && (
          <div className="flex gap-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="flex-1 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone Number"
              className="flex-1 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <IconReceipt className="w-4 h-4 text-ink-soft" />
            Order #{orderNo}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-soft border border-line rounded-md px-2.5 py-1.5">
              {tableLabel}
            </span>

            <div className="relative" ref={mergeRef}>
              <button
                onClick={() => setMergeOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium border border-line rounded-md px-2.5 py-1.5 hover:bg-line/40"
              >
                <IconMerge className="w-3.5 h-3.5" />
                Merge Tables
              </button>
              {mergeOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-line rounded-md shadow-md z-20 max-h-40 overflow-y-auto">
                  {TABLE_OPTIONS.map((n) => (
                    <label key={n} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-line/40">
                      <input
                        type="checkbox"
                        checked={mergedTables.includes(n)}
                        onChange={() => toggleMergedTable(n)}
                      />
                      Table {n}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={noteRef}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-soft">Pax</span>
              <input
                type="number"
                min="1"
                value={pax}
                onChange={(e) => setPax(e.target.value)}
                className="w-14 border border-line rounded-md px-2 py-1 text-sm text-center outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNoteOpen((v) => !v)}
                className="border border-line rounded-md p-1.5 hover:bg-line/40"
                aria-label="Order note"
              >
                <IconEdit className="w-4 h-4 text-ink-soft" />
              </button>
              <select
                value={waiter}
                onChange={(e) => setWaiter(e.target.value)}
                className="border border-line rounded-md px-2 py-1.5 text-sm outline-none"
              >
                <option value="">Select Waiter</option>
                {WAITERS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {noteOpen && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Order note..."
              rows={2}
              autoFocus
              className="w-full border border-line rounded-md px-2.5 py-1.5 text-sm outline-none resize-none mt-2.5"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_88px_76px] gap-2 px-4 py-2 text-[11px] font-semibold text-ink-soft uppercase tracking-wide border-b border-line">
        <span>Items</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Price</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!hasItems ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <IconPlate className="w-14 h-14 text-line" />
            <div className="font-medium text-ink">No Item Selected</div>
            <div className="text-xs text-ink-soft">Please Select Item from Left Menu Item</div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_88px_76px] gap-2 items-center text-sm">
                <span className="truncate">{item.name}</span>
                <div className="flex items-center justify-center border border-line rounded-md overflow-hidden">
                  <button
                    onClick={() => onQtyChange(item.id, -1)}
                    className="w-6 h-6 flex items-center justify-center text-ink-soft hover:bg-line/60"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-xs border-x border-line">{item.qty}</span>
                  <button
                    onClick={() => onQtyChange(item.id, 1)}
                    className="w-6 h-6 flex items-center justify-center text-ink-soft hover:bg-line/60"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="font-mono">₹{(item.qty * item.price).toFixed(2)}</span>
                  <button onClick={() => onRemove(item.id)} className="text-rust text-xs hover:underline">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-line space-y-3">
        <div className="rounded-md bg-line/30 border border-line px-4 py-3 text-sm">
          <div className="flex justify-between text-ink-soft py-0.5">
            <span>Item(s)</span>
            <span className="font-mono">{itemCount}</span>
          </div>
          <div className="flex justify-between text-ink-soft py-0.5">
            <span>Sub Total</span>
            <span className="font-mono">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between py-0.5 gap-2">
            <span className="text-ink-soft">Discount</span>
            <div className="flex items-center gap-1.5">
              <div className="flex border border-line rounded-md overflow-hidden text-xs">
                <button
                  onClick={() => setDiscountType('flat')}
                  className={`px-2 py-1 ${
                    discountType === 'flat' ? 'bg-navy text-white' : 'bg-white text-ink-soft hover:bg-line/40'
                  }`}
                >
                  ₹
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`px-2 py-1 border-l border-line ${
                    discountType === 'percent' ? 'bg-navy text-white' : 'bg-white text-ink-soft hover:bg-line/40'
                  }`}
                >
                  %
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="w-16 border border-line rounded-md px-2 py-1 text-xs text-center outline-none"
              />
            </div>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-rust py-0.5">
              <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
              <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-ink-soft py-0.5">
            <span>GST ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span className="font-mono">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-line">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-mono font-bold text-lg text-amber">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => onSendKot({ orderNo, waiter, orderType, tableLabel })}
            disabled={!hasItems}
            className="bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded disabled:opacity-40"
          >
            KOT &amp; Print
          </button>
          <button
            onClick={() =>
              onSettle({
                subtotal,
                discount: discountAmount,
                tax,
                total,
                print: true,
                orderNo,
                waiter,
                orderType,
                tableLabel,
              })
            }
            disabled={!hasItems}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded disabled:opacity-40"
          >
            Bill &amp; Print
          </button>
        </div>
      </div>
    </div>
  );
}
