import React, { useEffect, useMemo, useState } from 'react';
import { getDailySales } from '../services/api.js';
import { getMockSalesRegister } from '../services/dashboardMock.js';

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  // Placeholder rows until the CI4 /reports/daily-sales endpoint returns a
  // real per-order register — see services/dashboardMock.js.
  const salesRegister = useMemo(() => getMockSalesRegister(date), [date]);

  useEffect(() => {
    getDailySales(date)
      .then((res) => setReport(res.data))
      .catch(() =>
        setReport({
          totalSales: 0,
          totalOrders: 0,
          paymentBreakdown: { cash: 0, upi: 0, card: 0 },
          topItems: [],
        })
      );
  }, [date]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-line rounded-md px-3 py-2 text-sm"
        />
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
          <p className="text-sm text-ink-soft">No sales data for this date yet.</p>
        )}
      </div>

      <div className="ticket-card bg-white p-4 mt-6">
        <h3 className="font-display font-semibold mb-3">Sales Register</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-line">
                <th className="py-2 pr-4 font-medium">Order #</th>
                <th className="py-2 pr-4 font-medium">Table</th>
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Payment Mode</th>
                <th className="py-2 pr-0 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {salesRegister.map((row) => (
                <tr key={row.orderNo} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-4 font-mono">{row.orderNo}</td>
                  <td className="py-2 pr-4">{row.table}</td>
                  <td className="py-2 pr-4 font-mono">{row.time}</td>
                  <td className="py-2 pr-4">{row.paymentMode}</td>
                  <td className="py-2 pr-0 font-mono text-right">₹{row.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-semibold">
                <td className="py-2 pr-4" colSpan={4}>
                  Total
                </td>
                <td className="py-2 pr-0 font-mono text-right">
                  ₹{salesRegister.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
