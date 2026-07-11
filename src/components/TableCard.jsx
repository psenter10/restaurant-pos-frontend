import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPrinter, IconEye, IconSave } from './icons.jsx';

const STATUS_STYLES = {
  blank: { bg: 'bg-white', border: 'border-line', text: 'text-ink-soft' },
  running: { bg: 'bg-sky-light', border: 'border-sky', text: 'text-navy' },
  printed: { bg: 'bg-sage-light', border: 'border-sage', text: 'text-ink' },
  paid: { bg: 'bg-gold-light', border: 'border-gold', text: 'text-ink' },
  runningKot: { bg: 'bg-amber-light', border: 'border-amber', text: 'text-ink' },
};

const BADGES = {
  blank: [],
  running: ['printer'],
  printed: ['save'],
  paid: ['printer', 'eye'],
  runningKot: ['save'],
};

const BADGE_ICONS = { printer: IconPrinter, eye: IconEye, save: IconSave };

// Renders elapsed time as a running hh:mm:ss stopwatch.
function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TableCard({ table, onPrint, onView, now }) {
  const navigate = useNavigate();
  const style = STATUS_STYLES[table.status] || STATUS_STYLES.blank;
  const badges = BADGES[table.status] || [];
  const isOccupied = table.status !== 'blank';

  return (
    <div className={`relative aspect-[4/3] w-full rounded-lg border ${style.bg} ${style.border}`}>
      <button
        onClick={() => navigate(`/order/${table.id}`)}
        className="flex flex-col items-center justify-center gap-1.5 w-full h-full hover:shadow-md transition-shadow rounded-lg"
      >
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
      </button>

      {badges.length > 0 && (
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {badges.map((badge) => {
            const Icon = BADGE_ICONS[badge];
            const handleClick = badge === 'eye' ? () => onView?.(table) : () => onPrint?.(table);
            return (
              <button
                key={badge}
                onClick={handleClick}
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
