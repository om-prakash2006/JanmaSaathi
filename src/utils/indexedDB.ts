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
  | 'localPreferences'
  | 'translationCache';

const DB_NAME = 'JanmaSaathi_OfflineDB_v1';
const DB_VERSION = 2;

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
  translationCache: new Map(),
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
        'translationCache',
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

function matchesOwningUid(item: any, owningUid?: string): boolean {
  if (!owningUid) return true;
  return (
    item.owningUid === owningUid ||
    item.owningUid === 'shared' ||
    item.owningUid === 'default-local-user' ||
    item.creatingWorkerId === owningUid ||
    item.workerId === owningUid ||
    item.assignedWorkerId === owningUid ||
    item.assignedHealthWorkerId === owningUid ||
    item.motherId === owningUid ||
    item.senderId === owningUid ||
    item.recipientId === owningUid
  );
}

/**
 * Get all records from a store scoped to an owning Firebase UID or staff/mother identity.
 */
export async function getLocalDrafts<T>(
  storeName: StoreName,
  owningUid?: string
): Promise<(T & OfflineRecordMetadata)[]> {
  const db = await getJanmaSaathiDB();

  if (typeof window === 'undefined' || !window.indexedDB) {
    const results = Array.from(memoryFallbackStore[storeName].values()) as (T & OfflineRecordMetadata)[];
    return results.filter((item) => matchesOwningUid(item, owningUid));
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const getReq = store.getAll();

    getReq.onsuccess = () => {
      const results = (getReq.result || []) as (T & OfflineRecordMetadata)[];
      const filtered = results.filter((item) => matchesOwningUid(item, owningUid));
      resolve(filtered);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Get all pending synchronization records across stores for a given owning UID or device-wide.
 */
export async function getAllPendingSyncRecords(
  owningUid?: string
): Promise<{ storeName: StoreName; record: OfflineRecordMetadata & any }[]> {
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

export interface CachedTranslationRecord {
  id: string; // `${textHash}_${lang}`
  sourceText: string;
  targetLang: string;
  translatedText: string;
  cachedAt: string;
}

/**
 * Cache a dynamic translation in IndexedDB for offline access across refreshes and restarts.
 */
export async function saveCachedTranslation(
  sourceText: string,
  targetLang: string,
  translatedText: string
): Promise<void> {
  const db = await getJanmaSaathiDB();
  const id = `${targetLang}:${sourceText.trim()}`;
  const record: CachedTranslationRecord = {
    id,
    sourceText,
    targetLang,
    translatedText,
    cachedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined' || !window.indexedDB) {
    memoryFallbackStore.translationCache.set(id, record);
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('translationCache', 'readwrite');
    const store = transaction.objectStore('translationCache');
    const putReq = store.put(record);
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });
}

/**
 * Retrieve a cached dynamic translation from IndexedDB.
 */
export async function getCachedTranslation(
  sourceText: string,
  targetLang: string
): Promise<string | null> {
  const db = await getJanmaSaathiDB();
  const id = `${targetLang}:${sourceText.trim()}`;

  if (typeof window === 'undefined' || !window.indexedDB) {
    const hit = memoryFallbackStore.translationCache.get(id);
    return hit ? hit.translatedText : null;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction('translationCache', 'readonly');
      const store = transaction.objectStore('translationCache');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        resolve(getReq.result ? getReq.result.translatedText : null);
      };
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
