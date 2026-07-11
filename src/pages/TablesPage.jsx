import React, { useEffect, useState } from 'react';
import TableCard from '../components/TableCard.jsx';
import { getOrder } from '../services/api.js';
import { printReceipt } from '../services/print.js';
import { IconRefresh, IconPlus, IconChevronDown } from '../components/icons.jsx';
import { useTables } from '../context/TableContext.jsx';

const LEGEND = [
  { status: 'blank', label: 'Blank Table', dot: 'bg-white border border-ink-soft/40' },
  { status: 'running', label: 'Running Table', dot: 'bg-sky' },
  { status: 'printed', label: 'Printed Table', dot: 'bg-sage' },
  { status: 'paid', label: 'Paid Table', dot: 'bg-gold' },
  { status: 'runningKot', label: 'Running KOT Table', dot: 'bg-amber' },
];

export default function TablesPage() {
  const { sections } = useTables();
  const [preview, setPreview] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setNow(Date.now());
    setTimeout(() => setRefreshing(false), 400);
  }

  async function fetchOrder(table) {
    try {
      const res = await getOrder(table.id);
      return res.data;
    } catch {
      // API not reachable yet — show demo bill data so the action is still visible locally.
      console.warn(`Using placeholder bill data for ${table.name}. Connect the CI4 API to replace this.`);
      return {
        billNo: Math.floor(Math.random() * 90000) + 10000,
        tableName: table.name,
        items: [
          { name: 'Paneer Tikka', qty: 1, amount: 220 },
          { name: 'Masala Chai', qty: 2, amount: 80 },
        ],
        subtotal: 300,
        tax: 15,
        total: 315,
      };
    }
  }

  async function handlePrint(table) {
    const order = await fetchOrder(table);
    await printReceipt('bill', order, null, { charWidth: 42 });
  }

  async function handleView(table) {
    const order = await fetchOrder(table);
    setPreview({ table, order });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Table View</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            aria-label="Refresh"
            className="p-2 rounded-md border border-line hover:bg-line/40"
          >
            <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
            Delivery
          </button>
          <button className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
            Take Away
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 bg-rust text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-rust/90">
            <IconPlus className="w-4 h-4" /> Table Reservation
          </button>
          <button className="flex items-center gap-1 bg-rust text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-rust/90">
            <IconPlus className="w-4 h-4" /> Contactless
          </button>
          <button className="text-xs font-medium text-ink-soft border border-line rounded-full px-3 py-1.5">
            Move KOT/Items
          </button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {LEGEND.map((l) => (
            <div key={l.status} className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className={`status-dot ${l.dot}`} />
              {l.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-soft">Floor Plan</span>
          <div className="flex items-center gap-1.5 border border-line rounded-md px-3 py-1.5">
            Default Layout
            <IconChevronDown className="w-3.5 h-3.5 text-ink-soft" />
          </div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.name} className="mb-8">
          <h2 className="font-display text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">
            {section.name}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-4">
            {section.tables.map((table) => (
              <TableCard key={table.id} table={table} onPrint={handlePrint} onView={handleView} now={now} />
            ))}
          </div>
        </div>
      ))}

      {preview && (
        <div
          className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-lg shadow-md w-80 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">{preview.table.name}</h3>
              <button onClick={() => setPreview(null)} className="text-ink-soft hover:text-ink text-sm">
                Close
              </button>
            </div>
            <div className="text-sm space-y-1">
              {(preview.order.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.qty} x {item.name}</span>
                  <span>₹{(item.amount ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-line mt-3 pt-3 flex justify-between font-semibold text-sm">
              <span>Total</span>
              <span>₹{(preview.order.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
