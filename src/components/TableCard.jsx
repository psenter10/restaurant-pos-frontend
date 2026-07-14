import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconSave, IconMerge } from './icons.jsx';

const STATUS_STYLES = {
  blank: { bg: 'bg-white', border: 'border-line', text: 'text-ink-soft' },
  running: { bg: 'bg-sky-light', border: 'border-sky', text: 'text-navy' },
  printed: { bg: 'bg-sage-light', border: 'border-sage', text: 'text-ink' },
  reserved: { bg: 'bg-rust-light', border: 'border-rust', text: 'text-rust' },
};

// blank/reserved: no badges — clicking the table opens the order page to
// take a fresh order. running: a View Details shortcut to the full bill.
// printed: a Settle shortcut that skips the order page entirely.
const BADGES = {
  blank: [],
  running: ['eye'],
  printed: ['settle'],
};

const BADGE_ICONS = { eye: IconEye, settle: IconSave };
const BADGE_TOOLTIPS = { eye: 'View Details', settle: 'Settle Bill' };

// Renders elapsed time as a running hh:mm:ss stopwatch.
function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TableCard({ table, onSettle, now, mergedWithNames, mergedIntoName, unavailable }) {
  const navigate = useNavigate();
  // A table pulled into another table's merge is inert — only the primary
  // (the one holding mergedWith) stays clickable/actionable. A table (or its
  // whole section) marked unavailable in Table & Floor Management is the
  // same: inert until an admin turns it back on.
  const isMergedAway = Boolean(mergedIntoName);
  const isInert = isMergedAway || unavailable;
  const style = STATUS_STYLES[table.status] || STATUS_STYLES.blank;
  const badges = isInert ? [] : BADGES[table.status] || [];
  const isOccupied = !isInert && (table.status === 'running' || table.status === 'printed');
  const mergeTooltip = mergedWithNames?.length ? `Merged with: ${mergedWithNames.join(', ')}` : null;

  function handleBadgeClick(badge) {
    if (badge === 'eye') return navigate(`/order/${table.id}?mode=bill`);
    if (badge === 'settle') return onSettle?.(table);
  }

  return (
    <div
      className={`relative aspect-[4/3] w-full rounded-lg border ${
        isInert ? 'bg-line/40 border-line' : `${style.bg} ${style.border}`
      }`}
    >
      <button
        onClick={() => !isInert && navigate(`/order/${table.id}`)}
        disabled={isInert}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-shadow px-1 ${
          isInert ? 'cursor-not-allowed' : 'hover:shadow-md'
        }`}
      >
        {isMergedAway ? (
          <>
            <span className="font-display text-xs font-medium text-ink-soft leading-none">{table.name}</span>
            <span className="text-[10px] text-ink-soft/70 text-center leading-tight">
              Merged with: {mergedIntoName}
            </span>
          </>
        ) : unavailable ? (
          <>
            <span className="font-display text-xs font-medium text-ink-soft leading-none">{table.name}</span>
            <span className="text-[10px] text-ink-soft/70 text-center leading-tight">Unavailable</span>
          </>
        ) : (
          <>
            {isOccupied && table.occupiedSince && (
              <span className="text-[12px] font-mono font-normal text-ink-soft/80 leading-none bg-white/70 border border-ink-soft/20 rounded-full px-2 py-0.5">
                {formatElapsed((now ?? Date.now()) - table.occupiedSince)}
              </span>
            )}
            <span className={`font-display text-xs font-medium ${style.text} leading-none`}>{table.name}</span>
            {isOccupied && (
              <span className="text-xs font-mono font-bold text-rust leading-none">
                ₹{(table.amount ?? 0).toFixed(0)}
              </span>
            )}
          </>
        )}
      </button>

      {mergeTooltip && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-navy border-2 border-white flex items-center justify-center"
          title={mergeTooltip}
          aria-label={mergeTooltip}
        >
          <IconMerge className="w-2.5 h-2.5 text-white" />
        </span>
      )}

      {badges.length > 0 && (
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {badges.map((badge) => {
            const Icon = BADGE_ICONS[badge];
            return (
              <button
                key={badge}
                onClick={() => handleBadgeClick(badge)}
                title={BADGE_TOOLTIPS[badge]}
                aria-label={BADGE_TOOLTIPS[badge]}
                className="badge-icon hover:bg-line/60 hover:border-ink-soft/40 transition-colors"
              >
                <Icon className="w-4 h-4 text-ink-soft" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
