import React from 'react';

// The "figure box" row of totals shown at the top of Admin list pages
// (Menu, Table & Floor, Users, Waiters) — e.g. Total / Available / Unavailable.
// Callers pass the existing text-color tone ('text-sage' / 'text-rust' / none)
// which is mapped here to a matching gradient so every page didn't need
// updating when the cards went from flat white to gradient fills.
const TONE_GRADIENTS = {
  default: 'bg-gradient-to-br from-navy to-sky',
  'text-sage': 'bg-gradient-to-br from-sage to-sky',
  'text-rust': 'bg-gradient-to-br from-rust to-navy',
};

export default function StatRow({ stats, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-3 mb-5 ${className}`}>
      {stats.map(({ label, value, tone }) => (
        <div
          key={label}
          className={`flex-1 min-w-[160px] rounded-lg shadow-sm p-4 text-white ${TONE_GRADIENTS[tone] || TONE_GRADIENTS.default}`}
        >
          <div className="text-xs font-mono uppercase tracking-wide text-white/75">{label}</div>
          <div className="font-display text-2xl font-semibold mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  );
}
