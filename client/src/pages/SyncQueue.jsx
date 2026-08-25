import React, { useState, useEffect } from 'react';
import { getSyncQueue } from '../utils/syncManager';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function SyncQueue() {
  const [queue, setQueue] = useState([]);
  const { isOnline, triggerSync } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueue = async () => {
    try {
      const q = await getSyncQueue();
      setQueue(q.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQueue();
    const handleUpdate = () => loadQueue();
    window.addEventListener('mchicks-queue-updated', handleUpdate);
    window.addEventListener('mchicks-sync-complete', handleUpdate);
    return () => {
      window.removeEventListener('mchicks-queue-updated', handleUpdate);
      window.removeEventListener('mchicks-sync-complete', handleUpdate);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await triggerSync();
    setIsSyncing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'syncing': return <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-extrabold text-brand-primary">Sync Queue</h2>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            Manage your offline records and synchronization status
          </p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
          className="flex items-center bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-highlight disabled:opacity-50 transition-colors"
        >
          {isSyncing ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Syncing...</>
          ) : (
            <>
              {isOnline ? <Wifi className="w-5 h-5 mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />}
              {isOnline ? 'Sync Now' : 'Offline'}
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-semibold">
            All farm data is up to date. No pending records.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queue.map((record) => (
              <li key={record.localId} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{record.type}</h3>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    Batch: {record.batchId} • Created: {new Date(record.createdAt).toLocaleString()}
                  </p>
                  {record.syncStatus === 'failed' && (
                    <p className="text-xs text-red-500 font-bold mt-1">
                      Retry count: {record.retryCount}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      record.syncStatus === 'failed' ? 'text-red-500' :
                      record.syncStatus === 'synced' ? 'text-green-500' :
                      record.syncStatus === 'syncing' ? 'text-orange-500' :
                      'text-gray-500'
                    }`}>
                      {record.syncStatus}
                    </span>
                    {getStatusIcon(record.syncStatus)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
