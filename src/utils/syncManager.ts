import {
  createMotherRecord,
  createAssessmentRecord,
  createHealthUpdateRecord,
  createReferralRecord,
  createDirectMessage,
  createAppointmentRecord,
} from '../services/firestoreService';
import {
  getAllPendingSyncRecords,
  updateLocalSyncState,
  saveLocalDraft,
  StoreName,
} from './indexedDB';
import { auth, validateFirestoreConnection } from '../lib/firebase';
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
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  try {
    const isFirestoreAvailable = await validateFirestoreConnection(3000);
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

  // Ensure Firebase Auth state is ready before proceeding with Firestore sync
  if (auth && typeof auth.authStateReady === 'function') {
    try {
      await Promise.race([
        auth.authStateReady(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      // Non-blocking timeout for auth state readiness
    }
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

    console.info(
      `[JanmaSaathi Sync] Sync cycle initiated. Found ${pendingItems.length} pending record(s) across local stores.`
    );

    // 1. Dependency Ordering: Mothers -> Assessments -> HealthUpdates -> Referrals -> Appointments -> Messages
    const storePriority: Record<StoreName, number> = {
      maternalProfiles: 1,
      assessmentDrafts: 2,
      healthUpdateDrafts: 3,
      referralDrafts: 4,
      appointmentDrafts: 5,
      messageDrafts: 6,
      syncMetadata: 7,
      localPreferences: 8,
      translationCache: 9,
    };

    pendingItems.sort(
      (a, b) => (storePriority[a.storeName] || 99) - (storePriority[b.storeName] || 99)
    );

    for (const { storeName, record } of pendingItems) {
      const recordId = record.id || (record as any).healthUpdateId;
      try {
        console.info(`[JanmaSaathi Sync] Uploading ${storeName} record [ID: ${recordId}]...`);

        if (storeName === 'maternalProfiles') {
          // Idempotent Mother registration write to Firestore
          await createMotherRecord(record);
          await updateLocalSyncState(storeName, recordId, 'synced');
          console.info(`[JanmaSaathi Sync] Upload succeeded for ${storeName} [ID: ${recordId}]. Marked as synced.`);
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
          await updateLocalSyncState(storeName, recordId, 'synced');
          console.info(`[JanmaSaathi Sync] Upload succeeded for ${storeName} [ID: ${recordId}]. Marked as synced.`);
          processedCount++;
        } else if (storeName === 'healthUpdateDrafts') {
          await createHealthUpdateRecord(record);
          await updateLocalSyncState(storeName, recordId, 'synced');
          console.info(`[JanmaSaathi Sync] Upload succeeded for ${storeName} [ID: ${recordId}]. Marked as synced.`);
          processedCount++;
        } else if (storeName === 'referralDrafts') {
          await createReferralRecord(record);
          await updateLocalSyncState(storeName, recordId, 'synced');
          console.info(`[JanmaSaathi Sync] Upload succeeded for ${storeName} [ID: ${recordId}]. Marked as synced.`);
          processedCount++;
        } else if (storeName === 'appointmentDrafts') {
          await createAppointmentRecord(record);
          await updateLocalSyncState(storeName, recordId, 'synced');
          console.info(`[JanmaSaathi Sync] Upload succeeded for ${storeName} [ID: ${recordId}]. Marked as synced.`);
          processedCount++;
        } else if (storeName === 'messageDrafts') {
          const syncedRecord = {
            ...record,
            delivered: true,
            syncStatus: 'delivered' as const,
            syncState: 'synced' as const,
            lastAttemptAt: new Date().toISOString(),
          };
          await createDirectMessage(syncedRecord);
          await updateLocalSyncState(storeName, recordId, 'synced');
          await saveLocalDraft(storeName, syncedRecord);
          console.info(`[JanmaSaathi Sync] Upload succeeded for ${storeName} [ID: ${recordId}]. Marked as synced.`);
          processedCount++;
        }
      } catch (itemErr: any) {
        const errMsg = itemErr.message || String(itemErr);
        console.warn(
          `[JanmaSaathi Sync] Upload failed for ${storeName} [ID: ${recordId}]: ${errMsg}. Preserved local draft.`
        );
        errors.push(`Store ${storeName} record ${recordId}: ${errMsg}`);

        // Handle permanent permission / validation errors by marking as auth_error or conflict
        if (errMsg.includes('permission') || errMsg.includes('PERMISSION_DENIED')) {
          await updateLocalSyncState(storeName, recordId, 'auth_error', errMsg);
        } else {
          await updateLocalSyncState(storeName, recordId, 'conflict', errMsg);
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

    console.info(
      `[JanmaSaathi Sync] Sync cycle finished. ${processedCount} synced successfully, ${errors.length} failed. Total pending remaining: ${remaining.length}.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('janmasaathi:synced', {
          detail: { processedCount, errors, remainingCount: remaining.length },
        })
      );
    }
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

  const runSync = () => {
    triggerBackgroundSync(owningUidProvider()).catch(() => {});
  };

  // 1. Browser online event
  window.addEventListener('online', () => {
    console.info('[JanmaSaathi Sync Trigger] Network online event detected. Initiating sync...');
    runSync();
  });

  // 2. Visibility change event (when user switches back to application tab)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.info('[JanmaSaathi Sync Trigger] Tab resumed/visible. Checking pending syncs...');
      runSync();
    }
  });

  // 3. Window focus event
  window.addEventListener('focus', () => {
    runSync();
  });

  // 4. Mobile / PWA pageshow event
  window.addEventListener('pageshow', () => {
    runSync();
  });

  // 5. Initial application startup sync checks
  setTimeout(runSync, 1500);
  setTimeout(runSync, 6000);
}
