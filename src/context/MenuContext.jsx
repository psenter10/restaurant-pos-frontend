import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/api.js';

const STORAGE_KEY = 'pos_menu_data';

// Seed data so the app renders before the CI4 API + admin edits are in place.
const SEED_GROUPS = [
  { name: 'Fast Food', categories: ['Burgers', 'Egg', 'Hawaiian Wraps', 'Maggi Lover', 'Pizza'], available: true },
  { name: 'Starters', categories: ['Chakhna', 'Chinese Snacks', 'Garlic Bread'], available: true },
  { name: 'Main Course', categories: ['Chicken', 'Gravy Items', 'Chinese Soups'], available: true },
  { name: 'Beverages', categories: ['Beverages'], available: true },
];

const SEED_ITEMS = [
  { id: 1, name: 'Aloo Tikki Burger', price: 120, category: 'Burgers', veg: true, available: true },
  { id: 2, name: 'Cheese Garlic Bread', price: 150, category: 'Garlic Bread', veg: true, available: true },
  { id: 3, name: 'Chiken Angara (Boneless)', price: 260, category: 'Chicken', veg: false, available: true },
  { id: 4, name: 'Chilli Mushroom', price: 190, category: 'Chinese Snacks', veg: true, available: true },
  { id: 5, name: 'Dahi Ke Shole', price: 140, category: 'Chakhna', veg: true, available: true },
  { id: 6, name: 'Fry Masala Papad', price: 60, category: 'Chakhna', veg: true, available: true },
  { id: 7, name: 'Green Salad', price: 80, category: 'Chakhna', veg: true, available: true },
  { id: 8, name: 'Grilled Paneer Sandwich', price: 130, category: 'Burgers', veg: true, available: true },
  { id: 9, name: 'Hakka Noodles', price: 150, category: 'Chinese Snacks', veg: true, available: true },
  { id: 10, name: 'Masala Dosa', price: 110, category: 'Chakhna', veg: true, available: true },
  { id: 11, name: 'Omlate (3 Eggs)', price: 90, category: 'Egg', veg: false, available: true },
  { id: 12, name: 'Open Item', price: 0, category: 'Chakhna', veg: true, available: true },
  { id: 13, name: 'Oreo Shake', price: 140, category: 'Beverages', veg: true, available: true },
  { id: 14, name: 'Paneer Wrap', price: 150, category: 'Hawaiian Wraps', veg: true, available: true },
  { id: 15, name: 'Raj Kachodi', price: 90, category: 'Chakhna', veg: true, available: true },
  { id: 16, name: 'RasMalai', price: 100, category: 'Chakhna', veg: true, available: true },
  { id: 17, name: 'Salted Lassi', price: 70, category: 'Beverages', veg: true, available: true },
  { id: 18, name: 'Spl. Shahi Paneer', price: 220, category: 'Gravy Items', veg: true, available: true },
  { id: 19, name: 'Spring Roll', price: 140, category: 'Chinese Snacks', veg: true, available: true },
  { id: 20, name: 'Strawberry Mojito', price: 130, category: 'Beverages', veg: true, available: true },
  { id: 21, name: 'Sweet Corn Soup', price: 110, category: 'Chinese Soups', veg: true, available: true },
  { id: 22, name: 'Tandoori Momos (8 Pcs)', price: 180, category: 'Chinese Snacks', veg: true, available: true },
  { id: 23, name: 'Tandoori Pasta', price: 200, category: 'Gravy Items', veg: true, available: true },
  { id: 24, name: 'Veg Burger', price: 110, category: 'Burgers', veg: true, available: true },
  { id: 25, name: 'Water Bottle', price: 20, category: 'Beverages', veg: true, available: true },
  {
    id: 26,
    name: 'Mexican Farm House',
    price: 220,
    category: 'Pizza',
    veg: true,
    available: true,
    variants: [
      { name: 'Small', price: 220 },
      { name: 'Medium', price: 410 },
      { name: 'Large', price: 649 },
      { name: 'Extra Large', price: 749 },
    ],
    addons: [
      { name: 'Extra Cheese', price: 80 },
      { name: 'Thin Crust', price: 60 },
      { name: 'Pan Base', price: 50 },
      { name: 'Extra Toppings', price: 50 },
      { name: 'Cheese Burst', price: 160 },
    ],
  },
];

const SEED_CATEGORIES = Array.from(new Set(SEED_ITEMS.map((i) => i.category))).sort();

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.groups && parsed.items && parsed.categories) {
        return { categoryAvailability: {}, ...parsed };
      }
    }
  } catch {
    // ignore corrupt storage, fall back to seed data
  }
  return { groups: SEED_GROUPS, items: SEED_ITEMS, categories: SEED_CATEGORIES, categoryAvailability: {} };
}

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const initial = loadInitial();
  const [groups, setGroups] = useState(initial.groups);
  const [items, setItems] = useState(initial.items);
  const [categories, setCategories] = useState(initial.categories);
  // Categories stay plain strings (items/groups reference them by name), so
  // availability lives in a parallel name→bool map instead of on the string.
  const [categoryAvailability, setCategoryAvailability] = useState(initial.categoryAvailability);

  useEffect(() => {
    getMenuItems()
      .then((res) => setItems(res.data))
      .catch(() => {
        // API not reachable yet — keep localStorage/seed data
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, items, categories, categoryAvailability }));
  }, [groups, items, categories, categoryAvailability]);

  function addItem(data) {
    const newItem = { available: true, veg: true, ...data, id: Date.now() };
    setItems((prev) => [...prev, newItem]);
    createMenuItem(newItem).catch(() => {});
  }

  function updateItem(id, patch) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    updateMenuItem(id, patch).catch(() => {});
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    deleteMenuItem(id).catch(() => {});
  }

  function toggleAvailability(id) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: i.available === false } : i)));
  }

  function addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed].sort());
  }

  function renameCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || categories.includes(trimmed)) return;
    setCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)).sort());
    setItems((prev) => prev.map((i) => (i.category === oldName ? { ...i, category: trimmed } : i)));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        categories: g.categories.map((c) => (c === oldName ? trimmed : c)),
      }))
    );
    setCategoryAvailability((prev) => {
      if (!(oldName in prev)) return prev;
      const { [oldName]: value, ...rest } = prev;
      return { ...rest, [trimmed]: value };
    });
  }

  function deleteCategory(name) {
    setCategories((prev) => prev.filter((c) => c !== name));
    setItems((prev) => prev.filter((i) => i.category !== name));
    setGroups((prev) => prev.map((g) => ({ ...g, categories: g.categories.filter((c) => c !== name) })));
    setCategoryAvailability((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function isCategoryAvailable(name) {
    return categoryAvailability[name] !== false;
  }

  function toggleCategoryAvailability(name) {
    setCategoryAvailability((prev) => ({ ...prev, [name]: prev[name] === false }));
  }

  function addGroup(name) {
    const trimmed = name.trim();
    if (!trimmed || groups.some((g) => g.name === trimmed)) return;
    setGroups((prev) => [...prev, { name: trimmed, categories: [], available: true }]);
  }

  function renameGroup(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setGroups((prev) => prev.map((g) => (g.name === oldName ? { ...g, name: trimmed } : g)));
  }

  function deleteGroup(name) {
    setGroups((prev) => prev.filter((g) => g.name !== name));
  }

  function toggleGroupAvailability(name) {
    setGroups((prev) =>
      prev.map((g) => (g.name === name ? { ...g, available: g.available === false } : g))
    );
  }

  function addCategoryToGroup(groupName, categoryName) {
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName && !g.categories.includes(categoryName)
          ? { ...g, categories: [...g.categories, categoryName] }
          : g
      )
    );
  }

  function removeCategoryFromGroup(groupName, categoryName) {
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName ? { ...g, categories: g.categories.filter((c) => c !== categoryName) } : g
      )
    );
  }

  return (
    <MenuContext.Provider
      value={{
        groups,
        items,
        categories,
        addItem,
        updateItem,
        removeItem,
        toggleAvailability,
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
