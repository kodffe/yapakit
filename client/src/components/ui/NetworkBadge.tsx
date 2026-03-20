import { useState, useEffect } from 'react';
import { useMutationState } from '@tanstack/react-query';
import { useIsRestoring } from '@tanstack/react-query';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

/**
 * Network status indicator with mutation queue awareness.
 *
 * States:
 *  - Online & no pending → subtle green dot (mostly invisible).
 *  - Offline → red pill "Offline - Orders will be queued".
 *  - Online & syncing paused mutations → yellow pill "Syncing...".
 *  - Restoring from IndexedDB → blue pill "Restoring cache...".
 */
export default function NetworkBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isRestoring = useIsRestoring();

  // Watch for paused mutations (queued while offline)
  const pendingMutations = useMutationState({
    filters: { status: 'pending' },
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restoring from IndexedDB cache
  if (isRestoring) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Restoring cache...
      </div>
    );
  }

  // Offline
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Offline — Orders queued</span>
      </div>
    );
  }

  // Online but syncing queued mutations
  if (pendingMutations.length > 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing {pendingMutations.length}...</span>
      </div>
    );
  }

  // Online & clear — show subtle green dot
  return (
    <div className="flex items-center gap-1.5 px-2 py-1" title="Online">
      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
    </div>
  );
}
