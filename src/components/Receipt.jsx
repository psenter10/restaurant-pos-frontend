import React from 'react';
import { formatDate, formatTime, splitItemName, RESTAURANT_INFO } from '../services/print.js';

// Rendered off-screen; only visible via @media print rules (see styles/index.css).
// Used as the window.print() fallback when QZ Tray isn't connected.
export default function Receipt({ type, order, restaurant = RESTAURANT_INFO }) {
  if (!order) return null;

  if (type === 'kot') {
    const now = new Date();
    return (
      <div id="print-area" className="hidden">
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }}>KOT #{order.kotNo}</div>
        <div>--------------------------------</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Order #{order.orderNo}</span>
          <span style={{ fontWeight: 400 }}>Table: {order.tableName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date: {formatDate(now)}</span>
          <span>Time: {formatTime(now)}</span>
        </div>
        <div>
          Waiter: <b>{order.waiter || '-'}</b>
        </div>
        <div>
          Order Type: <b>{order.orderType || '-'}</b>
        </div>
        <div>--------------------------------</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Item Name</span>
          <span>Qty</span>
        </div>
        {order.items.map((item, idx) => {
          const { main, note } = splitItemName(item.name);
          return (
            <div key={idx}>
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

  return (
    <div id="print-area" className="hidden">
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18 }}>{restaurant.name}</div>
      {restaurant.addressLines.map((line, idx) => (
        <div key={idx} style={{ textAlign: 'center' }}>
          {line}
        </div>
      ))}
      <div style={{ textAlign: 'center' }}>Phone: {restaurant.phone}</div>
      <div style={{ textAlign: 'center' }}>GSTIN: {restaurant.gstin}</div>
      <div>--------------------------------</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>Order #{order.orderNo}</span>
        <span>
          {formatDate(now)} {formatTime(now)}
        </span>
      </div>
      <div>Waiter: {order.waiter || '-'}</div>
      <div>{order.orderType || '-'}</div>
      <div>--------------------------------</div>
      <div style={{ display: 'flex', fontWeight: 700 }}>
        <span style={{ width: '12%' }}>Qty</span>
        <span style={{ width: '44%' }}>Item Name</span>
        <span style={{ width: '22%', textAlign: 'right' }}>Price</span>
        <span style={{ width: '22%', textAlign: 'right' }}>Amount</span>
      </div>
      {order.items.map((item, idx) => {
        const { main, note } = splitItemName(item.name);
        return (
          <div key={idx}>
            <div style={{ display: 'flex' }}>
              <span style={{ width: '12%' }}>{item.qty}</span>
              <span style={{ width: '44%' }}>{main}</span>
              <span style={{ width: '22%', textAlign: 'right' }}>₹{item.price.toFixed(2)}</span>
              <span style={{ width: '22%', textAlign: 'right' }}>₹{item.amount.toFixed(2)}</span>
            </div>
            {note && (
              <div style={{ fontSize: 11, color: '#555', paddingLeft: '12%' }}>({note})</div>
            )}
          </div>
        );
      })}
      <div>--------------------------------</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Sub Total:</span>
        <span>₹{order.subtotal.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Discount</span>
        <span>-₹{(order.discount || 0).toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>GST (5%):</span>
        <span>₹{order.tax.toFixed(2)}</span>
      </div>
      <div>--------------------------------</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
        <span>Total:</span>
        <span>₹{order.total.toFixed(2)}</span>
      </div>
      <div>--------------------------------</div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>Thank you for your visit!</div>
    </div>
  );
}
