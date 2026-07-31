import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getWaiters,
  createWaiter as apiCreateWaiter,
  updateWaiter as apiUpdateWaiter,
  deleteWaiter as apiDeleteWaiter,
  toggleWaiterActive as apiToggleWaiterActive,
} from '../services/api.js';

const WaiterContext = createContext(null);

export function WaiterProvider({ children }) {
  const [waiters, setWaiters] = useState([]);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    return getWaiters()
      .then((res) => {
        // The API returns active as 0/1 (MySQL tinyint); normalize to a real
        // boolean here so every consumer's `active !== false` check (written
        // when this was frontend-only state) keeps working unchanged — a
        // strict `0 !== false` would otherwise always be true in JS.
        setWaiters(res.data.map((w) => ({ ...w, active: w.active !== 0 })));
      })
      .catch(() => {
        // Backend unreachable — leave the list empty rather than show stale data.
      });
  }

  async function addWaiter(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await apiCreateWaiter({ name: trimmed });
    await refresh();
  }

  async function renameWaiter(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await apiUpdateWaiter(id, { name: trimmed });
    await refresh();
  }

  async function removeWaiter(id) {
    await apiDeleteWaiter(id);
    await refresh();
  }

  async function toggleWaiterActive(id) {
    await apiToggleWaiterActive(id);
    await refresh();
  }

  return (
    <WaiterContext.Provider
      value={{ waiters, addWaiter, renameWaiter, removeWaiter, toggleWaiterActive, refreshWaiters: refresh }}
    >
      {children}
    </WaiterContext.Provider>
  );
}

export function useWaiters() {
  const ctx = useContext(WaiterContext);
  if (!ctx) throw new Error('useWaiters must be used within a WaiterProvider');
  return ctx;
}
