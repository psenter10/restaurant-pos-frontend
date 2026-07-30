import React from 'react';

export default function EmptyState({ icon: Icon, message = 'No data available.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-line/50 flex items-center justify-center mb-3 animate-bounce">
        <Icon className="w-5 h-5 text-ink-soft" />
      </div>
      <p className="text-sm text-ink-soft">{message}</p>
    </div>
  );
}
