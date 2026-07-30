import React from 'react';
import Spinner from './Spinner.jsx';

// Generic "are you sure?" dialog used before any deactivate/delete/save
// action across the Admin Panel — keeps the confirmation copy and styling
// consistent instead of every page rolling its own.
export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  confirming = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50"
      onClick={confirming ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-md w-[420px] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
        </div>
        {message && <div className="px-5 py-4 text-sm text-ink-soft">{message}</div>}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button onClick={onCancel} disabled={confirming} className="btn-secondary text-sm disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className={`flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-md text-white disabled:opacity-60 ${
              danger ? 'bg-rust hover:bg-rust/90' : 'bg-navy hover:bg-navy-light'
            }`}
          >
            {confirming && <Spinner className="w-4 h-4 border-[1.5px]" tone="border-t-white" />}
            {confirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
