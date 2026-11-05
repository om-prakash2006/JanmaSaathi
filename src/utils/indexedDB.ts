export interface OfflineRecordMetadata {
  localRecordId: string;
  recordType: 'mother' | 'assessment' | 'healthUpdate' | 'referral' | 'appointment' | 'message';
  owningUid: string;
  relatedMotherId: string;
  creatingWorkerId?: string;
  createdAt: string;
  updatedAt: string;
  localRevision: number;
  operationId: string;
  recordOrigin: 'offline' | 'online';
  syncState: 'draft' | 'pending_sync' | 'synced' | 'conflict' | 'auth_error';
  syncError?: string;
}

export type StoreName =
  | 'maternalProfiles'
  | 'assessmentDrafts'
  | 'healthUpdateDrafts'
  | 'referralDrafts'
  | 'appointmentDrafts'
  | 'messageDrafts'
  | 'syncMetadata'
  | 'localPreferences';

const DB_NAME = 'JanmaSaathi_OfflineDB_v1';
const DB_VERSION = 1;

// In-memory fallback map for non-browser Node.js test environments
const memoryFallbackStore: Record<StoreName, Map<string, any>> = {
  maternalProfiles: new Map(),
  assessmentDrafts: new Map(),
  healthUpdateDrafts: new Map(),
  referralDrafts: new Map(),
  appointmentDrafts: new Map(),
  messageDrafts: new Map(),
  syncMetadata: new Map(),
  localPreferences: new Map(),
};

let dbPromise: Promise<IDBDatabase> | null = null;

export function getJanmaSaathiDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      // In Node.js test environment, return a mock IDBDatabase-like proxy using memoryFallbackStore
      resolve({
        objectStoreNames: {
          contains: () => true,
        },
        transaction: (_storeNames: string | string[], _mode?: IDBTransactionMode) => ({
          objectStore: (name: StoreName) => {
            const map = memoryFallbackStore[name];
            return {
              put: (val: any) => {
                map.set(val.id, val);
                return { onsuccess: null, onerror: null, result: val };
              },
              get: (id: string) => ({
                onsuccess: function(this: any) { this.result = map.get(id); if (this.onload) this.onload(); },
                onerror: null,
                result: map.get(id),
              }),
              getAll: () => ({
                onsuccess: function(this: any) { this.result = Array.from(map.values()); },
                onerror: null,
                result: Array.from(map.values()),
              }),
              delete: (id: string) => {
                map.delete(id);
                return { onsuccess: null, onerror: null };
              },
            };
          },
        }),
      } as unknown as IDBDatabase);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const stores: StoreName[] = [
        'maternalProfiles',
        'assessmentDrafts',
        'healthUpdateDrafts',
        'referralDrafts',
        'appointmentDrafts',
        'messageDrafts',
        'syncMetadata',
        'localPreferences',
      ];

      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('owningUid', 'owningUid', { unique: false });
          store.createIndex('syncState', 'syncState', { unique: false });
          store.createIndex('relatedMotherId', 'relatedMotherId', { unique: false });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Save or update a record in an IndexedDB object store with transactional safety.
 */
export async function saveLocalDraft<T extends { id: string }>(
  storeName: StoreName,
  record: T & Partial<OfflineRecordMetadata>
): Promise<T & OfflineRecordMetadata> {
  const db = await getJanmaSaathiDB();
  const now = new Date().toISOString();

  const fullRecord: T & OfflineRecordMetadata = {
    ...record,
    localRecordId: record.localRecordId || record.id,
    recordType:
      record.recordType ||
      (storeName === 'maternalProfiles'
        ? 'mother'
        : storeName === 'assessmentDrafts'
        ? 'assessment'
        : storeName === 'healthUpdateDrafts'
        ? 'healthUpdate'
        : storeName === 'referralDrafts'
        ? 'referral'
        : storeName === 'appointmentDrafts'
        ? 'appointment'
        : 'message'),
    owningUid: record.owningUid || 'default-local-user',
    relatedMotherId: record.relatedMotherId || (record as any).motherId || record.id,
    creatingWorkerId: record.creatingWorkerId || (record as any).workerId || undefined,
    createdAt: record.createdAt || now,
    updatedAt: now,
    localRevision: (record.localRevision || 0) + 1,
    operationId: record.operationId || `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recordOrigin: record.recordOrigin || 'offline',
    syncState: record.syncState || 'pending_sync',
  };

  // If memory fallback used in Node
  if (typeof window === 'undefined' || !window.indexedDB) {
    memoryFallbackStore[storeName].set(fullRecord.id, fullRecord);
    return fullRecord;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const putReq = store.put(fullRecord);

    putReq.onsuccess = () => resolve(fullRecord);
    putReq.onerror = () => reject(putReq.error);
  });
}

/**
 * Get all records from a store scoped to an owning Firebase UID for strict user isolation.
 */
export async function getLocalDrafts<T>(
  storeName: StoreName,
  owningUid?: string
): Promise<(T & OfflineRecordMetadata)[]> {
  const db = await getJanmaSaathiDB();

  if (typeof window === 'undefined' || !window.indexedDB) {
    const results = Array.from(memoryFallbackStore[storeName].values()) as (T & OfflineRecordMetadata)[];
    if (!owningUid) return results;
    return results.filter((item) => item.owningUid === owningUid || item.owningUid === 'shared');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const getReq = store.getAll();

    getReq.onsuccess = () => {
      const results = (getReq.result || []) as (T & OfflineRecordMetadata)[];
      if (!owningUid) {
        resolve(results);
      } else {
        const filtered = results.filter(
          (item) => item.owningUid === owningUid || item.owningUid === 'shared'
        );
        resolve(filtered);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Get all pending synchronization records across stores for a given owning UID.
 */
export async function getAllPendingSyncRecords(
  owningUid?: string
): Promise<{ storeName: StoreName; record: OfflineRecordMetadata & any }[]> {
  const db = await getJanmaSaathiDB();
  const stores: StoreName[] = [
    'maternalProfiles',
    'assessmentDrafts',
    'healthUpdateDrafts',
    'referralDrafts',
    'appointmentDrafts',
    'messageDrafts',
  ];

  const pendingList: { storeName: StoreName; record: OfflineRecordMetadata & any }[] = [];

  for (const storeName of stores) {
    const records = await getLocalDrafts<any>(storeName, owningUid);
    records.forEach((rec) => {
      if (rec.syncState === 'pending_sync' || rec.syncState === 'draft') {
        pendingList.push({ storeName, record: rec });
      }
    });
  }

  return pendingList;
}

/**
 * Update the sync status of a specific local record.
 */
export async function updateLocalSyncState(
  storeName: StoreName,
  id: string,
  syncState: OfflineRecordMetadata['syncState'],
  syncError?: string
): Promise<void> {
  const db = await getJanmaSaathiDB();

  if (typeof window === 'undefined' || !window.indexedDB) {
    const map = memoryFallbackStore[storeName];
    const item = map.get(id);
    if (item) {
      map.set(id, { ...item, syncState, syncError: syncError || null, updatedAt: new Date().toISOString() });
    }
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      if (getReq.result) {
        const updated = {
          ...getReq.result,
          syncState,
          syncError: syncError || null,
          updatedAt: new Date().toISOString(),
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Delete a specific draft from IndexedDB after successful synchronization acknowledgment.
 */
export async function deleteLocalDraft(storeName: StoreName, id: string): Promise<void> {
  const db = await getJanmaSaathiDB();

  if (typeof window === 'undefined' || !window.indexedDB) {
    memoryFallbackStore[storeName].delete(id);
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const delReq = store.delete(id);

    delReq.onsuccess = () => resolve();
    delReq.onerror = () => reject(delReq.error);
  });
}

/**
 * Clear local data for user isolation during logout (without destroying unacknowledged unsynced data).
 */
export async function getUnsyncedCountForUser(owningUid: string): Promise<number> {
  const pending = await getAllPendingSyncRecords(owningUid);
  return pending.length;
}
