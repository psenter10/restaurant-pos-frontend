import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useTables } from '../context/TableContext.jsx';
import { IconTrendUp, IconTrendDown, IconLayoutGrid, IconWallet, IconReceipt, IconChartBar } from '../components/icons.jsx';
import { getDashboardSummary, getSalesTrend, getTopSellingItems, getPaymentSplit } from '../services/api.js';

const BLUE = '#2a78d6';
const AQUA = '#1baf7a';
const YELLOW = '#eda100';
const GRID = '#DEDAD1';
const AXIS_TEXT = '#898781';

// Fixed status→color mapping, matching the Table View legend elsewhere in
// the app (see LEGEND in TablesPage.jsx) — kept identical so a status never
// carries a different meaning in two places.
const STATUS_COLORS = {
  Blank: '#DEDAD1',
  Running: '#4A90C4',
  'Bill Printed': '#4B7B5B',
  Reserved: '#B04632',
};

function formatCurrency(value) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function StatTile({ label, value, deltaPct, icon: Icon, gradient }) {
  const isUp = deltaPct >= 0;
  return (
    <div className={`rounded-lg shadow-sm p-4 text-white bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wide text-white/75">{label}</span>
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-white" />
        </span>
      </div>
      <div className="font-display text-2xl font-semibold">{value}</div>
      {deltaPct != null && (
        <div
          className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 bg-white/90 rounded-full px-1.5 py-0.5 ${
            isUp ? 'text-sage' : 'text-rust'
          }`}
        >
          {isUp ? <IconTrendUp className="w-3.5 h-3.5" /> : <IconTrendDown className="w-3.5 h-3.5" />}
          {Math.abs(deltaPct).toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  );
}

function MeterTile({ label, occupied, total, gradient }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  return (
    <div className={`rounded-lg shadow-sm p-4 text-white bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wide text-white/75">{label}</span>
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <IconLayoutGrid className="w-3.5 h-3.5 text-white" />
        </span>
      </div>
      <div className="font-display text-2xl font-semibold">
        {occupied} <span className="text-sm font-body font-normal text-white/75">/ {total} tables</span>
      </div>
      <div className="mt-2.5 h-2 rounded-full bg-white/25 overflow-hidden">
        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-white/75 mt-1">{pct}% occupied</div>
    </div>
  );
}

function ChartCard({ title, children, height = 220 }) {
  return (
    <div className="ticket-card bg-white p-4">
      <h3 className="font-display font-semibold text-sm text-ink mb-3">{title}</h3>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white text-xs rounded-md px-3 py-2 shadow-lg">
      {label && <div className="font-semibold mb-0.5">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

const DEFAULT_SUMMARY = { todaySales: 0, salesDeltaPct: 0, totalOrders: 0, ordersDeltaPct: 0, avgOrderValue: 0 };

export default function AdminDashboardPage() {
  const { sections } = useTables();

  const [salesTrend, setSalesTrend] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [topItems, setTopItems] = useState([]);
  const [paymentSplit, setPaymentSplit] = useState([]);

  useEffect(() => {
    getSalesTrend(7)
      .then((res) => setSalesTrend(res.data))
      .catch(() => {
        // Backend unreachable — chart just renders empty.
      });
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {
        // Backend unreachable — tiles fall back to zeros.
      });
    getTopSellingItems(5)
      .then((res) => setTopItems([...res.data].reverse()))
      .catch(() => {
        // Backend unreachable — chart just renders empty.
      });
    getPaymentSplit()
      .then((res) => setPaymentSplit(res.data))
      .catch(() => {
        // Backend unreachable — chart just renders empty.
      });
  }, []);

  // Defensive against malformed/stale data: drop any missing tables array or
  // holes so a bad entry can't crash the dashboard.
  const allTables = useMemo(
    () => sections.flatMap((s) => (s.tables || []).filter(Boolean)),
    [sections]
  );
  const statusCounts = useMemo(() => {
    const counts = { Blank: 0, Running: 0, 'Bill Printed': 0, Reserved: 0 };
    allTables.forEach((t) => {
      if (t.status === 'blank') counts.Blank++;
      else if (t.status === 'running') counts.Running++;
      else if (t.status === 'printed') counts['Bill Printed']++;
      else if (t.status === 'reserved') counts.Reserved++;
    });
    return counts;
  }, [allTables]);
  const occupiedTables = statusCounts.Running + statusCounts['Bill Printed'];

  const statusData = Object.entries(statusCounts).map(([label, count]) => ({ label, count }));
  const paymentColors = [BLUE, AQUA, YELLOW];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Today's Sales"
          value={formatCurrency(summary.todaySales)}
          deltaPct={summary.salesDeltaPct}
          icon={IconWallet}
          gradient="from-navy to-sky"
        />
        <StatTile
          label="Orders Today"
          value={summary.totalOrders}
          deltaPct={summary.ordersDeltaPct}
          icon={IconReceipt}
          gradient="from-rust to-navy"
        />
        <StatTile
          label="Avg Order Value"
          value={formatCurrency(summary.avgOrderValue)}
          deltaPct={null}
          icon={IconChartBar}
          gradient="from-sage to-sky"
        />
        <MeterTile
          label="Active Tables"
          occupied={occupiedTables}
          total={allTables.length}
          gradient="from-navy to-sage"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Sales — Last 7 Days">
          <ResponsiveContainer>
            <AreaChart data={salesTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales"
                stroke={BLUE}
                strokeWidth={2}
                fill={BLUE}
                fillOpacity={0.1}
                dot={{ r: 3, fill: BLUE, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 4, fill: BLUE, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Table Status Overview">
          <ResponsiveContainer>
            <BarChart data={statusData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }} barSize={18}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Tables" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#4A4744' }}>
                {statusData.map((entry) => (
                  <Cell key={entry.label} fill={STATUS_COLORS[entry.label]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Selling Items">
          <ResponsiveContainer>
            <BarChart data={topItems} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }} barSize={16}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} sold`} />} />
              <Bar dataKey="qty" name="Qty Sold" fill={BLUE} radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#4A4744' }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Method Split" height={220}>
          <ResponsiveContainer>
            <BarChart data={paymentSplit} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }} barSize={18}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
              <Bar dataKey="value" name="Share" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#4A4744', formatter: (v) => `${v}%` }}>
                {paymentSplit.map((entry, idx) => (
                  <Cell key={entry.label} fill={paymentColors[idx]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
