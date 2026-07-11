import React, { useState } from 'react';
import { IconChevronDown } from './icons.jsx';

export default function CategorySidebar({ groups, activeGroup, onSelectGroup, activeCategory, onSelectCategory }) {
  const [open, setOpen] = useState(false);
  const categories = groups.find((g) => g.name === activeGroup)?.categories || [];

  function handleSelectGroup(name) {
    onSelectGroup(name);
    onSelectCategory(null);
    setOpen(false);
  }

  return (
    <div className="w-40 shrink-0 bg-line/40 border-r border-line flex flex-col overflow-y-auto">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full bg-navy text-white text-sm font-medium px-3 py-2.5 flex items-center justify-between hover:bg-navy-light transition-colors"
        >
          {activeGroup}
          <IconChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full w-full bg-white border border-line rounded-b-md shadow-md z-20">
            {groups.map((group) => (
              <button
                key={group.name}
                onClick={() => handleSelectGroup(group.name)}
                className={`block w-full text-left px-3 py-2 text-sm ${
                  group.name === activeGroup ? 'bg-navy text-white' : 'text-ink hover:bg-line/60'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onSelectCategory(null)}
        className={`text-left text-sm font-medium px-3 py-2.5 border-b border-line/60 transition-colors ${
          activeCategory === null ? 'bg-sage text-white' : 'bg-white text-ink hover:bg-line/60'
        }`}
      >
        Favorite Items
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`text-left text-sm px-3 py-2.5 border-b border-line/60 transition-colors ${
            activeCategory === cat ? 'bg-sage text-white font-medium' : 'bg-white text-ink-soft hover:bg-line/60'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
