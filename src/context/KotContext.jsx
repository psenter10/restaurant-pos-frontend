import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'pos_kots';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage, fall back to an empty board
  }
  return [];
}

const KotContext = createContext(null);

// Backs the Kitchen Display's 3-column board (New/Preparing/Completed).
// OrderPage.handleSaveKot() calls addKot() right after printing a KOT so it
// shows up on the board immediately; KotPage drives the status transitions.
export function KotProvider({ children }) {
  const [kots, setKots] = useState(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kots));
  }, [kots]);

  function addKot({ kotNo, tableId, tableName, waiter, orderType, note, items }) {
    const kot = {
      id: `${tableId}-${kotNo}-${Date.now()}`,
      kotNo,
      tableId,
      tableName,
      waiter,
      orderType,
      note,
      items,
      status: 'new',
      createdAt: Date.now(),
      preparingAt: null,
      completedAt: null,
    };
    setKots((prev) => [...prev, kot]);
    return kot;
  }

  function markPreparing(id) {
    setKots((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'preparing', preparingAt: Date.now() } : k))
    );
  }

  function markCompleted(id) {
    setKots((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'completed', completedAt: Date.now() } : k))
    );
  }

  function cancelKot(id) {
    setKots((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <KotContext.Provider value={{ kots, addKot, markPreparing, markCompleted, cancelKot }}>
      {children}
    </KotContext.Provider>
  );
}

export function useKots() {
  const ctx = useContext(KotContext);
  if (!ctx) throw new Error('useKots must be used within a KotProvider');
  return ctx;
}
