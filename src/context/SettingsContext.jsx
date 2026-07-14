import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'pos_settings';

// Seed data so the app renders before the CI4 API + admin edits are in place.
const DEFAULT_SETTINGS = {
  taxRate: 5, // GST %, applied to the discounted subtotal
  restaurantName: 'Your Restaurant Name',
  addressLine1: 'Your City',
  addressLine2: 'Your Street Address',
  phone: 'Your Phone Number',
  gstin: 'Your GSTIN',
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt storage, fall back to defaults
  }
  return DEFAULT_SETTINGS;
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSettings(patch) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
