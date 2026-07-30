import React from 'react';

export default function MenuItemCard({ item, onAdd, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onAdd(item)}
      disabled={disabled}
      className={`bg-white border border-line border-l-4 ${
        item.veg === false ? 'border-l-amber' : 'border-l-sage'
      } rounded-md px-3 py-3 min-h-[64px] flex items-center text-left transition-shadow ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-sm hover:border-navy/40'
      }`}
    >
      <span className="text-sm font-medium leading-snug">{item.name}</span>
    </button>
  );
}
