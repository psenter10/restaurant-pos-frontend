import React, { useEffect, useRef, useState } from 'react';
import {
  IconEdit,
  IconPlate,
  IconReceipt,
  IconMerge,
  IconChevronDown,
  IconUser,
  IconUsers,
  IconCutlery,
  IconBowl,
  IconCheck,
  IconPrinter,
  IconTrash,
} from './icons.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import Spinner from './Spinner.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useWaiters } from '../context/WaiterContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ORDER_TYPES = ['Dine In', 'Delivery'];
const MODE_BADGES = {
  kot: { label: 'KOT Panel', className: 'bg-slate-700 text-white' },
  bill: { label: 'Billing Panel', className: 'bg-blue-600 text-white' },
  settle: { label: 'Settle Panel', className: 'bg-green-700 text-white' },
};

// Groups consecutive cart lines by which KOT round they were sent under, so
// the Billing panel can show "KOT - {no}  Time - {time}" section headers.
function groupItemsByKot(items) {
  const groups = [];
  let current = null;
  items.forEach((item) => {
    const key = item.kotNo ?? 'unassigned';
    if (!current || current.key !== key) {
      current = { key, kotNo: item.kotNo, kotId: item.kotId, kotTime: item.kotTime, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  });
  return groups;
}

function ItemRow({ item, onQtyChange, onRemove, readOnly }) {
  const lineId = item.lineId ?? item.id;
  return (
    <div className="grid grid-cols-[1fr_88px_76px] gap-2 items-center text-sm">
      <span className="truncate">{item.name}</span>
      {readOnly ? (
        <span className="text-center font-mono text-xs">{item.qty}</span>
      ) : (
        <div className="flex items-center justify-center border border-line rounded-md overflow-hidden">
          <button
            onClick={() => onQtyChange(lineId, -1)}
            className="w-6 h-6 flex items-center justify-center text-ink-soft hover:bg-line/60"
            aria-label={`Decrease ${item.name} quantity`}
          >
            −
          </button>
          <span className="w-6 text-center font-mono text-xs border-x border-line">{item.qty}</span>
          <button
            onClick={() => onQtyChange(lineId, 1)}
            className="w-6 h-6 flex items-center justify-center text-ink-soft hover:bg-line/60"
            aria-label={`Increase ${item.name} quantity`}
          >
            +
          </button>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <span className="font-mono">₹{(item.qty * item.price).toFixed(2)}</span>
        {!readOnly && (
          <button onClick={() => onRemove(lineId)} className="text-rust text-xs hover:underline">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderCart({
  tableId,
  tableName,
  sectionName,
  orderId,
  items,
  loading = false,
  onRemove,
  onQtyChange,
  mode,
  onSaveKot,
  onGenerateBill,
  onCancelOrder,
  onReprintBill,
  onReprintKot,
  onDeleteKot,
  onOpenSettle,
  allTables = [],
  initialMergedWith = [],
  onMergeChange,
  initialOrderType = 'Dine In',
  initialWaiter = '',
  initialPax = '',
}) {
  const { settings } = useSettings();
  const { waiters } = useWaiters();
  const { showError } = useToast();
  const [orderType, setOrderType] = useState(initialOrderType);

  const [activePanel, setActivePanel] = useState(null); // 'table' | 'customer' | 'pax' | 'note' | 'waiter'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergedTables, setMergedTables] = useState(initialMergedWith);
  const [pax, setPax] = useState(initialPax === '' || initialPax == null ? '' : String(initialPax));
  const [note, setNote] = useState('');
  const [waiter, setWaiter] = useState(initialWaiter);
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleteKotTarget, setDeleteKotTarget] = useState(null); // KOT group pending delete confirmation
  const [deletingKot, setDeletingKot] = useState(false);
  const mergeRef = useRef(null);
  const panelRef = useRef(null);
  const itemListRef = useRef(null);

  // initialWaiter/initialPax can arrive after this component's first render
  // (the parent resolves them from the order's own API fetch) — fill them in
  // once they show up, but only if the user hasn't already picked something.
  useEffect(() => {
    if (initialWaiter && !waiter) setWaiter(initialWaiter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWaiter]);
  useEffect(() => {
    if (initialPax !== '' && initialPax != null && pax === '') setPax(String(initialPax));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPax]);

  function toggleMergedTable(id) {
    setMergedTables((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      onMergeChange?.(next);
      return next;
    });
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
    if (!activePanel) return;
    function handleClickOutsidePanel(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setActivePanel(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutsidePanel);
    return () => document.removeEventListener('mousedown', handleClickOutsidePanel);
  }, [activePanel]);

  const mergedNames = allTables.filter((t) => mergedTables.includes(t.id)).map((t) => t.name);
  // Table names can repeat across sections (e.g. "Table 1" in both A/C and
  // Rooftop), so the section is prefixed here — this same label is what
  // prints on the KOT/bill, where the ambiguity would actually matter.
  const tableDisplayName = tableName || tableId;
  const sectionedName = sectionName ? `${sectionName} - ${tableDisplayName}` : tableDisplayName;
  const tableLabel =
    mergedNames.length > 0 ? `${sectionedName} & ${mergedNames.join(' & ')}` : sectionedName;
  const tableNumberBadge = (String(tableDisplayName).match(/(\d+)$/) || [])[1] || tableDisplayName;

  const customerFilled = Boolean(
    customerName.trim() || customerPhone.trim() || customerEmail.trim() || customerCity.trim()
  );
  const tableFilled = mergedTables.length > 0;
  const paxFilled = pax !== '';
  const noteFilled = note.trim() !== '';
  const waiterFilled = waiter !== '';

  const PANEL_DEFS = [
    { key: 'table', icon: IconCutlery, label: 'Table & Merge', filled: tableFilled, badge: tableNumberBadge },
    { key: 'customer', icon: IconUser, label: 'Customer Details', filled: customerFilled },
    { key: 'pax', icon: IconUsers, label: 'Pax', filled: paxFilled },
    { key: 'note', icon: IconEdit, label: 'Order Note', filled: noteFilled },
    { key: 'waiter', icon: IconBowl, label: 'Waiter', filled: waiterFilled },
  ];

  // Auto-scroll to the newest item as the cart fills up during active
  // ordering (not the read-only bill/settle grouped view, where jumping
  // around while reviewing would be more disruptive than helpful).
  useEffect(() => {
    if (mode === 'bill' || mode === 'settle') return;
    const el = itemListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length, mode]);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const rawDiscount =
    discountType === 'percent'
      ? subtotal * (Number(discountValue || 0) / 100)
      : Number(discountValue || 0);
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * (settings.taxRate / 100);
  // Rounded to the nearest rupee — this is the figure billed, printed, and
  // settled against; subtotal/discount/tax keep their paise for the breakdown.
  const total = Math.round(discountedSubtotal + tax);
  const hasItems = items.length > 0;

  // Waiter + Pax are optional — whatever's set (see initialWaiter/initialPax)
  // just carries forward to later KOT rounds, Bill, and Settle for this table.
  // No confirm dialog — calls straight through to the API + print. The
  // `saving` guard (checked synchronously before setSaving) plus disabling
  // the button while it's true is what stops a double-click from firing two
  // API calls, same protection the old confirm-modal's button had.
  async function handleSaveKot() {
    if (saving || !hasItems) return;
    setSaving(true);
    try {
      await onSaveKot({
        waiter,
        pax: pax === '' ? undefined : Number(pax),
        orderType,
        tableLabel,
        note,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateBill() {
    if (saving || !hasItems) return;
    setSaving(true);
    try {
      await onGenerateBill({
        subtotal,
        discount: discountAmount,
        tax,
        taxRate: settings.taxRate,
        total,
        waiter,
        pax: pax === '' ? undefined : Number(pax),
        orderType,
        tableLabel,
        customerName,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelOrder() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await onCancelOrder();
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  }

  async function handleDeleteKot() {
    if (deletingKot || !deleteKotTarget) return;
    setDeletingKot(true);
    try {
      await onDeleteKot(deleteKotTarget);
    } finally {
      setDeletingKot(false);
      setDeleteKotTarget(null);
    }
  }

  return (
    <div className="w-[420px] shrink-0 bg-white border-l border-line flex flex-col h-full">
      <div className="grid grid-cols-2 text-sm font-medium">
        {ORDER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex items-center justify-center gap-1.5 py-2.5 transition-colors ${
              orderType === type ? 'bg-rust text-white' : 'bg-ink text-white/70 hover:bg-ink/90'
            }`}
          >
            {orderType === type && (
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-sage shrink-0">
                <IconCheck className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            {type}
          </button>
        ))}
      </div>

      {MODE_BADGES[mode] && (
        <div
          className={`py-1.5 text-xs font-semibold tracking-wide uppercase text-center ${MODE_BADGES[mode].className}`}
        >
          {MODE_BADGES[mode].label}
        </div>
      )}

      <div className="px-4 py-2.5 border-b border-line" ref={panelRef}>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold shrink-0">
            <IconReceipt className="w-4 h-4 text-ink-soft" />
            Order #{orderId ?? 'New'}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {PANEL_DEFS.map(({ key, icon: Icon, label, filled, badge }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActivePanel((prev) => (prev === key ? null : key))}
                title={label}
                aria-label={label}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-md border transition-colors ${
                  activePanel === key ? 'border-navy bg-navy/5' : 'border-line hover:bg-line/40'
                }`}
              >
                <Icon className="w-4 h-4 text-ink-soft" />
                {badge && <span className="text-[9px] font-bold text-rust leading-none">{badge}</span>}
                {filled && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sage border-2 border-white flex items-center justify-center">
                    <IconCheck className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {mergedNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-navy font-medium mt-2">
            <IconMerge className="w-3.5 h-3.5" />
            Merged with: {mergedNames.join(', ')}
          </div>
        )}

        {activePanel === 'table' && (
          <div className="flex items-center justify-between mt-2.5">
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
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-line rounded-md shadow-md z-20 max-h-40 overflow-y-auto thin-scrollbar">
                  {allTables.length === 0 && (
                    <p className="px-3 py-2 text-xs text-ink-soft">No other tables available.</p>
                  )}
                  {allTables.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-line/40">
                      <input
                        type="checkbox"
                        checked={mergedTables.includes(t.id)}
                        onChange={() => toggleMergedTable(t.id)}
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'customer' && (
          <div className="space-y-2 mt-2.5">
            <div className="flex gap-2">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="flex-1 min-w-0 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number"
                className="flex-1 min-w-0 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 min-w-0 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
              />
              <input
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="City"
                className="flex-1 min-w-0 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
          </div>
        )}

        {activePanel === 'pax' && (
          <div className="mt-2.5">
            <label className="block text-xs font-medium text-ink-soft mb-1">Number of Guests</label>
            <input
              type="number"
              min="1"
              value={pax}
              onChange={(e) => setPax(e.target.value)}
              placeholder="e.g. 4"
              className="w-24 border border-line rounded-md px-2.5 py-1.5 text-sm text-center outline-none"
            />
          </div>
        )}

        {activePanel === 'note' && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Order note..."
            rows={2}
            autoFocus
            className="w-full border border-line rounded-md px-2.5 py-1.5 text-sm outline-none resize-none mt-2.5"
          />
        )}

        {activePanel === 'waiter' && (
          <div className="mt-2.5">
            <label className="block text-xs font-medium text-ink-soft mb-1">Select Waiter</label>
            <select
              value={waiter}
              onChange={(e) => setWaiter(e.target.value)}
              className="w-full border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
            >
              <option value="">Select Waiter</option>
              {waiters
                .filter((w) => w.active !== false)
                .map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_88px_76px] gap-2 px-4 py-2 text-[11px] font-semibold text-ink-soft uppercase tracking-wide border-b border-line">
        <span>Items</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Price</span>
      </div>

      <div ref={itemListRef} className="flex-1 overflow-y-auto px-4 py-3 thin-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <Spinner className="w-6 h-6" />
            <div className="text-xs text-ink-soft">Loading order…</div>
          </div>
        ) : !hasItems ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <IconPlate className="w-14 h-14 text-line" />
            <div className="font-medium text-ink">No Item Selected</div>
            <div className="text-xs text-ink-soft">Please Select Item from Left Menu Item</div>
          </div>
        ) : mode === 'bill' || mode === 'settle' ? (
          <div className="space-y-3">
            {groupItemsByKot(items).map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2 bg-line/40 rounded-md px-3 py-1.5 mb-2 text-xs">
                  <span className="font-semibold text-ink">
                    {group.kotNo != null ? `KOT - ${group.kotNo}` : 'Earlier Items'}
                  </span>
                  {group.kotTime && <span className="text-ink-soft">Time - {group.kotTime}</span>}
                  {mode === 'bill' && group.kotNo != null && (
                    <button
                      onClick={() => onReprintKot?.({ ...group, tableLabel, waiter, orderType })}
                      title="Reprint this KOT"
                      aria-label={`Reprint KOT ${group.kotNo}`}
                      className="ml-auto text-ink-soft hover:text-navy"
                    >
                      <IconPrinter className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {mode === 'bill' && group.kotNo != null && (
                    <button
                      onClick={() => setDeleteKotTarget(group)}
                      title="Delete this KOT"
                      aria-label={`Delete KOT ${group.kotNo}`}
                      className="text-rust hover:text-rust/70"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.lineId ?? item.id}
                      item={item}
                      onQtyChange={onQtyChange}
                      onRemove={onRemove}
                      readOnly={mode === 'settle' || mode === 'bill'}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <ItemRow key={item.lineId ?? item.id} item={item} onQtyChange={onQtyChange} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-line space-y-3">
        <div className="relative rounded-md bg-ink text-sm">
          <button
            onClick={() => setSummaryOpen((v) => !v)}
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-9 h-6 rounded-t-md bg-ink flex items-center justify-center hover:bg-ink/90 z-10"
            aria-label={summaryOpen ? 'Hide bill details' : 'Show bill details'}
            title={summaryOpen ? 'Hide bill details' : 'Show bill details'}
          >
            <IconChevronDown className={`w-4 h-4 text-white transition-transform ${summaryOpen ? '' : 'rotate-180'}`} />
          </button>

          {summaryOpen && (
            <div className="px-4 pt-4 pb-1">
              <div className="flex justify-between text-white/60 py-0.5">
                <span>Item(s)</span>
                <span className="font-mono text-white">{itemCount}</span>
              </div>
              <div className="flex justify-between text-white/60 py-0.5">
                <span>Sub Total</span>
                <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-0.5 gap-2">
                <span className="text-white/60">Discount</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex border border-white/20 rounded-md overflow-hidden text-xs">
                    <button
                      onClick={() => setDiscountType('flat')}
                      className={`px-2 py-1 ${
                        discountType === 'flat' ? 'bg-rust text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      ₹
                    </button>
                    <button
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-1 border-l border-white/20 ${
                        discountType === 'percent' ? 'bg-rust text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
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
                    className="w-16 border border-white/20 bg-white/10 text-white placeholder:text-white/40 rounded-md px-2 py-1 text-xs text-center outline-none"
                  />
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rust py-0.5">
                  <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-white/60 py-0.5">
                <span>CGST ({(settings.taxRate / 2).toFixed(2)}%)</span>
                <span className="font-mono text-white">₹{(tax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/60 py-0.5">
                <span>SGST ({(settings.taxRate / 2).toFixed(2)}%)</span>
                <span className="font-mono text-white">₹{(tax / 2).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between px-4 py-3 ${summaryOpen ? 'border-t border-white/15' : ''}`}>
            <span className="font-semibold text-white">Total</span>
            <span className="font-mono font-bold text-lg text-amber">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {mode === 'kot' && (
          <button
            onClick={handleSaveKot}
            disabled={!hasItems || saving}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded disabled:opacity-40"
          >
            {saving && <Spinner className="w-4 h-4 border-[1.5px]" tone="border-t-white" />}
            {saving ? 'Saving & Printing…' : 'Save & Print KOT'}
          </button>
        )}

        {mode === 'bill' && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateBill}
              disabled={!hasItems || saving || cancelling}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded disabled:opacity-40"
            >
              {saving && <Spinner className="w-4 h-4 border-[1.5px]" tone="border-t-white" />}
              {saving ? 'Printing…' : 'Print Bill'}
            </button>
            {/* Hidden once the bill starts printing — at that point the order is
                about to be recorded as billed, so cancelling it no longer applies. */}
            {!saving && (
              <button
                onClick={() => setCancelConfirm(true)}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 bg-rust hover:bg-rust/90 text-white text-sm font-semibold py-2.5 rounded disabled:opacity-40"
              >
                {cancelling && <Spinner className="w-4 h-4 border-[1.5px]" tone="border-t-white" />}
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
          </div>
        )}

        {mode === 'settle' && (
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() =>
                onReprintBill({
                  subtotal,
                  discount: discountAmount,
                  tax,
                  taxRate: settings.taxRate,
                  total,
                  waiter,
                  orderType,
                  tableLabel,
                  customerName,
                })
              }
              className="bg-ink text-white py-2.5 rounded hover:bg-ink/90"
            >
              Reprint Bill
            </button>
            <button
              onClick={() =>
                onOpenSettle({ subtotal, discount: discountAmount, tax, total, waiter, orderType, tableLabel })
              }
              className="bg-green-700 text-white py-2.5 rounded hover:bg-green-800"
            >
              Settle Bill
            </button>
          </div>
        )}
      </div>

      {cancelConfirm && (
        <ConfirmModal
          title="Cancel this order?"
          message="This permanently deletes the entire order — including any KOTs already sent to the kitchen — and frees up this table. This cannot be undone."
          confirmLabel="Cancel Order"
          danger
          confirming={cancelling}
          onCancel={() => setCancelConfirm(false)}
          onConfirm={handleCancelOrder}
        />
      )}

      {deleteKotTarget && (
        <ConfirmModal
          title="Delete this KOT?"
          message={`This permanently removes KOT - ${deleteKotTarget.kotNo} and all its items — the kitchen will no longer see it. This cannot be undone.`}
          confirmLabel="Delete KOT"
          danger
          confirming={deletingKot}
          onCancel={() => setDeleteKotTarget(null)}
          onConfirm={handleDeleteKot}
        />
      )}
    </div>
  );
}
