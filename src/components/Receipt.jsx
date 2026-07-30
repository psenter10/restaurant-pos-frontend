import React from 'react';
import { formatDate, formatTime, splitItemName, RESTAURANT_INFO } from '../services/print.js';

// Full-width solid rule — a literal string of dashes only spans however wide
// those characters render at, not the container, so it falls short of the
// actual receipt width. A border always spans 100%.
function Divider() {
  return <div style={{ borderTop: '1px solid #000', margin: '6px 0' }} />;
}

// Rendered off-screen; only visible via @media print rules (see styles/index.css).
// Used as the window.print() fallback when QZ Tray isn't connected.
export default function Receipt({ type, order, restaurant = RESTAURANT_INFO }) {
  if (!order) return null;

  if (type === 'kot') {
    const now = new Date();
    return (
      <div id="print-area" className="hidden">
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 21 }}>KOT #{order.kotNo}</div>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Order #{order.orderNo}</span>
          <span style={{ fontWeight: 400 }}>Table: {order.tableName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date: {formatDate(now)}</span>
          <span>Time: {formatTime(now)}</span>
        </div>
        {order.waiter && (
          <div>
            Waiter: <b>{order.waiter}</b>
          </div>
        )}
        <div>
          Order Type: <b>{order.orderType || '-'}</b>
        </div>
        {order.note && (
          <div>
            Note: <b>{order.note}</b>
          </div>
        )}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Item Name</span>
          <span>Qty</span>
        </div>
        {order.items.map((item, idx) => {
          const { main, note } = splitItemName(item.name);
          return (
            <div key={idx} style={{ padding: '7px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{main}</span>
                <span>{item.qty}</span>
              </div>
              {note && <div style={{ fontSize: 11, color: '#555' }}>({note})</div>}
            </div>
          );
        })}
      </div>
    );
  }

  const now = new Date();
  const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
  const halfTaxRate = ((order.taxRate ?? 5) / 2).toFixed(2);
  const halfTax = (order.tax / 2).toFixed(2);

  return (
    <div id="print-area" className="hidden">
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 21 }}>{restaurant.name}</div>
      {restaurant.addressLines.map((line, idx) => (
        <div key={idx} style={{ textAlign: 'center' }}>
          {line}
        </div>
      ))}
      <div style={{ textAlign: 'center' }}>Ph: {restaurant.phone}</div>
      <div style={{ textAlign: 'center' }}>GSTIN: {restaurant.gstin}</div>
      <Divider />
      <div>Name: {order.customerName || ''}</div>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>Date: {formatDate(now)}</span>
        <span>{order.orderType || 'Dine In'}: {order.tableName}</span>
      </div>
      <div>{formatTime(now)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>Cashier: {order.waiter || '-'}</span>
        <span>Bill No.: {order.orderNo}</span>
      </div>
      <Divider />
      <div style={{ display: 'flex', fontWeight: 700 }}>
        <span style={{ width: '8%' }}>No.</span>
        <span style={{ width: '42%' }}>Item</span>
        <span style={{ width: '16%', textAlign: 'right' }}>Qty.</span>
        <span style={{ width: '16%', textAlign: 'right' }}>Price</span>
        <span style={{ width: '18%', textAlign: 'right', paddingLeft: 10 }}>Amount</span>
      </div>
      <Divider />
      {order.items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', padding: '7px 0' }}>
          <span style={{ width: '8%' }}>{idx + 1}</span>
          <span style={{ width: '42%' }}>{item.name}</span>
          <span style={{ width: '16%', textAlign: 'right' }}>{item.qty}</span>
          <span style={{ width: '16%', textAlign: 'right' }}>{item.price.toFixed(2)}</span>
          <span style={{ width: '18%', textAlign: 'right', paddingLeft: 10 }}>{item.amount.toFixed(2)}</span>
        </div>
      ))}
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Total Qty: <b>{totalQty}</b></span>
        <span>Sub Total <b>{order.subtotal.toFixed(2)}</b></span>
      </div>
      {order.discount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Discount</span>
          <span>-{order.discount.toFixed(2)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>CGST {halfTaxRate}%</span>
        <span>{halfTax}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>SGST {halfTaxRate}%</span>
        <span>{halfTax}</span>
      </div>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
        <span>Grand Total</span>
        <span>₹{Math.round(order.total).toFixed(2)}</span>
      </div>
      <Divider />
      <div style={{ textAlign: 'center', marginTop: 8 }}>!!! Thank You, Visit Again !!!</div>
    </div>
  );
}
