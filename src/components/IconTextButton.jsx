import React from 'react';

// Small icon+text action button — the Edit/Delete/View-stats pattern used
// across the Admin Panel's list rows and cards.
const TONES = {
  neutral: 'border-line text-ink-soft hover:bg-line/40',
  navy: 'border-navy/30 text-navy hover:bg-navy/5',
  rust: 'border-rust/30 text-rust hover:bg-rust/5',
};

export default function IconTextButton({ icon: Icon, children, tone = 'neutral', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors whitespace-nowrap ${TONES[tone]} ${className}`}
      {...props}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {children}
    </button>
  );
}
