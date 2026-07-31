import qz from 'qz-tray';
import { signQzRequest } from './api.js';

const ESC = '\x1B';
const GS = '\x1D';

let qzConnected = false;

// Public half of this deployment's QZ Tray signing key pair — safe to embed,
// only the private key (kept server-side, see QzController::sign) can
// actually produce a valid signature against it.
//
// This is a leaf certificate issued BY our own root CA (not self-signed),
// with the root cert appended below it. QZ Tray needs the full chain to
// verify it, and the root cert is what gets installed into the OS's trust
// store on each POS machine (see SETUP_CLIENT_CA.md) — once that's done,
// this connection is genuinely "Trusted" instead of re-prompting every
// reload like a plain self-signed cert does.
const QZ_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIID/DCCAuSgAwIBAgIUM/soBr2bClbL4AFeKfY6eJISaQIwDQYJKoZIhvcNAQEL
BQAwgYQxCzAJBgNVBAYTAklOMQ8wDQYDVQQIDAZPZGlzaGExEjAQBgNVBAcMCVNh
bWJhbHB1cjEWMBQGA1UECgwNTGF2YW55YSBQbGF6YTEUMBIGA1UECwwLUE9TIFJv
b3QgQ0ExIjAgBgNVBAMMGUxhdmFueWEgUGxhemEgUE9TIFJvb3QgQ0EwHhcNMjYw
NzI5MDgxMjU1WhcNNDYwNzI0MDgxMjU1WjB0MQswCQYDVQQGEwJJTjEPMA0GA1UE
CAwGT2Rpc2hhMRIwEAYDVQQHDAlTYW1iYWxwdXIxFjAUBgNVBAoMDUxhdmFueWEg
UGxhemExDDAKBgNVBAsMA1BPUzEaMBgGA1UEAwwRTGF2YW55YSBQbGF6YSBQT1Mw
ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDDLAC9hzgw5W2MiqBDwSzX
YvIELxIFKCSgV2NeqebeXLejQlCtIatDrACj2291aWKyNZjzXH5VcLSuFF3ylJH7
OWajZkgRu236UPtR6r8BLpyzKkDDl2ktxwk/5bhI5PpMXrwPu39X+dEMCUKtX0un
8RrFEd2v2Rsjd2mnRLbdHNtwIGccIi0hPiwRBUZR0B4LItGaAckF4dFIDV+WhTOW
ZNvoLcLhQjzUr/SFZMDvk+gL4xQxf0vCxdigWhhyY16WF65C2fFH0QlEaUVdnOk0
SLNxQQ1uaTCqtU2wHsLHFoDS1GcTmmAEfexZDg2dNUSB8ib9LvylB0rjvMeYJZW3
AgMBAAGjdTBzMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgXgMBMGA1UdJQQM
MAoGCCsGAQUFBwMCMB0GA1UdDgQWBBQqUeQpNMMwAzjkx7Cs6xR+bIwlRDAfBgNV
HSMEGDAWgBTI+VvC6unzJr93e+pyJ1WRkc1vDzANBgkqhkiG9w0BAQsFAAOCAQEA
vAWBt/DhlGdbhMES9i/Qyi6wiGYRCWWrBVzbCRIc6Mdr9N52NVWAXYssmNRyoTMX
g5a5jxugvAeMHHK+8ZdTMtHVqhaizKxSMj13q19GCBkLynnowgp5f3CVDroffPmG
RrK4qNhJ1bLdSr6O0kfVCH3PxilEhdxaBA3HoKeFRoinHeNc+MiOkcZhLRbOPOLO
l05FXbT4wE8BQX0+q+SpMHZ30ye07BsbrlWjrxgAEvv/hfctE0hbwALiDjvTgsZ3
YahHVGk4QClHuGZdrigz7ng4VfIzvzx0dRokHuSeqP0KXkBlClIBk5wOJ7mcXW+Q
SqAp7syikwrSAdEdv6Uc7g==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIID2jCCAsKgAwIBAgIUBVdcvuztHO61K0V2uViH6r0UpjcwDQYJKoZIhvcNAQEL
BQAwgYQxCzAJBgNVBAYTAklOMQ8wDQYDVQQIDAZPZGlzaGExEjAQBgNVBAcMCVNh
bWJhbHB1cjEWMBQGA1UECgwNTGF2YW55YSBQbGF6YTEUMBIGA1UECwwLUE9TIFJv
b3QgQ0ExIjAgBgNVBAMMGUxhdmFueWEgUGxhemEgUE9TIFJvb3QgQ0EwHhcNMjYw
NzI5MDgxMjU1WhcNNDYwNzI0MDgxMjU1WjCBhDELMAkGA1UEBhMCSU4xDzANBgNV
BAgMBk9kaXNoYTESMBAGA1UEBwwJU2FtYmFscHVyMRYwFAYDVQQKDA1MYXZhbnlh
IFBsYXphMRQwEgYDVQQLDAtQT1MgUm9vdCBDQTEiMCAGA1UEAwwZTGF2YW55YSBQ
bGF6YSBQT1MgUm9vdCBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB
AMcJsxmXSoTSg44UHV4ZXv6yTVDIg3HPyxIoaNCYbsR9LNdojHqWZcFacmJ5RIYU
j+jkSLkvS4kz3ZWknNUTUFkYFhAgZaic7BWICTUeR4dl0x8Ww+f35VWK9wDBtswn
Rjh+XP5RkTnNCOj7Y5ko32Fj3FkZebr74A/GMxNBPQCzcKZDGybb++u+JZdhpywt
U0dUNqJJTiKK6oKArzChplrhNN5r0BxQvc54cUSSzbierfKuxVHmIXWlkRD9ykew
dHD+JgQITqLpve/1Oly/Mr+p+LZAkB6SrDd0U9q7FwAnwT8jjs+Qb3zzmMewA3qB
G9YEXen+6j8zfxL7pyYQh00CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNV
HQ8BAf8EBAMCAQYwHQYDVR0OBBYEFMj5W8Lq6fMmv3d76nInVZGRzW8PMA0GCSqG
SIb3DQEBCwUAA4IBAQCGCvcB51zcU7Ad6MowlKWqvwDdQ+fZ60WmDaKKaQh5wol/
enjXssjLl1MC4wdfSlqIbJaxFohxQ0oZkOwvHFKyd5lr9SothLwLVuuONiEXTdTX
dELH5V5dXlTkknFgJzPYSuJQV3HbSKr3oN/qzmkXWdSUqkDFtJVgH0TxhhiLn2f6
6TIoPuxQ7ps4d50k7kJYA4Pe6ijPVMJEa3wWdwgotIY67ZBmOwx75FkGyXI2I/vs
6fQwbDok1sua2c32pA6zM6f7ZsJTlKbsPnuN+wb5CX/46Go4gSyCgS3ZlvX16YVW
UGODL5Ssif9WQU7WnOm2SdpyQhBdXVRLwtsi3jCz
-----END CERTIFICATE-----`;

let qzSecuritySet = false;
function ensureQzSecurity() {
  if (qzSecuritySet) return;
  qzSecuritySet = true;
  qz.security.setCertificatePromise((resolve) => resolve(QZ_CERTIFICATE));
  qz.security.setSignatureAlgorithm('SHA512');
  qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
    signQzRequest(toSign)
      .then((res) => resolve(res.data.signature))
      .catch(reject);
  });
}

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

// Compact 24-hour HH:MM used on the on-screen "KOT - {no} Time - {time}"
// group header in the cart (vs. the 12-hour formatTime used on printouts).
export function formatKotTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Splits "Item Name (variant/addon note)" into the base name and the note,
// so KOT printouts can show the note on its own line.
export function splitItemName(name) {
  const match = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) return { main: match[1], note: match[2] };
  return { main: name, note: null };
}

// Word-wraps a name into multiple lines no wider than `width` — used for the
// bill's Item column, where full names (with variant/addon notes and all)
// print on one wrapped block instead of a separate dimmed note line.
function wrapText(text, width) {
  const words = String(text).split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [''];
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
  ensureQzSecurity();
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
// charWidth: 32 for 58mm printers, 48 for 80mm printers (Font A, the
// standard-size font selected below — must match what's actually printed,
// or the receipt renders narrow/small with the printer's own default font).
function buildReceiptLines({ type, restaurant, order, charWidth = 48 }) {
  const pad = (label, value) => {
    const l = String(label);
    const v = String(value);
    const gap = Math.max(1, charWidth - l.length - v.length);
    return l + ' '.repeat(gap) + v + '\n';
  };
  const divider = '='.repeat(charWidth) + '\n';
  const thinDivider = '-'.repeat(charWidth) + '\n'; // single rule under the item table header

  const lines = [
    ESC + '@', // init
    ESC + 'M' + '\x00', // select Font A (standard size, not the printer's condensed default)
    GS + '!' + '\x00', // normal character width/height (1x1), reset from any earlier state
  ];

  if (type === 'bill') {
    const now = new Date();
    const noW = 3;
    const qtyW = 5;
    const priceW = 9;
    const priceAmountGapW = 2; // extra breathing room so Price/Amount don't run together
    const amountW = 9;
    const nameW = Math.max(8, charWidth - noW - qtyW - priceW - priceAmountGapW - amountW);

    lines.push(
      ESC + 'a' + '\x01', // center
      ESC + 'E' + '\x01', // bold on
      GS + '!' + '\x11', // double width + double height (heading size)
      `${restaurant.name}\n`,
      GS + '!' + '\x00', // reset to normal size
      ESC + 'E' + '\x00'
    );
    restaurant.addressLines.forEach((line) => lines.push(`${line}\n`));
    lines.push(
      `Ph: ${restaurant.phone}\n`,
      `GSTIN: ${restaurant.gstin}\n`,
      divider,
      ESC + 'a' + '\x00', // left
      `Name: ${order.customerName || ''}\n`,
      divider,
      ESC + 'E' + '\x01',
      pad(`Date: ${formatDate(now)}`, `${order.orderType || 'Dine In'}: ${order.tableName}`),
      ESC + 'E' + '\x00',
      `${formatTime(now)}\n`,
      ESC + 'E' + '\x01',
      pad(`Cashier: ${order.cashier || '-'}`, `Bill No.: ${order.orderNo}`),
      ESC + 'E' + '\x00',
      divider,
      'No.'.padEnd(noW) +
        'Item'.padEnd(nameW) +
        'Qty.'.padStart(qtyW) +
        'Price'.padStart(priceW) +
        ' '.repeat(priceAmountGapW) +
        'Amount'.padStart(amountW) +
        '\n',
      thinDivider
    );

    let totalQty = 0;
    order.items.forEach((item, idx) => {
      totalQty += item.qty;
      const nameLines = wrapText(item.name, nameW);
      nameLines.forEach((nameLine, i) => {
        if (i === 0) {
          lines.push(
            String(idx + 1).padEnd(noW) +
              nameLine.padEnd(nameW) +
              String(item.qty).padStart(qtyW) +
              item.price.toFixed(2).padStart(priceW) +
              ' '.repeat(priceAmountGapW) +
              item.amount.toFixed(2).padStart(amountW) +
              '\n'
          );
        } else {
          lines.push(' '.repeat(noW) + nameLine.padEnd(nameW) + '\n');
        }
      });
    });

    // Stored/sent as one combined tax figure — split 50/50 for display only,
    // matching the CGST/SGST breakdown printed on Indian GST invoices.
    const halfTaxRate = (order.taxRate ?? 5) / 2;
    const halfTax = order.tax / 2;

    // Built manually (not via pad()) so just the two figures can be bolded —
    // pad()'s gap math is based on plain string length, which embedded ESC
    // bold codes would throw off if passed straight through.
    const totalQtyLabel = 'Total Qty: ';
    const totalQtyValue = String(totalQty);
    const subTotalLabel = 'Sub Total  ';
    const subTotalValue = order.subtotal.toFixed(2);
    const totalQtyRowGap = Math.max(
      1,
      charWidth - (totalQtyLabel.length + totalQtyValue.length) - (subTotalLabel.length + subTotalValue.length)
    );

    lines.push(
      divider,
      totalQtyLabel +
        ESC + 'E' + '\x01' + totalQtyValue + ESC + 'E' + '\x00' +
        ' '.repeat(totalQtyRowGap) +
        subTotalLabel +
        ESC + 'E' + '\x01' + subTotalValue + ESC + 'E' + '\x00' +
        '\n',
      ...(order.discount > 0 ? [pad('Discount', `-${order.discount.toFixed(2)}`)] : []),
      pad(`CGST ${halfTaxRate.toFixed(2)}%`, halfTax.toFixed(2)),
      pad(`SGST ${halfTaxRate.toFixed(2)}%`, halfTax.toFixed(2)),
      divider,
      ESC + 'E' + '\x01',
      pad('Grand Total', `Rs.${Math.round(order.total).toFixed(2)}`),
      ESC + 'E' + '\x00',
      divider,
      ESC + 'a' + '\x01',
      '!!! Thank You, Visit Again !!!\n\n\n\n\n',
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
      pad(`Date: ${formatDate(now)}`, `Time: ${formatTime(now)}`)
    );
    if (order.waiter) {
      lines.push(`Waiter: ${order.waiter}\n`);
    }
    lines.push(`Order Type: ${order.orderType || '-'}\n`);
    if (order.note) {
      lines.push(`Note: ${order.note}\n`);
    }
    lines.push(divider, pad('Item Name', 'Qty'), thinDivider);

    order.items.forEach((item) => {
      const { main, note } = splitItemName(item.name);
      lines.push(ESC + 'E' + '\x01', pad(main, String(item.qty)), ESC + 'E' + '\x00');
      if (note) lines.push(`  (${note})\n`);
    });

    lines.push(divider, '\n\n\n\n\n', GS + 'V' + '\x00');
  }

  return lines;
}

// DEV-ONLY: hex-dumps the exact bytes handed to qz.print(), so the output can
// be pasted into an online ESC/POS previewer. Remove this block (and its call
// site below) once print formatting is verified.
function logHexDump(type, data) {
  if (!import.meta.env.DEV) return;
  const hex = data
    .join('')
    .split('')
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  console.log(`[QZ print:${type}] hex (${hex.length / 2} bytes):`);
  console.log(hex);
}

/**
 * Print a bill or KOT. Tries QZ Tray (raw ESC/POS) first;
 * falls back to browser window.print() if QZ Tray isn't connected.
 *
 * @param {'bill'|'kot'} type
 * @param {object} order - normalized order data (see buildReceiptLines)
 * @param {string} printerName - QZ Tray printer name (optional, uses default if omitted)
 * @param {object} opts - { name, addressLines, phone, gstin, charWidth }
 */
export async function printReceipt(type, order, printerName, opts = {}) {
  const restaurant = {
    name: opts.name || RESTAURANT_INFO.name,
    addressLines: opts.addressLines || RESTAURANT_INFO.addressLines,
    phone: opts.phone || RESTAURANT_INFO.phone,
    gstin: opts.gstin || RESTAURANT_INFO.gstin,
  };
  const charWidth = opts.charWidth || 48;

  if (qzConnected) {
    try {
      const config = printerName
        ? qz.configs.create(printerName)
        : qz.configs.create(await qz.printers.getDefault());
      const data = buildReceiptLines({ type, restaurant, order, charWidth });
      logHexDump(type, data);
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
