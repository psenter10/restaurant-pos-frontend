import React from 'react';

// Read-only admin view of an item's variations/addons — separate from
// ItemVariantModal.jsx, which is the customer-facing "pick one to order" flow.
export default function ItemVariantsInfoModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-md w-[420px] max-w-[92vw] max-h-[85vh] overflow-y-auto thin-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">{item.name}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {item.variants?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wide mb-2 bg-[#b04632] text-white text-center py-2">Variations</h4>
              <div className="space-y-1.5">
                {item.variants.map((v) => (
                  <div key={v.name} className="flex justify-between text-sm">
                    <span>{v.name}</span>
                    <span className="font-mono">₹{Number(v.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.addons?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wide mb-2 bg-[#1a1a1a] text-white text-center py-2">Addons</h4>
              <div className="space-y-1.5">
                {item.addons.map((a) => (
                  <div key={a.name} className="flex justify-between text-sm">
                    <span>{a.name}</span>
                    <span className="font-mono">₹{Number(a.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!item.variants?.length && !item.addons?.length && (
            <p className="text-sm text-ink-soft">No variations or addons on this item.</p>
          )}
        </div>
      </div>
    </div>
  );
}
