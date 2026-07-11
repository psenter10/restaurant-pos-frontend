import React, { useState } from 'react';
import { IconPlus, IconTrash } from './icons.jsx';

const emptyRow = () => ({ name: '', price: '' });

export default function ItemFormModal({ item, categories, onCancel, onSave }) {
  const isEdit = Boolean(item);
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price ?? '');
  const [category, setCategory] = useState(item?.category || categories[0] || '');
  const [veg, setVeg] = useState(item?.veg !== false);
  const [available, setAvailable] = useState(item?.available !== false);
  const [variants, setVariants] = useState(
    item?.variants?.map((v) => ({ name: v.name, price: v.price })) || []
  );
  const [addons, setAddons] = useState(item?.addons?.map((a) => ({ name: a.name, price: a.price })) || []);

  function updateVariant(idx, patch) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  function updateAddon(idx, patch) {
    setAddons((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !category) return;

    const cleanVariants = variants
      .filter((v) => v.name.trim())
      .map((v) => ({ name: v.name.trim(), price: Number(v.price) || 0 }));
    const cleanAddons = addons
      .filter((a) => a.name.trim())
      .map((a) => ({ name: a.name.trim(), price: Number(a.price) || 0 }));

    onSave({
      name: name.trim(),
      price: Number(price) || 0,
      category,
      veg,
      available,
      ...(cleanVariants.length ? { variants: cleanVariants } : {}),
      ...(cleanAddons.length ? { addons: cleanAddons } : {}),
    });
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[520px] max-w-[92vw] max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">{isEdit ? 'Edit Item' : 'Add Item'}</h3>
          <button type="button" onClick={onCancel} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Item name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paneer Tikka"
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="220"
                className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} />
              Veg
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              Available on order screen
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-ink-soft">Variations (optional)</label>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, emptyRow()])}
                className="flex items-center gap-1 text-xs text-navy font-medium hover:underline"
              >
                <IconPlus className="w-3.5 h-3.5" /> Add variation
              </button>
            </div>
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={v.name}
                    onChange={(e) => updateVariant(idx, { name: e.target.value })}
                    placeholder="e.g. Large"
                    className="flex-1 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={v.price}
                    onChange={(e) => updateVariant(idx, { price: e.target.value })}
                    placeholder="₹"
                    className="w-24 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-rust hover:text-rust/80"
                    aria-label="Remove variation"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-ink-soft">Addons (optional)</label>
              <button
                type="button"
                onClick={() => setAddons((prev) => [...prev, emptyRow()])}
                className="flex items-center gap-1 text-xs text-navy font-medium hover:underline"
              >
                <IconPlus className="w-3.5 h-3.5" /> Add addon
              </button>
            </div>
            <div className="space-y-2">
              {addons.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={a.name}
                    onChange={(e) => updateAddon(idx, { name: e.target.value })}
                    placeholder="e.g. Extra Cheese"
                    className="flex-1 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={a.price}
                    onChange={(e) => updateAddon(idx, { price: e.target.value })}
                    placeholder="₹"
                    className="w-24 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAddons((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-rust hover:text-rust/80"
                    aria-label="Remove addon"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            Cancel
          </button>
          <button type="submit" className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
            {isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
