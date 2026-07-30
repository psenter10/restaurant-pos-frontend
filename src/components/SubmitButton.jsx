import React from 'react';
import Spinner from './Spinner.jsx';

// Submit button for modal forms that call an async onSave — shows a spinner
// and disables while the request is in flight, so a slow API call reads as
// "working" instead of a dead click.
export default function SubmitButton({ submitting, children, tone = 'rust', className = '', ...props }) {
  const toneClass = tone === 'navy' ? 'bg-navy hover:bg-navy-light' : 'bg-rust hover:bg-rust/90';
  return (
    <button
      type="submit"
      disabled={submitting}
      className={`flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-70 ${toneClass} ${className}`}
      {...props}
    >
      {submitting && <Spinner className="w-4 h-4 border-[1.5px]" tone="border-t-white" />}
      {children}
    </button>
  );
}
