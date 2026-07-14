import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import CategorySidebar from '../components/CategorySidebar.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';
import OrderCart from '../components/OrderCart.jsx';
import Receipt from '../components/Receipt.jsx';
import ItemVariantModal from '../components/ItemVariantModal.jsx';
import SettleBillModal from '../components/SettleBillModal.jsx';
import { printReceipt, formatKotTime } from '../services/print.js';
import { IconSearch } from '../components/icons.jsx';
import { useMenu } from '../context/MenuContext.jsx';
import { useTables } from '../context/TableContext.jsx';
import { useLiveOrders } from '../context/LiveOrderContext.jsx';
import { useKots } from '../context/KotContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

function findTableEntry(sections, tableId) {
  for (const section of sections) {
    const table = section.tables.find((t) => t.id === tableId);
    if (table) return { table, sectionName: section.name };
  }
  return { table: null, sectionName: null };
}

// If tableId has been merged into another table, that other table is the
// only one that should be operable — this finds it so we can redirect away.
function findMergedIntoTable(sections, tableId) {
  for (const section of sections) {
    for (const table of section.tables) {
      if ((table.mergedWith || []).includes(tableId)) {
        return table;
      }
    }
  }
  return null;
}

export default function OrderPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { groups: menuGroups, items: menuItems } = useMenu();
  const { sections, updateTable } = useTables();
  const { getItems, addItems, setItems: setLiveItems, clearOrder } = useLiveOrders();
  const { addKot } = useKots();
  const { settings } = useSettings();
  const restaurant = {
    name: settings.restaurantName,
    addressLines: [settings.addressLine1, settings.addressLine2].filter(Boolean),
    phone: settings.phone,
    gstin: settings.gstin,
  };

  const { table: currentTable, sectionName } = findTableEntry(sections, tableId);
  const mergedIntoTable = findMergedIntoTable(sections, tableId);
  const modeParam = searchParams.get('mode');
  const mode = modeParam === 'bill' ? 'bill' : currentTable?.status === 'printed' ? 'settle' : 'kot';
  // Section-prefixed so identically-named tables in different sections
  // (e.g. "Table 1" in both A/C and Rooftop) aren't ambiguous in the merge picker.
  const allTables = sections.flatMap((s) =>
    s.tables.filter((t) => t.id !== tableId).map((t) => ({ id: t.id, name: `${s.name} - ${t.name}` }))
  );
  const sectionOrderType = sections.find((s) => s.name === sectionName)?.orderType || 'Dine In';

  const [activeGroup, setActiveGroup] = useState(menuGroups[0]?.name);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [cart, setCart] = useState(() => (mode === 'kot' ? [] : getItems(tableId)));
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptType, setReceiptType] = useState('bill');
  const [variantItem, setVariantItem] = useState(null);
  const [settlePayload, setSettlePayload] = useState(null);

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
      return [...prev, { ...item, qty: 1, lineId: item.id }];
    });
  }

  // Matches on lineId, not id — the same item can appear as separate lines
  // across multiple KOT rounds once it's loaded from the live order store,
  // so id alone would affect every round's line at once.
  function handleRemove(lineId) {
    setCart((prev) => prev.filter((i) => (i.lineId ?? i.id) !== lineId));
  }

  function handleQtyChange(lineId, delta) {
    setCart((prev) =>
      prev
        .map((i) => ((i.lineId ?? i.id) === lineId ? { ...i, qty: i.qty + delta } : i))
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
      return [...prev, { id: cartId, name, price: total, qty: 1, lineId: cartId }];
    });
    setVariantItem(null);
  }

  // KOT mode: cart holds only this round's new items. Printing merges them
  // into the table's running order and flips the table to Running.
  async function handleSaveKot(meta = {}) {
    if (cart.length === 0) return;
    const kotNo = Math.floor(Math.random() * 9000) + 1000;
    const kotTime = formatKotTime(new Date());
    const order = {
      tableName: meta.tableLabel || `Table ${tableId}`,
      kotNo,
      orderNo: meta.orderNo,
      waiter: meta.waiter,
      orderType: meta.orderType,
      note: meta.note,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, notes: i.notes })),
    };
    flushSync(() => {
      setReceiptType('kot');
      setReceiptOrder(order);
    });
    await printReceipt('kot', order, null, { charWidth: 42 });

    addKot({
      kotNo,
      tableId,
      tableName: order.tableName,
      waiter: meta.waiter,
      orderType: meta.orderType,
      note: meta.note,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, notes: i.notes })),
    });

    const merged = addItems(
      tableId,
      cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      { kotNo, kotTime }
    );
    const newTotal = merged.reduce((sum, i) => sum + i.price * i.qty, 0);
    if (sectionName) {
      updateTable(sectionName, tableId, {
        status: 'running',
        amount: newTotal,
        occupiedSince: currentTable?.occupiedSince ?? Date.now(),
      });
    }
    // TODO: POST to /orders/:id/items and create KOT rows via the CI4 API
    navigate('/');
  }

  // Bill mode: cart holds everything ordered so far. Printing the bill
  // flips the table to Printed (awaiting settle).
  async function handleGenerateBill({
    subtotal,
    discount,
    tax,
    taxRate,
    total,
    orderNo,
    waiter,
    orderType,
    tableLabel,
    customerName,
  }) {
    if (cart.length === 0) return;
    setLiveItems(
      tableId,
      cart.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        kotNo: i.kotNo,
        kotTime: i.kotTime,
        lineId: i.lineId,
      }))
    );
    const order = {
      orderNo,
      tableName: tableLabel || `Table ${tableId}`,
      waiter,
      orderType,
      customerName,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price, amount: i.price * i.qty })),
      subtotal,
      discount,
      tax,
      taxRate,
      total,
    };
    flushSync(() => {
      setReceiptType('bill');
      setReceiptOrder(order);
    });
    await printReceipt('bill', order, null, { charWidth: 42, ...restaurant });
    if (sectionName) {
      updateTable(sectionName, tableId, { status: 'printed', amount: total });
    }
    navigate('/');
  }

  // Settle mode: reprint doesn't change anything; settle frees the table.
  async function handleReprintBill({
    subtotal,
    discount,
    tax,
    taxRate,
    total,
    orderNo,
    waiter,
    orderType,
    tableLabel,
    customerName,
  }) {
    const order = {
      orderNo,
      tableName: tableLabel || `Table ${tableId}`,
      waiter,
      orderType,
      customerName,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price, amount: i.price * i.qty })),
      subtotal,
      discount,
      tax,
      taxRate,
      total,
    };
    flushSync(() => {
      setReceiptType('bill');
      setReceiptOrder(order);
    });
    await printReceipt('bill', order, null, { charWidth: 42, ...restaurant });
  }

  function handleOpenSettle(totals) {
    setSettlePayload(totals);
  }

  function handleMergeChange(mergedIds) {
    if (sectionName) {
      updateTable(sectionName, tableId, { mergedWith: mergedIds });
    }
  }

  function handleConfirmSettle() {
    const idsToFree = [tableId, ...(currentTable?.mergedWith || [])];
    idsToFree.forEach((id) => {
      clearOrder(id);
      const entry = findTableEntry(sections, id);
      if (entry.sectionName) {
        updateTable(entry.sectionName, id, { status: 'blank', mergedWith: [] });
      }
    });
    // TODO: POST to /orders/:id/close via the CI4 API
  }

  function handleSettleDone() {
    setSettlePayload(null);
    navigate('/');
  }

  // This table has been merged into another one — it's not independently
  // operable anymore, so bounce any direct URL access to the primary table.
  if (mergedIntoTable) {
    return <Navigate to={`/order/${mergedIntoTable.id}`} replace />;
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
        tableName={currentTable?.name || tableId}
        sectionName={sectionName}
        items={cart}
        onRemove={handleRemove}
        onQtyChange={handleQtyChange}
        mode={mode}
        onSaveKot={handleSaveKot}
        onGenerateBill={handleGenerateBill}
        onReprintBill={handleReprintBill}
        onOpenSettle={handleOpenSettle}
        allTables={allTables}
        initialMergedWith={currentTable?.mergedWith || []}
        onMergeChange={handleMergeChange}
        initialOrderType={sectionOrderType}
      />

      <Receipt type={receiptType} order={receiptOrder} restaurant={restaurant} />

      {variantItem && (
        <ItemVariantModal
          item={variantItem}
          onCancel={() => setVariantItem(null)}
          onSave={handleVariantSave}
        />
      )}

      {settlePayload && (
        <SettleBillModal
          tableName={currentTable?.name}
          items={cart}
          total={settlePayload.total}
          onClose={() => setSettlePayload(null)}
          onConfirm={handleConfirmSettle}
          onDone={handleSettleDone}
        />
      )}
    </div>
  );
}
