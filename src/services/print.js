import qz from 'qz-tray';

const ESC = '\x1B';
const GS = '\x1D';

let qzConnected = false;

// Edit these to match your restaurant — passed through by default unless
// printReceipt() is called with overrides in its opts.
export const RESTAURANT_INFO = {
  name: 'Your Restaurant Name',
  addressLines: ['Your City', 'Your Street Address'],
  phone: 'Your Phone Number',
  gstin: 'Your GSTIN',
};

export function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Splits "Item Name (variant/addon note)" into the base name and the note,
// so KOT printouts can show the note on its own line.
export function splitItemName(name) {
  const match = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) return { main: match[1], note: match[2] };
  return { main: name, note: null };
}

/**
 * Connect to the QZ Tray desktop app. Must be installed & running on the POS PC.
 * Call this once on app load (see src/hooks/useQzTray.js).
 */
export async function connectQz() {
  if (qz.websocket.isActive()) {
    qzConnected = true;
    return true;
  }
  try {
    await qz.websocket.connect();
    qzConnected = true;
    return true;
  } catch (err) {
    console.warn('QZ Tray not available, will fall back to window.print():', err);
    qzConnected = false;
    return false;
  }
}

export function isQzConnected() {
  return qzConnected;
}

export async function listPrinters() {
  if (!qzConnected) return [];
  return qz.printers.find();
}

// Builds monospace ESC/POS line array for a bill or KOT.
// charWidth: 32 for 58mm printers, 42-48 for 80mm printers.
function buildReceiptLines({ type, restaurant, order, charWidth = 42 }) {
  const pad = (label, value) => {
    const l = String(label);
    const v = String(value);
    const gap = Math.max(1, charWidth - l.length - v.length);
    return l + ' '.repeat(gap) + v + '\n';
  };
  const divider = '-'.repeat(charWidth) + '\n';

  const lines = [ESC + '@']; // init

  if (type === 'bill') {
    const now = new Date();
    const qtyW = 4;
    const priceW = Math.floor(charWidth * 0.22);
    const amountW = priceW;
    const nameW = Math.max(8, charWidth - qtyW - priceW - amountW);
    const row = (qty, name, price, amount) =>
      String(qty).padEnd(qtyW) +
      String(name).slice(0, nameW).padEnd(nameW) +
      String(price).padStart(priceW) +
      String(amount).padStart(amountW) +
      '\n';

    lines.push(
      ESC + 'a' + '\x01', // center
      ESC + 'E' + '\x01', // bold on
      `${restaurant.name}\n`,
      ESC + 'E' + '\x00'
    );
    restaurant.addressLines.forEach((line) => lines.push(`${line}\n`));
    lines.push(
      `Phone: ${restaurant.phone}\n`,
      `GSTIN: ${restaurant.gstin}\n`,
      divider,
      ESC + 'a' + '\x00', // left
      ESC + 'E' + '\x01',
      pad(`Order #${order.orderNo}`, `${formatDate(now)} ${formatTime(now)}`),
      ESC + 'E' + '\x00',
      `Waiter: ${order.waiter || '-'}\n`,
      `${order.orderType || '-'}\n`,
      divider,
      row('Qty', 'Item Name', 'Price', 'Amount')
    );

    order.items.forEach((item) => {
      const { main, note } = splitItemName(item.name);
      lines.push(row(item.qty, main, `₹${item.price.toFixed(2)}`, `₹${item.amount.toFixed(2)}`));
      if (note) lines.push(`${' '.repeat(qtyW)}(${note})\n`);
    });

    lines.push(
      divider,
      pad('Sub Total:', `₹${order.subtotal.toFixed(2)}`),
      pad('Discount', `-₹${(order.discount || 0).toFixed(2)}`),
      pad('GST (5%):', `₹${order.tax.toFixed(2)}`),
      divider,
      ESC + 'E' + '\x01',
      pad('Total:', `₹${order.total.toFixed(2)}`),
      ESC + 'E' + '\x00',
      divider,
      ESC + 'a' + '\x01',
      'Thank you for your visit!\n\n\n',
      GS + 'V' + '\x00'
    );
  } else {
    // KOT: order/table meta, then item name + qty (no prices)
    const now = new Date();
    lines.push(
      ESC + 'a' + '\x01', // center
      ESC + 'E' + '\x01', // bold on
      `KOT #${order.kotNo}\n`,
      ESC + 'E' + '\x00',
      divider,
      ESC + 'a' + '\x00', // left
      ESC + 'E' + '\x01',
      pad(`Order #${order.orderNo}`, `Table: ${order.tableName}`),
      ESC + 'E' + '\x00',
      pad(`Date: ${formatDate(now)}`, `Time: ${formatTime(now)}`),
      `Waiter: ${order.waiter || '-'}\n`,
      `Order Type: ${order.orderType || '-'}\n`,
      divider,
      pad('Item Name', 'Qty')
    );

    order.items.forEach((item) => {
      const { main, note } = splitItemName(item.name);
      lines.push(pad(main, String(item.qty)));
      if (note) lines.push(`  (${note})\n`);
    });

    lines.push(divider, '\n\n', GS + 'V' + '\x00');
  }

  return lines;
}

/**
 * Print a bill or KOT. Tries QZ Tray (raw ESC/POS) first;
 * falls back to browser window.print() if QZ Tray isn't connected.
 *
 * @param {'bill'|'kot'} type
 * @param {object} order - normalized order data (see buildReceiptLines)
 * @param {string} printerName - QZ Tray printer name (optional, uses default if omitted)
 * @param {object} opts - { restaurantName, addressLines, phone, gstin, charWidth }
 */
export async function printReceipt(type, order, printerName, opts = {}) {
  const restaurant = {
    name: opts.restaurantName || RESTAURANT_INFO.name,
    addressLines: opts.addressLines || RESTAURANT_INFO.addressLines,
    phone: opts.phone || RESTAURANT_INFO.phone,
    gstin: opts.gstin || RESTAURANT_INFO.gstin,
  };
  const charWidth = opts.charWidth || 42;

  if (qzConnected) {
    try {
      const config = printerName
        ? qz.configs.create(printerName)
        : qz.configs.create(await qz.printers.getDefault());
      const data = buildReceiptLines({ type, restaurant, order, charWidth });
      await qz.print(config, data);
      return { method: 'qz-tray' };
    } catch (err) {
      console.error('QZ Tray print failed, falling back to window.print():', err);
      printFallback();
      return { method: 'window.print', error: err };
    }
  }

  printFallback();
  return { method: 'window.print' };
}

// Fallback: assumes the caller has already rendered a #print-area element
// (see components/Receipt.jsx) styled via the @media print rules in index.css.
function printFallback() {
  window.print();
}
