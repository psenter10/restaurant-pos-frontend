// Placeholder per-waiter performance figures until the CI4 API can report
// real order-by-waiter history. Seeded from the waiter's name so numbers
// stay stable across renders instead of jumping around randomly.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000;
  }
  return hash;
}

function seededRandom(seed) {
  let value = seed || 1;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function getWaiterStats(waiterName) {
  const rand = seededRandom(hashString(waiterName) + 1);
  const ordersAllTime = Math.round(120 + rand() * 480);
  const avgOrderValue = 320 + rand() * 260;
  const salesAllTime = Math.round(ordersAllTime * avgOrderValue);
  const tipsAllTime = Math.round(salesAllTime * (0.02 + rand() * 0.04));

  const ordersToday = Math.round(2 + rand() * 14);
  const salesToday = Math.round(ordersToday * avgOrderValue);
  const tipsToday = Math.round(salesToday * (0.02 + rand() * 0.04));

  return {
    ordersAllTime,
    salesAllTime,
    tipsAllTime,
    ordersToday,
    salesToday,
    tipsToday,
  };
}

// Ranks waiters by all-time orders served and returns a name→badge map for
// the top 3 ("Top Server", "2nd Most Server", "3rd Most Server").
export function getWaiterBadges(waiters) {
  const ranked = waiters
    .map((w) => ({ name: w.name, orders: getWaiterStats(w.name).ordersAllTime }))
    .sort((a, b) => b.orders - a.orders);

  const labels = ['Top Server', '2nd Most Server', '3rd Most Server'];
  const badges = {};
  ranked.slice(0, 3).forEach((w, idx) => {
    badges[w.name] = labels[idx];
  });
  return badges;
}
