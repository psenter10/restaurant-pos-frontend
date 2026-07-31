import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '../services/api.js';

const DEFAULT_SETTINGS = {
  taxRate: 5, // GST %, applied to the discounted subtotal
  restaurantName: 'Your Restaurant Name',
  addressLine1: 'Your City',
  addressLine2: 'Your Street Address',
  phone: 'Your Phone Number',
  gstin: 'Your GSTIN',
};

// The API's columns are snake_case; the app has always used camelCase for
// this shape (OrderCart, AdminSettingsPage, Receipt/print.js), so every
// consumer keeps working unchanged as long as this mapping stays in sync.
const FIELD_MAP = {
  taxRate: 'tax_rate',
  restaurantName: 'restaurant_name',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  phone: 'phone',
  gstin: 'gstin',
};

function fromApi(row) {
  const mapped = { ...DEFAULT_SETTINGS };
  for (const [camelKey, snakeKey] of Object.entries(FIELD_MAP)) {
    if (row[snakeKey] !== undefined && row[snakeKey] !== null) {
      mapped[camelKey] = camelKey === 'taxRate' ? Number(row[snakeKey]) : row[snakeKey];
    }
  }
  return mapped;
}

function toApi(patch) {
  const body = {};
  for (const [camelKey, value] of Object.entries(patch)) {
    if (FIELD_MAP[camelKey]) body[FIELD_MAP[camelKey]] = value;
  }
  return body;
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // True until the initial fetch settles (success or failure) — lets any
  // consumer that copies `settings` into its own editable draft state (see
  // AdminSettingsPage) know when it's safe to sync that copy with the real
  // fetched values, instead of being permanently stuck on DEFAULT_SETTINGS.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then((res) => setSettings(fromApi(res.data)))
      .catch(() => {
        // Backend unreachable — keep defaults so the UI still renders.
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateSettings(patch) {
    const res = await apiUpdateSettings(toApi(patch));
    setSettings(fromApi(res.data));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
