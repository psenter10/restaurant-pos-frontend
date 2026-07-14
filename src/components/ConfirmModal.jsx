import React from 'react';

// Generic "are you sure?" dialog used before any deactivate/delete/save
// action across the Admin Panel — keeps the confirmation copy and styling
// consistent instead of every page rolling its own.
export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-md w-[420px] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
        </div>
        {message && <div className="px-5 py-4 text-sm text-ink-soft">{message}</div>}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button onClick={onCancel} className="btn-secondary text-sm">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm font-medium px-4 py-2 rounded-md text-white ${
              danger ? 'bg-rust hover:bg-rust/90' : 'bg-navy hover:bg-navy-light'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
