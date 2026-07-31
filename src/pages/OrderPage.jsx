import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import CategorySidebar from '../components/CategorySidebar.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';
import OrderCart from '../components/OrderCart.jsx';
import Receipt from '../components/Receipt.jsx';
import ItemVariantModal from '../components/ItemVariantModal.jsx';
import SettleBillModal from '../components/SettleBillModal.jsx';
import { printReceipt } from '../services/print.js';
import Spinner from '../components/Spinner.jsx';
import { IconSearch, IconRefresh } from '../components/icons.jsx';
import { useMenu } from '../context/MenuContext.jsx';
import { useTables } from '../context/TableContext.jsx';
import { useWaiters } from '../context/WaiterContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import { getTableOrder, saveKot, generateBill, settleOrder } from '../services/api.js';
import { getOrderMeta, setOrderMeta, clearOrderMeta } from '../services/orderMeta.js';

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

// GET /tables/:id/order items are DB rows (menu_item_id, kot_no, kot_time,
// decimal-as-string price) — the cart has always used this camelCase shape
// with a real number price and a lineId unique per row.
function mapOrderItems(items) {
  return (items || []).map((item) => ({
    id: item.menu_item_id ?? `adhoc-${item.id}`,
    name: item.name,
    price: Number(item.price),
    qty: item.qty,
    notes: item.notes || undefined,
    kotNo: item.kot_no,
    kotTime: item.kot_time,
    lineId: item.id,
  }));
}

export default function OrderPage() {
  // Route params are always strings, but table ids from the API are real
  // numbers — without this coercion every t.id === tableId check below
  // (findTableEntry, merge-table exclusion, etc.) would silently never match.
  const tableId = Number(useParams().tableId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { groups: menuGroups, items: menuItems, loading: menuLoading, refreshMenu } = useMenu();
  const { sections, updateTable, refreshTables } = useTables();
  const { waiters } = useWaiters();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();
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
  // Order screen opens on favourites by default; picking a group/category/all
  // items switches out of it (see handleSelectGroup/handleSelectCategory below).
  const [showFavourites, setShowFavourites] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);
  const [reloadingMenu, setReloadingMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  // Waiter/Pax captured on this table's first KOT — prefills every later KOT
  // round, Bill, and Settle screen. Seeded synchronously from the local
  // cache, then reconciled with the order's own persisted values once fetched.
  const [orderMeta, setOrderMetaState] = useState(() => getOrderMeta(tableId));
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptType, setReceiptType] = useState('bill');
  // Who opened this order (orders.created_by) -- printed as "Cashier" on the
  // bill, distinct from the waiter dropdown which stays waiter-only.
  const [cashierName, setCashierName] = useState('');
  const [variantItem, setVariantItem] = useState(null);
  const [settlePayload, setSettlePayload] = useState(null);

  // menuGroups loads asynchronously from the API and is [] on first render,
  // so the useState initializer above can't pick a group — fall back to the
  // first one once the menu actually arrives.
  useEffect(() => {
    if (!activeGroup && menuGroups.length > 0) {
      setActiveGroup(menuGroups[0].name);
    }
  }, [menuGroups, activeGroup]);

  // KOT mode starts each round's cart empty; Bill/Settle mode loads whatever
  // has actually been ordered so far for this table's open order.
  useEffect(() => {
    let cancelled = false;
    setLoadingOrder(true);
    setOrderMetaState(getOrderMeta(tableId));
    getTableOrder(tableId)
      .then((res) => {
        if (cancelled) return;
        const { order, items } = res.data;
        setOrderId(order?.id ?? null);
        setCashierName(order?.created_by_username || '');
        if (mode !== 'kot') {
          setCart(mapOrderItems(items));
        }
        // The order itself only carries waiter_id/pax once a bill has been
        // generated — prefer that once it exists, otherwise keep the local cache.
        if (order?.waiter_id != null || order?.pax != null) {
          setOrderMetaState((prev) => ({
            waiter: waiters.find((w) => w.id === order.waiter_id)?.name || prev.waiter,
            pax: order.pax ?? prev.pax,
          }));
        }
      })
      .catch(() => {
        // Backend unreachable — table screen still renders with an empty cart.
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, mode]);

  const availableItems = menuItems.filter((i) => i.available !== false);
  const groupCategories = menuGroups.find((g) => g.name === activeGroup)?.categories || [];
  const groupFiltered = availableItems.filter((i) => groupCategories.includes(i.category));
  const categoryFiltered = activeCategory
    ? groupFiltered.filter((i) => i.category === activeCategory)
    : groupFiltered;
  const scopedItems = showAllItems
    ? availableItems
    : showFavourites
    ? availableItems.filter((i) => i.isFavourite)
    : categoryFiltered;
  // Code search is universal — it bypasses the active group/category/
  // favourites scoping entirely, so an item shows up even if it isn't part
  // of whatever's currently selected on the left. Clearing it restores
  // whatever was selected before, since none of that state gets touched.
  const filteredItems = codeSearch.trim()
    ? availableItems.filter((i) => i.shortCode?.includes(codeSearch.trim()))
    : search.trim()
    ? scopedItems.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : scopedItems;

  function handleSelectGroup(name) {
    setShowFavourites(false);
    setShowAllItems(false);
    setActiveGroup(name);
  }

  function handleSelectCategory(category) {
    setShowFavourites(false);
    setShowAllItems(false);
    setActiveCategory(category);
  }

  function handleSelectFavourites() {
    setShowAllItems(false);
    setShowFavourites(true);
  }

  function handleSelectAllItems() {
    setShowFavourites(false);
    setShowAllItems(true);
  }

  async function handleReloadMenu() {
    setReloadingMenu(true);
    await refreshMenu();
    setReloadingMenu(false);
  }

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
  // across multiple KOT rounds once it's loaded from the order, so id alone
  // would affect every round's line at once.
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

  // The Billing panel only totals up what's already been sent via KOT, and
  // once a bill is printed the order is locked in Settle mode too — neither
  // allows adding or editing items from here on.
  function handleItemClick(item) {
    if (mode === 'settle' || mode === 'bill') return;
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

  function waiterIdByName(name) {
    return waiters.find((w) => w.name === name)?.id;
  }

  // KOT mode: cart holds only this round's new items. Saving finds-or-creates
  // the table's open order, inserts a new KOT round, and flips the table to
  // Running — all server-side, so the printed ticket only happens once that
  // has actually been recorded.
  async function handleSaveKot(meta = {}) {
    if (cart.length === 0) return;
    try {
      const res = await saveKot(tableId, {
        order_type: meta.orderType,
        waiter_id: waiterIdByName(meta.waiter),
        pax: meta.pax || undefined,
        note: meta.note?.trim() || undefined,
        items: cart.map((i) => ({
          menu_item_id: typeof i.id === 'number' ? i.id : null,
          name: i.name,
          price: i.price,
          qty: i.qty,
          notes: i.notes,
        })),
      });

      setOrderId(res.data.order_id);

      const order = {
        tableName: meta.tableLabel || `Table ${tableId}`,
        kotNo: res.data.kot.kot_no,
        orderNo: res.data.order_id,
        waiter: meta.waiter,
        orderType: meta.orderType,
        note: meta.note,
        items: cart.map((i) => ({ name: i.name, qty: i.qty, notes: i.notes })),
      };
      flushSync(() => {
        setReceiptType('kot');
        setReceiptOrder(order);
      });
      await printReceipt('kot', order, null, { charWidth: 48 });

      // saveKot now persists waiter/pax on the order itself, but this local
      // cache stays as a same-device fallback (e.g. brief backend hiccups)
      // so these fields keep prefilling every later KOT round, Bill, and
      // Settle screen for this table regardless.
      setOrderMeta(tableId, { waiter: meta.waiter, pax: meta.pax });

      showSuccess('KOT saved.');
      await refreshTables();
      navigate('/');
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not save the KOT. Please try again.'));
    }
  }

  // Bill mode: cart holds everything ordered so far. Generating the bill
  // persists the computed totals and flips the table to Printed (awaiting
  // settle) — guarded server-side (409) if no KOT has been saved yet.
  async function handleGenerateBill({
    subtotal,
    discount,
    tax,
    taxRate,
    total,
    waiter,
    orderType,
    tableLabel,
    customerName,
  }) {
    if (cart.length === 0 || !orderId) return;
    try {
      await generateBill(orderId, {
        order_type: orderType,
        waiter_id: waiterIdByName(waiter),
        customer_name: customerName?.trim() || undefined,
        subtotal,
        discount,
        tax,
        tax_rate: taxRate,
        total,
      });

      const order = {
        orderNo: orderId,
        tableName: tableLabel || `Table ${tableId}`,
        waiter,
        cashier: cashierName,
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
      await printReceipt('bill', order, null, { charWidth: 48, ...restaurant });

      showSuccess('Bill generated.');
      await refreshTables();
      navigate('/');
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not generate the bill. Please try again.'));
    }
  }

  // Settle mode: reprint doesn't change anything server-side, just re-prints
  // using the totals already computed for this order.
  async function handleReprintBill({
    subtotal,
    discount,
    tax,
    taxRate,
    total,
    waiter,
    orderType,
    tableLabel,
    customerName,
  }) {
    const order = {
      orderNo: orderId,
      tableName: tableLabel || `Table ${tableId}`,
      waiter,
      cashier: cashierName,
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
    await printReceipt('bill', order, null, { charWidth: 48, ...restaurant });
  }

  // Reprints one KOT round from the Billing panel — pulls just that round's
  // items back out of the shared cart (they all carry the kotNo they were
  // sent under) and re-sends the same ticket layout used on the original save.
  async function handleReprintKot({ kotNo, tableLabel, waiter, orderType }) {
    const order = {
      kotNo,
      tableName: tableLabel || `Table ${tableId}`,
      waiter,
      orderType,
      items: cart
        .filter((i) => i.kotNo === kotNo)
        .map((i) => ({ name: i.name, qty: i.qty, notes: i.notes })),
    };
    flushSync(() => {
      setReceiptType('kot');
      setReceiptOrder(order);
    });
    await printReceipt('kot', order, null, { charWidth: 48 });
  }

  function handleOpenSettle(totals) {
    setSettlePayload(totals);
  }

  function handleMergeChange(mergedIds) {
    if (sectionName) {
      updateTable(sectionName, tableId, { mergedWith: mergedIds });
    }
  }

  // Records payment and closes the order — guarded server-side (409) if the
  // table isn't currently Printed. Frees this table and anything merged into
  // it automatically, so no local table-status bookkeeping is needed here.
  async function handleConfirmSettle(payload) {
    if (!orderId) return;
    try {
      await settleOrder(orderId, payload);
      clearOrderMeta(tableId);
      showSuccess('Bill settled.');
      await refreshTables();
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not settle the bill. Please try again.'));
      throw err;
    }
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
        onSelectGroup={handleSelectGroup}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        showFavourites={showFavourites}
        onSelectFavourites={handleSelectFavourites}
        showAllItems={showAllItems}
        onSelectAllItems={handleSelectAllItems}
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
          <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 w-40 bg-white">
            <IconSearch className="w-4 h-4 text-ink-soft" />
            <input
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              placeholder="Item code"
              className="outline-none bg-transparent text-sm w-full"
            />
          </div>
          <button
            onClick={handleReloadMenu}
            disabled={reloadingMenu}
            title="Reload menu items from the server"
            className="flex items-center gap-1.5 border border-line rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-line/40 disabled:opacity-60 whitespace-nowrap"
          >
            <IconRefresh className={`w-4 h-4 ${reloadingMenu ? 'animate-spin' : ''}`} />
            Reload Menu
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
          {menuLoading && menuItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-soft text-sm">
              <Spinner className="w-6 h-6" />
              <span>Loading menu…</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onAdd={handleItemClick} disabled={mode === 'settle' || mode === 'bill'} />
              ))}
            </div>
          )}
        </div>

        <div className="py-2.5 text-center text-sm text-ink-soft/70 border-t border-line bg-white">
          Design &amp; Developed by : Layoncube
        </div>
      </div>

      <OrderCart
        tableId={tableId}
        tableName={currentTable?.name || tableId}
        sectionName={sectionName}
        orderId={orderId}
        items={cart}
        loading={loadingOrder}
        onRemove={handleRemove}
        onQtyChange={handleQtyChange}
        mode={mode}
        onSaveKot={handleSaveKot}
        onGenerateBill={handleGenerateBill}
        onReprintBill={handleReprintBill}
        onReprintKot={handleReprintKot}
        onOpenSettle={handleOpenSettle}
        allTables={allTables}
        initialMergedWith={currentTable?.mergedWith || []}
        onMergeChange={handleMergeChange}
        initialOrderType={sectionOrderType}
        initialWaiter={orderMeta.waiter || ''}
        initialPax={orderMeta.pax ?? ''}
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
