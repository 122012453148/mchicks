import { getSyncQueue, updateSyncRecord, removeSyncRecord } from './db';
import * as apiService from '../services/api';

export const syncAllPendingRecords = async () => {
  const queue = await getSyncQueue();
  const pendingRecords = queue.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'failed');

  let successCount = 0;
  let failCount = 0;

  for (const record of pendingRecords) {
    try {
      record.syncStatus = 'syncing';
      await updateSyncRecord(record);

      const { localId, type, batchId, payload, imageBlob } = record;

      // Handle image uploads
      if (imageBlob) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));
        
        // Convert base64 to blob if needed, or if it's already a blob, append it
        if (typeof imageBlob === 'string' && imageBlob.startsWith('data:image')) {
          const res = await fetch(imageBlob);
          const blob = await res.blob();
          formData.append('image', blob, `offline-${localId}.jpg`);
        }
        
        await apiService.logService.createLogWithImage(batchId, formData);
      } else {
        // Handle standard JSON payloads
        switch (type) {
          case 'DailyLog':
            await apiService.logService.createLog(batchId, payload);
            break;
          case 'WeightRecord':
            await apiService.weightService.createWeight(batchId, payload);
            break;
          case 'Supplement':
            await apiService.supplementService.createSupplement(batchId, payload);
            break;
          case 'Expense':
            await apiService.expenseService.createExpense(batchId, payload);
            break;
          case 'SupervisorVisit':
            await apiService.supervisorService.createVisit(batchId, payload);
            break;
          default:
            console.warn(`Unknown offline record type: ${type}`);
        }
      }

      // If successful, we can safely delete from sync queue (or mark as synced)
      // We will delete to save space.
      await removeSyncRecord(localId);
      successCount++;
    } catch (err) {
      console.error(`Sync failed for ${record.localId}:`, err);
      record.syncStatus = 'failed';
      record.retryCount += 1;
      await updateSyncRecord(record);
      failCount++;
    }
  }

  // Trigger a custom event to notify UI to refresh data
  if (successCount > 0) {
    window.dispatchEvent(new Event('mchicks-sync-complete'));
  }

  return { successCount, failCount };
};
