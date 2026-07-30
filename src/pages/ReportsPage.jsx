import React, { useEffect, useState } from 'react';
import { getDailySales, getSalesRegister } from '../services/api.js';
import EmptyState from '../components/EmptyState.jsx';
import { IconChartBar, IconReceipt } from '../components/icons.jsx';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// closed_at arrives as a MySQL "YYYY-MM-DD HH:MM:SS" string — some browsers
// (Safari) refuse to parse that without the 'T', so normalize it first.
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [salesRegister, setSalesRegister] = useState([]);
  const [detailModal, setDetailModal] = useState(null); // { type: 'items' | 'payment', row }

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
          <div className="ticket-card bg-white p-4">
            <div className="text-xs text-ink-soft font-mono uppercase">Total Sales</div>
            <div className="font-display text-2xl font-semibold mt-1">₹{report.totalSales.toFixed(2)}</div>
          </div>
          <div className="ticket-card bg-white p-4">
            <div className="text-xs text-ink-soft font-mono uppercase">Orders</div>
            <div className="font-display text-2xl font-semibold mt-1">{report.totalOrders}</div>
          </div>
          <div className="ticket-card bg-white p-4">
            <div className="text-xs text-ink-soft font-mono uppercase">Payment Split</div>
            <div className="text-sm mt-1 space-y-0.5">
              <div>Cash: ₹{report.paymentBreakdown.cash.toFixed(2)}</div>
              <div>UPI: ₹{report.paymentBreakdown.upi.toFixed(2)}</div>
              <div>Card: ₹{report.paymentBreakdown.card.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="ticket-card bg-white p-4">
        <h3 className="font-display font-semibold mb-3">Top Items</h3>
        {report?.topItems?.length ? (
          <ul className="text-sm space-y-1">
            {report.topItems.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{item.qty} sold</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={IconChartBar} message="No sales data for this date range yet." />
        )}
      </div>

      <div className="ticket-card bg-white p-4 mt-6">
        <h3 className="font-display font-semibold mb-3">Sales Register</h3>
        {salesRegister.length === 0 ? (
          <EmptyState icon={IconReceipt} message="No orders settled in this date range yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-line">
                  <th className="py-2 pr-4 font-medium">Order ID</th>
                  <th className="py-2 pr-4 font-medium">Order Date</th>
                  <th className="py-2 pr-4 font-medium">Table Name</th>
                  <th className="py-2 pr-4 font-medium">Order Type</th>
                  <th className="py-2 pr-4 font-medium">Waiter Name</th>
                  <th className="py-2 pr-4 font-medium text-right">Pax</th>
                  <th className="py-2 pr-4 font-medium text-right">Total Items</th>
                  <th className="py-2 pr-4 font-medium text-right">Sub Total</th>
                  <th className="py-2 pr-4 font-medium text-right">Discount</th>
                  <th className="py-2 pr-4 font-medium text-right">Tax Amount</th>
                  <th className="py-2 pr-4 font-medium text-right">Total</th>
                  <th className="py-2 pr-0 font-medium">Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {salesRegister.map((row) => (
                  <tr key={row.orderId} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-4 font-mono">{row.orderId}</td>
                    <td className="py-2 pr-4 font-mono">{formatDateTime(row.orderDate)}</td>
                    <td className="py-2 pr-4">{row.table}</td>
                    <td className="py-2 pr-4">{row.orderType}</td>
                    <td className="py-2 pr-4">{row.waiterName || '—'}</td>
                    <td className="py-2 pr-4 text-right font-mono">{row.pax ?? '—'}</td>
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
                    <td className="py-2 pr-4 text-right font-mono">₹{row.tax.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right font-mono font-semibold">₹{row.total.toFixed(2)}</td>
                    <td className="py-2 pr-0">
                      <button
                        onClick={() => setDetailModal({ type: 'payment', row })}
                        className="text-navy hover:underline"
                      >
                        {row.paymentMode}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="py-2 pr-4" colSpan={10}>
                    Total
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    ₹{salesRegister.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                  </td>
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
    </div>
  );
}
