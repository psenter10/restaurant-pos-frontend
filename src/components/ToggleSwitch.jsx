import React from 'react';
import Spinner from './Spinner.jsx';

// Modern pill toggle used everywhere an admin flips something between
// Available/Unavailable (menu items, categories, groups, sections, tables,
// users, waiters) instead of a plain checkbox.
export default function ToggleSwitch({ checked, onChange, label, disabled = false, loading = false }) {
  const inert = disabled || loading;
  return (
    <label className={`inline-flex items-center gap-2 select-none ${inert ? 'opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={inert}
        onClick={() => !inert && onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-sage' : 'bg-line'
        } ${inert ? 'cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <Spinner className="absolute top-0.5 left-0.5 w-4 h-4 border-[1.5px]" tone="border-t-ink-soft" />
        ) : (
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        )}
      </button>
      {label && <span className="text-xs text-ink-soft whitespace-nowrap">{label}</span>}
    </label>
  );
}
