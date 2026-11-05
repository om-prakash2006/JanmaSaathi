import {
  createMotherRecord,
  createAssessmentRecord,
  createHealthUpdateRecord,
  createReferralRecord,
  createDirectMessage,
} from '../services/firestoreService';
import {
  getAllPendingSyncRecords,
  updateLocalSyncState,
  StoreName,
  OfflineRecordMetadata,
} from './indexedDB';
import { validateFirestoreConnection } from '../lib/firebase';
import { evaluateMaternalRiskLocally } from '../ml/mlEngine';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  syncErrors: string[];
}

let syncListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  pendingCount: 0,
  syncErrors: [],
};

function notifyListeners() {
  syncListeners.forEach((listener) => listener(currentSyncStatus));
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  listener(currentSyncStatus);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

/**
 * Verify genuine backend reachability before attempting synchronization.
 */
export async function isBackendReachable(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  try {
    const isFirestoreAvailable = await validateFirestoreConnection();
    if (isFirestoreAvailable) return true;

    // Secondary reachability check via Express server /api/health
    const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Perform synchronization in strict dependency order with idempotency and conflict preservation.
 */
export async function triggerBackgroundSync(owningUid?: string): Promise<{
  success: boolean;
  processedCount: number;
  errors: string[];
}> {
  if (currentSyncStatus.isSyncing) {
    return { success: false, processedCount: 0, errors: ['Sync already in progress'] };
  }

  const reachable = await isBackendReachable();
  if (!reachable) {
    return { success: false, processedCount: 0, errors: ['Backend unreachable'] };
  }

  currentSyncStatus.isSyncing = true;
  notifyListeners();

  const errors: string[] = [];
  let processedCount = 0;

  try {
    const pendingItems = await getAllPendingSyncRecords(owningUid);
    currentSyncStatus.pendingCount = pendingItems.length;
    notifyListeners();

    if (pendingItems.length === 0) {
      currentSyncStatus.isSyncing = false;
      currentSyncStatus.lastSyncedAt = new Date().toISOString();
      notifyListeners();
      return { success: true, processedCount: 0, errors: [] };
    }

    // 1. Dependency Ordering: Mothers -> Assessments -> HealthUpdates -> Referrals -> Messages
    const storePriority: Record<StoreName, number> = {
      maternalProfiles: 1,
      assessmentDrafts: 2,
      healthUpdateDrafts: 3,
      referralDrafts: 4,
      appointmentDrafts: 4,
      messageDrafts: 5,
      syncMetadata: 6,
      localPreferences: 7,
    };

    pendingItems.sort(
      (a, b) => (storePriority[a.storeName] || 99) - (storePriority[b.storeName] || 99)
    );

    for (const { storeName, record } of pendingItems) {
      try {
        if (storeName === 'maternalProfiles') {
          // Idempotent Mother registration write to Firestore
          await createMotherRecord(record);
          await updateLocalSyncState(storeName, record.id, 'synced');
          processedCount++;
        } else if (storeName === 'assessmentDrafts') {
          // Check if prediction requires server re-validation
          let finalAssessment = { ...record };

          try {
            // Attempt server revalidation with /api/predict
            const res = await fetch('/api/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                age: record.originalMeasurements?.age?.value || record.originalMeasurements?.age || 24,
                systolicBP: record.systolicBP,
                diastolicBP: record.diastolicBP,
                bloodSugar: record.bloodGlucose,
                bloodSugarUnit: 'mmol/L',
                bodyTemp: record.bodyTemp,
                bodyTempUnit: '°F',
                heartRate: record.heartRate,
                supplementaryObservations: record.supplementaryDangerObservations,
              }),
            });

            if (res.ok) {
              const resData = await res.json();
              if (resData.success && resData.modelPrediction) {
                finalAssessment.modelPrediction = {
                  ...resData.modelPrediction,
                  isProvisional: false,
                };
              }
            }
          } catch {
            // Re-evaluate locally if server prediction API fails during sync
            const localEval = evaluateMaternalRiskLocally({
              age: record.originalMeasurements?.age?.value || 24,
              systolicBP: record.systolicBP,
              diastolicBP: record.diastolicBP,
              bloodSugar: record.bloodGlucose,
              bodyTemp: record.bodyTemp,
              heartRate: record.heartRate,
            });
            if (localEval.success && localEval.modelPrediction) {
              finalAssessment.modelPrediction = localEval.modelPrediction;
            }
          }

          await createAssessmentRecord(finalAssessment);
          await updateLocalSyncState(storeName, record.id, 'synced');
          processedCount++;
        } else if (storeName === 'healthUpdateDrafts') {
          await createHealthUpdateRecord(record);
          await updateLocalSyncState(storeName, record.id, 'synced');
          processedCount++;
        } else if (storeName === 'referralDrafts') {
          await createReferralRecord(record);
          await updateLocalSyncState(storeName, record.id, 'synced');
          processedCount++;
        } else if (storeName === 'messageDrafts') {
          await createDirectMessage(record);
          await updateLocalSyncState(storeName, record.id, 'synced');
          processedCount++;
        }
      } catch (itemErr: any) {
        console.warn(`Sync error on item ${record.id} in store ${storeName}:`, itemErr);
        const errMsg = itemErr.message || String(itemErr);
        errors.push(`Store ${storeName} record ${record.id}: ${errMsg}`);

        // Handle permanent permission / validation errors by marking as auth_error or conflict
        if (errMsg.includes('permission') || errMsg.includes('PERMISSION_DENIED')) {
          await updateLocalSyncState(storeName, record.id, 'auth_error', errMsg);
        } else {
          await updateLocalSyncState(storeName, record.id, 'conflict', errMsg);
        }
      }
    }

    currentSyncStatus.lastSyncedAt = new Date().toISOString();
  } catch (err: any) {
    errors.push(err.message || String(err));
  } finally {
    currentSyncStatus.isSyncing = false;
    currentSyncStatus.syncErrors = errors;
    const remaining = await getAllPendingSyncRecords(owningUid);
    currentSyncStatus.pendingCount = remaining.length;
    notifyListeners();
  }

  return {
    success: errors.length === 0,
    processedCount,
    errors,
  };
}

/**
 * Register automatic triggers for background synchronization.
 */
export function initAutoSyncTriggers(owningUidProvider: () => string | undefined) {
  if (typeof window === 'undefined') return;

  // 1. Browser online event
  window.addEventListener('online', () => {
    console.log('Browser online event triggered sync.');
    triggerBackgroundSync(owningUidProvider());
  });

  // 2. Visibility change event (when returning to active window)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerBackgroundSync(owningUidProvider());
    }
  });

  // 3. Initial startup sync check
  setTimeout(() => {
    triggerBackgroundSync(owningUidProvider());
  }, 3000);
}
