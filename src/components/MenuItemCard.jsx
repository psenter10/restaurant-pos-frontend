import React from 'react';

export default function MenuItemCard({ item, onAdd }) {
  return (
    <button
      onClick={() => onAdd(item)}
      className={`bg-white border border-line border-l-4 ${
        item.veg === false ? 'border-l-amber' : 'border-l-sage'
      } rounded-md px-3 py-3 min-h-[64px] flex items-center text-left hover:shadow-sm hover:border-navy/40 transition-shadow`}
    >
      <span className="text-sm font-medium leading-snug">{item.name}</span>
    </button>
  );
}
