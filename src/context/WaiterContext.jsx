import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'pos_waiters';

// Seed data — these were previously a hardcoded list inside OrderCart.jsx.
const SEED_WAITERS = ['Ramesh', 'Suresh', 'Anita', 'Kavya', 'Vikram'].map((name, idx) => ({
  id: idx + 1,
  name,
}));

function loadWaiters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage, fall back to seed data
  }
  return SEED_WAITERS;
}

const WaiterContext = createContext(null);

export function WaiterProvider({ children }) {
  const [waiters, setWaiters] = useState(loadWaiters);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(waiters));
  }, [waiters]);

  function addWaiter(name) {
    const trimmed = name.trim();
    if (!trimmed || waiters.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) return;
    setWaiters((prev) => [...prev, { id: Date.now(), name: trimmed }]);
  }

  function renameWaiter(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWaiters((prev) => prev.map((w) => (w.id === id ? { ...w, name: trimmed } : w)));
  }

  function removeWaiter(id) {
    setWaiters((prev) => prev.filter((w) => w.id !== id));
  }

  function toggleWaiterActive(id) {
    setWaiters((prev) => prev.map((w) => (w.id === id ? { ...w, active: w.active === false } : w)));
  }

  return (
    <WaiterContext.Provider value={{ waiters, addWaiter, renameWaiter, removeWaiter, toggleWaiterActive }}>
      {children}
    </WaiterContext.Provider>
  );
}

export function useWaiters() {
  const ctx = useContext(WaiterContext);
  if (!ctx) throw new Error('useWaiters must be used within a WaiterProvider');
  return ctx;
}
