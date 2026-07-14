import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { IconWallet, IconReceipt } from '../components/icons.jsx';

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1.5">{label}</label>
      {children}
      {help && <p className="text-xs text-ink-soft mt-1">{help}</p>}
    </div>
  );
}

const inputClass = 'w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-navy';

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState(settings);
  const [savedTax, setSavedTax] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState(false);
  const [confirmingTax, setConfirmingTax] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  function set(field, value, group) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (group === 'tax') setSavedTax(false);
    else setSavedReceipt(false);
  }

  function handleSubmitTax(e) {
    e.preventDefault();
    setConfirmingTax(true);
  }

  function confirmSaveTax() {
    updateSettings({ taxRate: Number(draft.taxRate) || 0 });
    setSavedTax(true);
    setConfirmingTax(false);
  }

  function handleSubmitReceipt(e) {
    e.preventDefault();
    setConfirmingReceipt(true);
  }

  function confirmSaveReceipt() {
    updateSettings({
      restaurantName: draft.restaurantName,
      addressLine1: draft.addressLine1,
      addressLine2: draft.addressLine2,
      phone: draft.phone,
      gstin: draft.gstin,
    });
    setSavedReceipt(true);
    setConfirmingReceipt(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <form onSubmit={handleSubmitTax} className="ticket-card bg-white p-5 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-line">
            <span className="badge-icon">
              <IconWallet className="w-3.5 h-3.5 text-ink-soft" />
            </span>
            <h3 className="font-display font-semibold text-sm">Tax &amp; Billing</h3>
          </div>

          <Field label="GST / Tax Rate (%)" help="Applied to the discounted subtotal on every bill and KOT total.">
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.taxRate}
              onChange={(e) => set('taxRate', e.target.value, 'tax')}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center gap-3 mt-5">
            <button type="submit" className="bg-rust text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-rust/90">
              Save
            </button>
            {savedTax && <span className="text-xs text-sage font-medium">Saved.</span>}
          </div>
        </form>

        <form onSubmit={handleSubmitReceipt} className="ticket-card bg-white p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-line">
            <span className="badge-icon">
              <IconReceipt className="w-3.5 h-3.5 text-ink-soft" />
            </span>
            <h3 className="font-display font-semibold text-sm">Printed Receipt Details</h3>
          </div>

          <div className="space-y-4">
            <Field label="Restaurant Name">
              <input
                value={draft.restaurantName}
                onChange={(e) => set('restaurantName', e.target.value, 'receipt')}
                className={`${inputClass} max-w-md`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Address Line 1">
                <input
                  value={draft.addressLine1}
                  onChange={(e) => set('addressLine1', e.target.value, 'receipt')}
                  className={inputClass}
                />
              </Field>
              <Field label="Address Line 2">
                <input
                  value={draft.addressLine2}
                  onChange={(e) => set('addressLine2', e.target.value, 'receipt')}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <input
                  value={draft.phone}
                  onChange={(e) => set('phone', e.target.value, 'receipt')}
                  className={inputClass}
                />
              </Field>
              <Field label="GSTIN">
                <input
                  value={draft.gstin}
                  onChange={(e) => set('gstin', e.target.value, 'receipt')}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button type="submit" className="bg-rust text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-rust/90">
              Save
            </button>
            {savedReceipt && <span className="text-xs text-sage font-medium">Saved.</span>}
          </div>
        </form>
      </div>

      {confirmingTax && (
        <ConfirmModal
          title="Save tax rate?"
          message="This updates the GST rate used on every KOT and bill total printed from now on."
          confirmLabel="Save Changes"
          danger={false}
          onCancel={() => setConfirmingTax(false)}
          onConfirm={confirmSaveTax}
        />
      )}

      {confirmingReceipt && (
        <ConfirmModal
          title="Save receipt details?"
          message="This updates the restaurant name, address, phone and GSTIN printed on every KOT and bill from now on."
          confirmLabel="Save Changes"
          danger={false}
          onCancel={() => setConfirmingReceipt(false)}
          onConfirm={confirmSaveReceipt}
        />
      )}
    </div>
  );
}
