import React, { useState } from 'react';

export default function ItemVariantModal({ item, onCancel, onSave }) {
  const [variant, setVariant] = useState(item.variants[0]);
  const [addonNames, setAddonNames] = useState([]);

  const addons = item.addons || [];
  const selectedAddons = addons.filter((a) => addonNames.includes(a.name));
  const total = variant.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  function toggleAddon(name) {
    setAddonNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-md w-[560px] max-w-[92vw] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">{item.name}</h3>
          <button onClick={onCancel} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-ink-soft mb-2">Variation</div>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {item.variants.map((v) => (
              <button
                key={v.name}
                onClick={() => setVariant(v)}
                className={`rounded-md py-2.5 text-center transition-colors ${
                  variant.name === v.name ? 'bg-rust text-white' : 'bg-ink text-white hover:bg-ink/90'
                }`}
              >
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs font-mono opacity-90">₹{v.price}</div>
              </button>
            ))}
          </div>

          {addons.length > 0 && (
            <>
              <div className="text-sm font-semibold text-ink-soft mb-2">Addons {variant.name}</div>
              <div className="grid grid-cols-4 gap-2">
                {addons.map((a) => {
                  const active = addonNames.includes(a.name);
                  return (
                    <button
                      key={a.name}
                      onClick={() => toggleAddon(a.name)}
                      className={`rounded-md px-3 py-2.5 text-left border border-line border-l-4 border-l-sage transition-colors ${
                        active ? 'bg-sage-light' : 'bg-white hover:bg-line/40'
                      }`}
                    >
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs font-mono text-ink-soft">₹{a.price}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-line">
          <span className="font-mono font-semibold text-base">₹{total.toFixed(2)}</span>
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={() => onSave(variant, selectedAddons, total)}
              className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
