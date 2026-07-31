import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Staff leave the POS screen open all shift, so a background deploy must
// never force-reload mid-order — this surfaces a dismissible prompt instead
// of the more common auto-reload-on-update behavior (see vite.config.js's
// registerType: 'prompt').
export default function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  function dismiss() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-3 bg-navy text-white rounded-md shadow-lg px-4 py-3 text-sm max-w-[92vw]">
      <span>
        {needRefresh ? 'A new version of Lavanya POS is available.' : 'Lavanya POS is ready to work offline.'}
      </span>
      {needRefresh && (
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-white text-navy font-semibold px-3 py-1.5 rounded-md text-xs whitespace-nowrap"
        >
          Reload
        </button>
      )}
      <button onClick={dismiss} className="text-white/70 hover:text-white leading-none text-base" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
