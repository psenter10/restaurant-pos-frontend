import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getDailySales, getSalesRegister, deleteOrder } from '../services/api.js';
import { printReceipt } from '../services/print.js';
import { useSettings } from '../context/SettingsContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import IconTextButton from '../components/IconTextButton.jsx';
import Receipt from '../components/Receipt.jsx';
import {
  IconChartBar,
  IconReceipt,
  IconTrash,
  IconPrinter,
  IconSave,
  IconSearch,
  IconWallet,
} from '../components/icons.jsx';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// closed_at arrives as a MySQL "YYYY-MM-DD HH:MM:SS" string — some browsers
// (Safari) refuse to parse that without the 'T', so normalize it first.
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${dd}-${mm}-${yyyy} ${hours}:${minutes} ${ampm}`;
}

function DetailModal({ type, row, onClose }) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-md w-[420px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">
            {type === 'items' ? `Items — Order #${row.orderId}` : `Payment — Order #${row.orderId}`}
          </h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          {type === 'items' ? (
            row.items?.length ? (
              <ul className="text-sm divide-y divide-line/60">
                {row.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="truncate">
                      {item.name} <span className="text-ink-soft font-mono text-xs">× {item.qty}</span>
                    </span>
                    <span className="font-mono">₹{(item.qty * item.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">No items recorded.</p>
            )
          ) : (
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-soft">Mode</span>
                <span className="font-medium">{row.payment.mode}</span>
              </div>
              {row.payment.cash > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Cash</span>
                  <span className="font-mono">₹{row.payment.cash.toFixed(2)}</span>
                </div>
              )}
              {row.payment.upi > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">UPI</span>
                  <span className="font-mono">₹{row.payment.upi.toFixed(2)}</span>
                </div>
              )}
              {row.payment.card > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Card</span>
                  <span className="font-mono">₹{row.payment.card.toFixed(2)}</span>
                </div>
              )}
              {row.payment.tip > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Tip</span>
                  <span className="font-mono">₹{row.payment.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-line font-semibold">
                <span>Total Received</span>
                <span className="font-mono">₹{row.payment.totalReceived.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end px-5 py-4 border-t border-line">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { settings } = useSettings();
  const restaurant = {
    name: settings.restaurantName,
    addressLines: [settings.addressLine1, settings.addressLine2].filter(Boolean),
    phone: settings.phone,
    gstin: settings.gstin,
  };

  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [salesRegister, setSalesRegister] = useState([]);
  const [detailModal, setDetailModal] = useState(null); // { type: 'items' | 'payment', row }
  const [deleteTarget, setDeleteTarget] = useState(null); // row pending delete confirmation
  const [deleting, setDeleting] = useState(false);
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null); // drives the hidden #print-area fallback

  const visibleRows = orderIdSearch.trim()
    ? salesRegister.filter((row) => String(row.orderId).includes(orderIdSearch.trim()))
    : salesRegister;

  useEffect(() => {
    getDailySales(fromDate, toDate)
      .then((res) => setReport(res.data))
      .catch(() =>
        setReport({
          totalSales: 0,
          totalOrders: 0,
          paymentBreakdown: { cash: 0, upi: 0, card: 0 },
          topItems: [],
        })
      );
    getSalesRegister(fromDate, toDate)
      .then((res) => setSalesRegister(res.data))
      .catch(() => setSalesRegister([]));
  }, [fromDate, toDate]);

  // Reprints from the sales-register row data — a best-effort reprint, not a
  // byte-identical reproduction of the original bill, since this payload only
  // carries item name/qty/price (no KOT grouping or customer contact fields).
  function handlePrint(row) {
    const order = {
      customerName: '',
      tableName: row.table,
      orderType: row.orderType,
      waiter: row.waiterName,
      cashier: row.cashierName,
      orderNo: row.orderId,
      items: row.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        amount: item.qty * item.price,
      })),
      subtotal: row.subtotal,
      discount: row.discount,
      tax: row.tax,
      total: row.total,
      taxRate: row.subtotal ? (row.tax / row.subtotal) * 100 : 5,
    };
    // flushSync (matching OrderPage's printReceipt call sites) forces the
    // hidden <Receipt> below to re-render with this order BEFORE
    // printReceipt() runs — needed because if QZ Tray isn't reachable it
    // silently falls back to window.print(), which only has something to
    // print if #print-area already reflects the order by then.
    flushSync(() => {
      setReceiptOrder(order);
    });
    printReceipt('bill', order, null, { charWidth: 48, ...restaurant });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrder(deleteTarget.orderId);
      setSalesRegister((rows) => rows.filter((r) => r.orderId !== deleteTarget.orderId));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    const rows = visibleRows.map((row) => ({
      'Order ID': row.orderId,
      'Order Date': formatDateTime(row.orderDate),
      'Table Name': row.table,
      'Order Type': row.orderType,
      'Total Items': row.totalItems,
      'Sub Total': row.subtotal,
      Discount: row.discount,
      CGST: row.tax / 2,
      SGST: row.tax / 2,
      Total: row.total,
      Tips: row.payment?.tip || 0,
      'Payment Mode': row.paymentMode,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sales Register');
    XLSX.writeFile(workbook, `sales-register_${fromDate}_to_${toDate}.xlsx`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-soft font-medium">From</label>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-line rounded-md px-3 py-2 text-sm"
          />
          <label className="text-xs text-ink-soft font-medium">To</label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={todayStr()}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-line rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg shadow-sm p-4 text-white bg-gradient-to-br from-navy to-sky">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wide text-white/75">Total Sales</span>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <IconWallet className="w-3.5 h-3.5 text-white" />
              </span>
            </div>
            <div className="font-display text-2xl font-semibold">₹{report.totalSales.toFixed(2)}</div>
          </div>
          <div className="rounded-lg shadow-sm p-4 text-white bg-gradient-to-br from-rust to-navy">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wide text-white/75">Orders</span>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <IconReceipt className="w-3.5 h-3.5 text-white" />
              </span>
            </div>
            <div className="font-display text-2xl font-semibold">{report.totalOrders}</div>
          </div>
          <div className="rounded-lg shadow-sm p-4 text-white bg-gradient-to-br from-sage to-sky">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wide text-white/75">Payment Split</span>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <IconChartBar className="w-3.5 h-3.5 text-white" />
              </span>
            </div>
            <div className="text-sm mt-1 space-y-0.5">
              <div>Cash: ₹{report.paymentBreakdown.cash.toFixed(2)}</div>
              <div>UPI: ₹{report.paymentBreakdown.upi.toFixed(2)}</div>
              <div>Card: ₹{report.paymentBreakdown.card.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg shadow-sm p-4 text-white bg-gradient-to-br from-navy to-sage">
        <h3 className="font-display font-semibold mb-3">Top Items</h3>
        {report?.topItems?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.topItems.map((item, idx) => (
              <div key={idx} className="ticket-card bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink truncate">{item.name}</span>
                <span className="font-mono text-sm font-semibold text-navy whitespace-nowrap">{item.qty} sold</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={IconChartBar} message="No sales data for this date range yet." />
        )}
      </div>

      <div className="ticket-card bg-white p-4 mt-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h3 className="font-display font-semibold">Sales Register</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 bg-white">
              <IconSearch className="w-4 h-4 text-ink-soft" />
              <input
                value={orderIdSearch}
                onChange={(e) => setOrderIdSearch(e.target.value)}
                placeholder="Search by Order ID"
                className="outline-none bg-transparent text-sm w-36"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={visibleRows.length === 0}
              className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-navy-light disabled:opacity-40"
            >
              <IconSave className="w-4 h-4" /> Export to Excel
            </button>
          </div>
        </div>
        {visibleRows.length === 0 ? (
          <EmptyState
            icon={IconReceipt}
            message={orderIdSearch.trim() ? 'No orders match that Order ID.' : 'No orders settled in this date range yet.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-line">
                  <th className="py-2 pr-4 font-medium">Order ID</th>
                  <th className="py-2 pr-4 font-medium">Order Date</th>
                  <th className="py-2 pr-4 font-medium">Table Name</th>
                  <th className="py-2 pr-4 font-medium">Order Type</th>
                  <th className="py-2 pr-4 font-medium text-right">Total Items</th>
                  <th className="py-2 pr-4 font-medium text-right">Sub Total</th>
                  <th className="py-2 pr-4 font-medium text-right">Discount</th>
                  <th className="py-2 pr-4 font-medium text-right">CGST</th>
                  <th className="py-2 pr-4 font-medium text-right">SGST</th>
                  <th className="py-2 pr-4 font-medium text-right">Total</th>
                  <th className="py-2 pr-4 font-medium text-right">Tips</th>
                  <th className="py-2 pr-4 font-medium">Payment Mode</th>
                  <th className="py-2 pr-0 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.orderId} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-4 font-mono">{row.orderId}</td>
                    <td className="py-2 pr-4 font-mono">{formatDateTime(row.orderDate)}</td>
                    <td className="py-2 pr-4">{row.table}</td>
                    <td className="py-2 pr-4">{row.orderType}</td>
                    <td className="py-2 pr-4 text-right">
                      <button
                        onClick={() => setDetailModal({ type: 'items', row })}
                        className="font-mono text-navy hover:underline"
                      >
                        {row.totalItems}
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">₹{row.subtotal.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right font-mono">₹{row.discount.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right font-mono">₹{(row.tax / 2).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right font-mono">₹{(row.tax / 2).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right font-mono font-semibold">₹{row.total.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right font-mono">₹{(row.payment?.tip || 0).toFixed(2)}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => setDetailModal({ type: 'payment', row })}
                        className="text-navy hover:underline"
                      >
                        {row.paymentMode}
                      </button>
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex items-center gap-1.5">
                        {!isAdminRoute && (
                          <IconTextButton icon={IconPrinter} tone="navy" onClick={() => handlePrint(row)}>
                            Print
                          </IconTextButton>
                        )}
                        <IconTextButton icon={IconTrash} tone="rust" onClick={() => setDeleteTarget(row)}>
                          Delete
                        </IconTextButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="py-2 pr-4" colSpan={5}>
                    Total
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{visibleRows.reduce((sum, r) => sum + r.subtotal, 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{visibleRows.reduce((sum, r) => sum + r.discount, 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{visibleRows.reduce((sum, r) => sum + r.tax / 2, 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{visibleRows.reduce((sum, r) => sum + r.tax / 2, 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{visibleRows.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{visibleRows.reduce((sum, r) => sum + (r.payment?.tip || 0), 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4" />
                  <td className="py-2 pr-0" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {detailModal && (
        <DetailModal type={detailModal.type} row={detailModal.row} onClose={() => setDetailModal(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete this bill?"
          message={`Order #${deleteTarget.orderId} will be permanently removed — this cannot be undone.`}
          confirmLabel="Delete"
          danger
          confirming={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Receipt type="bill" order={receiptOrder} restaurant={restaurant} />
    </div>
  );
}
