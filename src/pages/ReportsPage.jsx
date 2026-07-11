import React, { useEffect, useState } from 'react';
import { getDailySales } from '../services/api.js';

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);

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
    </div>
  );
}
