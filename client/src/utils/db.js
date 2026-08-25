import { openDB } from 'idb';

const DB_NAME = 'mchicks-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache'); // key-value store for GET requests
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'localId' });
        queueStore.createIndex('syncStatus', 'syncStatus');
      }
    },
  });
};

export const getCache = async (key) => {
  const db = await initDB();
  return db.get('apiCache', key);
};

export const setCache = async (key, value) => {
  const db = await initDB();
  return db.put('apiCache', value, key);
};

export const addToSyncQueue = async (record) => {
  const db = await initDB();
  return db.put('syncQueue', {
    ...record,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString()
  });
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll('syncQueue');
};

export const updateSyncRecord = async (record) => {
  const db = await initDB();
  return db.put('syncQueue', record);
};

export const removeSyncRecord = async (localId) => {
  const db = await initDB();
  return db.delete('syncQueue', localId);
};
