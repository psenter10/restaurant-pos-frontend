import { useEffect, useState } from 'react';
import { connectQz } from '../services/print';

export default function useQzTray() {
  const [connected, setConnected] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    connectQz().then((ok) => {
      if (mounted) {
        setConnected(ok);
        setChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { connected, checked };
}
