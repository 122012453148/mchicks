import { useState, useEffect } from 'react';
import { syncAllPendingRecords, getSyncQueue } from '../utils/syncManager';

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const checkQueue = async () => {
    try {
      const queue = await getSyncQueue();
      const pending = queue.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'failed');
      setPendingCount(pending.length);
    } catch (e) {
      console.warn("IndexedDB not ready");
    }
  };

  useEffect(() => {
    checkQueue();
    
    const onQueueUpdate = () => checkQueue();
    window.addEventListener('mchicks-sync-complete', onQueueUpdate);
    window.addEventListener('mchicks-queue-updated', onQueueUpdate);

    const handleOnline = () => {
      setIsOnline(true);
      syncAllPendingRecords().then(() => checkQueue());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncAllPendingRecords().then(() => checkQueue());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mchicks-sync-complete', onQueueUpdate);
      window.removeEventListener('mchicks-queue-updated', onQueueUpdate);
    };
  }, []);

  const triggerSync = async () => {
    if (isOnline) {
      await syncAllPendingRecords();
      await checkQueue();
    }
  };

  return { isOnline, pendingCount, triggerSync };
}
