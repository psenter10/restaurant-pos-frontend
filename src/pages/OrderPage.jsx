import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import CategorySidebar from '../components/CategorySidebar.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';
import OrderCart from '../components/OrderCart.jsx';
import Receipt from '../components/Receipt.jsx';
import ItemVariantModal from '../components/ItemVariantModal.jsx';
import { printReceipt } from '../services/print.js';
import { IconSearch } from '../components/icons.jsx';
import { useMenu } from '../context/MenuContext.jsx';

export default function OrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { groups: menuGroups, items: menuItems } = useMenu();

  const [activeGroup, setActiveGroup] = useState(menuGroups[0]?.name);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [cart, setCart] = useState([]);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptType, setReceiptType] = useState('bill');
  const [variantItem, setVariantItem] = useState(null);

  const availableItems = menuItems.filter((i) => i.available !== false);
  const groupCategories = menuGroups.find((g) => g.name === activeGroup)?.categories || [];
  const groupFiltered = availableItems.filter((i) => groupCategories.includes(i.category));
  const categoryFiltered = activeCategory
    ? groupFiltered.filter((i) => i.category === activeCategory)
    : groupFiltered;
  const filteredItems = search.trim()
    ? categoryFiltered.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : categoryFiltered;

  function handleAdd(item) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function handleRemove(itemId) {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }

  function handleQtyChange(itemId, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function handleItemClick(item) {
    if (item.variants?.length) {
      setVariantItem(item);
    } else {
      handleAdd(item);
    }
  }

  function handleVariantSave(variant, addons, total) {
    const addonNames = addons.map((a) => a.name);
    const name = `${variantItem.name} (${variant.name}${addonNames.length ? ' + ' + addonNames.join(', ') : ''})`;
    const cartId = `${variantItem.id}-${variant.name}-${addonNames.slice().sort().join('-')}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartId);
      if (existing) {
        return prev.map((i) => (i.id === cartId ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: cartId, name, price: total, qty: 1 }];
    });
    setVariantItem(null);
  }

  async function handleSendKot(meta = {}) {
    const order = {
      tableName: meta.tableLabel || `Table ${tableId}`,
      kotNo: Math.floor(Math.random() * 9000) + 1000,
      orderNo: meta.orderNo,
      waiter: meta.waiter,
      orderType: meta.orderType,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, notes: i.notes })),
    };
    flushSync(() => {
      setReceiptType('kot');
      setReceiptOrder(order);
    });
    await printReceipt('kot', order, null, { charWidth: 42 });
    // TODO: POST to /orders/:id/items and create KOT rows via the CI4 API
  }

  async function handleSettle({
    subtotal,
    discount,
    tax,
    total,
    print = true,
    orderNo,
    waiter,
    orderType,
    tableLabel,
  }) {
    const order = {
      orderNo,
      tableName: tableLabel || `Table ${tableId}`,
      waiter,
      orderType,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price, amount: i.price * i.qty })),
      subtotal,
      discount,
      tax,
      total,
    };
    flushSync(() => {
      setReceiptType('bill');
      setReceiptOrder(order);
    });
    if (print) {
      await printReceipt('bill', order, null, { charWidth: 42 });
    }
    // TODO: POST to /orders/:id/close via the CI4 API, then free the table
    navigate('/');
  }

  return (
    <div className="flex h-[calc(100vh-72px)] -mx-6 -my-6 overflow-hidden">
      <CategorySidebar
        groups={menuGroups}
        activeGroup={activeGroup}
        onSelectGroup={setActiveGroup}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-paper">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line bg-white">
          <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
            <IconSearch className="w-4 h-4 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item"
              className="outline-none bg-transparent text-sm w-full"
            />
          </div>
          <input
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
            placeholder="Short Code"
            className="border border-line rounded-md px-3 py-2 text-sm outline-none w-40 bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={handleItemClick} />
            ))}
          </div>
        </div>
      </div>

      <OrderCart
        tableId={tableId}
        items={cart}
        onRemove={handleRemove}
        onQtyChange={handleQtyChange}
        onSendKot={handleSendKot}
        onSettle={handleSettle}
      />

      <Receipt type={receiptType} order={receiptOrder} />

      {variantItem && (
        <ItemVariantModal
          item={variantItem}
          onCancel={() => setVariantItem(null)}
          onSave={handleVariantSave}
        />
      )}
    </div>
  );
}
