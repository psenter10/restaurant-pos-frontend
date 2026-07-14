// Placeholder figures for the Admin Dashboard until the CI4 reporting
// endpoints (see getDashboardSummary/getSalesTrend/getTopSellingItems/
// getPaymentSplit in api.js) are live. Numbers are seeded from the day of
// the month so they stay stable across re-renders within the same day
// instead of jumping around on every refresh.
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getMockSalesTrend(days = 7) {
  const rand = seededRandom(new Date().getDate() + 1);
  const today = new Date();
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const base = 14000 + rand() * 9000;
    trend.push({ day: DAY_NAMES[d.getDay()], sales: Math.round(base) });
  }
  return trend;
}

export function getMockDashboardSummary(salesTrend) {
  const todaySales = salesTrend[salesTrend.length - 1].sales;
  const yesterdaySales = salesTrend[salesTrend.length - 2]?.sales ?? todaySales;
  const rand = seededRandom(new Date().getDate() + 2);
  const totalOrders = Math.round(28 + rand() * 22);
  const yesterdayOrders = Math.round(totalOrders * (0.85 + rand() * 0.3));
  return {
    todaySales,
    salesDeltaPct: yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0,
    totalOrders,
    ordersDeltaPct: yesterdayOrders ? ((totalOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0,
    avgOrderValue: totalOrders ? todaySales / totalOrders : 0,
  };
}

export function getMockTopItems(menuItems, limit = 5) {
  const rand = seededRandom(new Date().getDate() + 3);
  return menuItems
    .filter((i) => i.available !== false)
    .map((item) => ({ name: item.name, qty: Math.round(4 + rand() * 46) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];
const SAMPLE_TABLES = ['A/C - Table 2', 'A/C - Table 9', 'Non A/C - Table 5', 'Bar - Table 3', 'A/C - Table 14'];

export function getMockSalesRegister(date, count = 15) {
  const day = new Date(date).getDate() || new Date().getDate();
  const rand = seededRandom(day + 5);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const hour = Math.floor(9 + rand() * 13);
    const minute = Math.floor(rand() * 60);
    rows.push({
      orderNo: 1000 + day * 20 + i,
      table: SAMPLE_TABLES[Math.floor(rand() * SAMPLE_TABLES.length)],
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      paymentMode: PAYMENT_MODES[Math.floor(rand() * PAYMENT_MODES.length)],
      amount: Math.round(180 + rand() * 1400),
    });
  }
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

export function getMockPaymentSplit() {
  const rand = seededRandom(new Date().getDate() + 4);
  const cash = Math.round(30 + rand() * 20);
  const upi = Math.round(35 + rand() * 20);
  const card = Math.max(5, 100 - cash - upi);
  return [
    { label: 'UPI', value: upi },
    { label: 'Cash', value: cash },
    { label: 'Card', value: card },
  ];
}
