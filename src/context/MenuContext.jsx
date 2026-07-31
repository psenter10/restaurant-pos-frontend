import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  toggleMenuCategoryAvailability,
  getMenuGroups,
  createMenuGroup,
  updateMenuGroup,
  deleteMenuGroup,
  toggleMenuGroupAvailability,
  addCategoryToGroup as apiAddCategoryToGroup,
  removeCategoryFromGroup as apiRemoveCategoryFromGroup,
  getMenuItems,
  createMenuItem,
  updateMenuItem as apiUpdateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemFavourite,
} from '../services/api.js';

const MenuContext = createContext(null);

// The API models categories as entities with their own id/available and
// items reference them by category_id; the app has always used a plain
// category name string on items/groups (MenuPage, OrderPage, CategorySidebar),
// so that join happens here and every consumer keeps working unchanged.
function mapCategory(row) {
  return { id: row.id, name: row.name, available: row.available !== 0 };
}

function mapGroup(row) {
  return {
    id: row.id,
    name: row.name,
    available: row.available !== 0,
    categories: (row.categories || []).map((c) => c.name),
  };
}

function mapItem(row, categoryById) {
  const item = {
    id: row.id,
    name: row.name,
    shortCode: row.short_code || '',
    price: Number(row.price),
    category: categoryById.get(row.category_id)?.name || '',
    veg: row.veg !== 0,
    available: row.available !== 0,
    isFavourite: row.is_favourite !== 0,
  };
  if (row.variants?.length) {
    item.variants = row.variants.map((v) => ({ id: v.id, name: v.name, price: Number(v.price) }));
  }
  if (row.addons?.length) {
    item.addons = row.addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) }));
  }
  return item;
}

export function MenuProvider({ children }) {
  const [categoryRows, setCategoryRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  // Only true until the very first load completes — a manual "Reload Menu"
  // click or a mutation's own refresh() shouldn't re-flash a full loading
  // state, so those are tracked by the caller instead (see OrderPage).
  const [loading, setLoading] = useState(true);

  const categories = useMemo(() => categoryRows.map((c) => c.name).sort(), [categoryRows]);
  const categoryByName = useMemo(() => new Map(categoryRows.map((c) => [c.name, c])), [categoryRows]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function refresh() {
    return Promise.all([getMenuCategories(), getMenuGroups(), getMenuItems()])
      .then(([catRes, groupRes, itemRes]) => {
        const cats = catRes.data.map(mapCategory);
        const catById = new Map(cats.map((c) => [c.id, c]));
        setCategoryRows(cats);
        setGroups(groupRes.data.map(mapGroup));
        setItems(itemRes.data.map((row) => mapItem(row, catById)));
      })
      .catch(() => {
        // Backend unreachable — leave the menu empty rather than show stale data.
      });
  }

  // --- Items ---
  // ItemFormModal always submits the complete desired item shape (not a
  // partial patch), matching the API's full-replace semantics for variants/addons.
  async function addItem(data) {
    const cat = categoryByName.get(data.category);
    if (!cat) return;
    await createMenuItem({
      name: data.name,
      category_id: cat.id,
      price: data.price,
      veg: data.veg,
      available: data.available,
      variants: data.variants ?? [],
      addons: data.addons ?? [],
    });
    await refresh();
  }

  async function updateItem(id, data) {
    const cat = categoryByName.get(data.category);
    if (!cat) return;
    await apiUpdateMenuItem(id, {
      name: data.name,
      category_id: cat.id,
      price: data.price,
      veg: data.veg,
      available: data.available,
      variants: data.variants ?? [],
      addons: data.addons ?? [],
    });
    await refresh();
  }

  async function removeItem(id) {
    await deleteMenuItem(id);
    await refresh();
  }

  async function toggleAvailability(id) {
    await toggleMenuItemAvailability(id);
    await refresh();
  }

  async function toggleFavourite(id) {
    await toggleMenuItemFavourite(id);
    await refresh();
  }

  // --- Categories ---
  async function addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createMenuCategory({ name: trimmed });
    await refresh();
  }

  async function renameCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const cat = categoryByName.get(oldName);
    if (!cat) return;
    await updateMenuCategory(cat.id, { name: trimmed });
    await refresh();
  }

  async function deleteCategory(name) {
    const cat = categoryByName.get(name);
    if (!cat) return;
    await deleteMenuCategory(cat.id);
    await refresh();
  }

  function isCategoryAvailable(name) {
    return categoryByName.get(name)?.available !== false;
  }

  async function toggleCategoryAvailability(name) {
    const cat = categoryByName.get(name);
    if (!cat) return;
    await toggleMenuCategoryAvailability(cat.id);
    await refresh();
  }

  // --- Groups ---
  async function addGroup(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createMenuGroup({ name: trimmed });
    await refresh();
  }

  async function renameGroup(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const group = groups.find((g) => g.name === oldName);
    if (!group) return;
    await updateMenuGroup(group.id, { name: trimmed });
    await refresh();
  }

  async function deleteGroup(name) {
    const group = groups.find((g) => g.name === name);
    if (!group) return;
    await deleteMenuGroup(group.id);
    await refresh();
  }

  async function toggleGroupAvailability(name) {
    const group = groups.find((g) => g.name === name);
    if (!group) return;
    await toggleMenuGroupAvailability(group.id);
    await refresh();
  }

  async function addCategoryToGroup(groupName, categoryName) {
    const group = groups.find((g) => g.name === groupName);
    const cat = categoryByName.get(categoryName);
    if (!group || !cat) return;
    await apiAddCategoryToGroup(group.id, cat.id);
    await refresh();
  }

  async function removeCategoryFromGroup(groupName, categoryName) {
    const group = groups.find((g) => g.name === groupName);
    const cat = categoryByName.get(categoryName);
    if (!group || !cat) return;
    await apiRemoveCategoryFromGroup(group.id, cat.id);
    await refresh();
  }

  return (
    <MenuContext.Provider
      value={{
        groups,
        items,
        categories,
        loading,
        refreshMenu: refresh,
        addItem,
        updateItem,
        removeItem,
        toggleAvailability,
        toggleFavourite,
        addCategory,
        renameCategory,
        deleteCategory,
        isCategoryAvailable,
        toggleCategoryAvailability,
        addGroup,
        renameGroup,
        deleteGroup,
        toggleGroupAvailability,
        addCategoryToGroup,
        removeCategoryFromGroup,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within a MenuProvider');
  return ctx;
}
