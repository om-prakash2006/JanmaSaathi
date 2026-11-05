import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import {
  Mother,
  HealthWorker,
  Supervisor,
  MaternalAssessment,
  HealthUpdate,
  Referral,
  Appointment,
  DirectMessage,
  VillageAllocation,
} from '../types';
import {
  DEMO_SUPERVISOR,
  DEMO_WORKERS,
  DEMO_MOTHERS,
  DEMO_HEALTH_UPDATES,
  DEMO_APPOINTMENTS,
  DEMO_MESSAGES,
  DEMO_ASSESSMENTS,
  DEMO_REFERRALS,
  DEMO_VILLAGE_ALLOCATIONS,
} from '../data/centralDemoData';

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  MOTHERS: 'mothers',
  HEALTH_WORKERS: 'healthWorkers',
  SUPERVISORS: 'supervisors',
  ASSIGNMENTS: 'assignments',
  ASSESSMENTS: 'assessments',
  HEALTH_UPDATES: 'healthUpdates',
  REFERRALS: 'referrals',
  REPORTS: 'reports',
  MESSAGES: 'messages',
  APPOINTMENTS: 'appointments',
  AUDIT_LOGS: 'auditLogs',
} as const;

// Helper to remove undefined fields from objects before saving to Firestore
function cleanData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Bootstrap baseline records into Firestore if the database collections are currently empty.
 * Ensures the connected database has initial operational data for Mother, Health Worker, and Supervisor.
 */
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const mothersSnap = await getDocs(collection(db, COLLECTIONS.MOTHERS));
    if (!mothersSnap.empty) {
      return false; // Already populated
    }

    console.info('Seeding initial clinical and administrative records into Firestore...');
    const batch = writeBatch(db);

    // 1. Supervisor
    const supRef = doc(db, COLLECTIONS.SUPERVISORS, DEMO_SUPERVISOR.id);
    batch.set(supRef, {
      ...cleanData(DEMO_SUPERVISOR),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Health Workers
    for (const w of DEMO_WORKERS) {
      const wRef = doc(db, COLLECTIONS.HEALTH_WORKERS, w.id);
      batch.set(wRef, {
        ...cleanData(w),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Mothers
    for (const m of DEMO_MOTHERS) {
      const mRef = doc(db, COLLECTIONS.MOTHERS, m.id);
      batch.set(mRef, {
        ...cleanData(m),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Assessments
    for (const a of DEMO_ASSESSMENTS) {
      const aRef = doc(db, COLLECTIONS.ASSESSMENTS, a.id);
      batch.set(aRef, {
        ...cleanData(a),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Health Updates
    for (const u of DEMO_HEALTH_UPDATES) {
      const uRef = doc(db, COLLECTIONS.HEALTH_UPDATES, u.healthUpdateId);
      batch.set(uRef, {
        ...cleanData(u),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 6. Referrals
    for (const r of DEMO_REFERRALS) {
      const rRef = doc(db, COLLECTIONS.REFERRALS, r.id);
      batch.set(rRef, {
        ...cleanData(r),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 7. Appointments
    for (const apt of DEMO_APPOINTMENTS) {
      const aptRef = doc(db, COLLECTIONS.APPOINTMENTS, apt.id);
      batch.set(aptRef, {
        ...cleanData(apt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 8. Messages
    for (const msg of DEMO_MESSAGES) {
      const msgRef = doc(db, COLLECTIONS.MESSAGES, msg.id);
      batch.set(msgRef, {
        ...cleanData(msg),
        createdAt: serverTimestamp(),
      });
    }

    // 9. Assignments
    for (const asgn of DEMO_VILLAGE_ALLOCATIONS) {
      const asgnRef = doc(db, COLLECTIONS.ASSIGNMENTS, asgn.id);
      batch.set(asgnRef, {
        ...cleanData(asgn),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.info('Initial records successfully committed to Cloud Firestore.');
    return true;
  } catch (error) {
    console.warn('Initial seeding skipped or permission constrained:', error);
    return false;
  }
}

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// ==========================================

export function subscribeMothers(
  onData: (mothers: Mother[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTIONS.MOTHERS), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Mother));
      onData(list);
    },
    (err) => {
      console.warn('Firestore mothers subscription notice:', err.message);
      onError?.(err);
    }
  );
}

export function subscribeWorkers(
  onData: (workers: HealthWorker[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTIONS.HEALTH_WORKERS), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthWorker));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeSupervisors(
  onData: (supervisors: Supervisor[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.SUPERVISORS),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Supervisor));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeAssessments(
  onData: (assessments: MaternalAssessment[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.ASSESSMENTS),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaternalAssessment));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeHealthUpdates(
  onData: (updates: HealthUpdate[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.HEALTH_UPDATES),
    (snap) => {
      const list = snap.docs.map((d) => ({ healthUpdateId: d.id, ...d.data() } as HealthUpdate));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeReferrals(
  onData: (referrals: Referral[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.REFERRALS),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Referral));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeAppointments(
  onData: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.APPOINTMENTS),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeMessages(
  onData: (messages: DirectMessage[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.MESSAGES),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DirectMessage));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeAssignments(
  onData: (assignments: VillageAllocation[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    collection(db, COLLECTIONS.ASSIGNMENTS),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VillageAllocation));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

// ==========================================
// REAL PERSISTENT DATABASE MUTATIONS
// ==========================================

export async function createMotherRecord(mother: Mother): Promise<Mother> {
  const docRef = doc(db, COLLECTIONS.MOTHERS, mother.id);
  const payload = {
    ...cleanData(mother),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return mother;
}

export async function updateMotherRecord(motherId: string, updates: Partial<Mother>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.MOTHERS, motherId);
  await updateDoc(docRef, {
    ...cleanData(updates),
    updatedAt: serverTimestamp(),
  });
}

export async function createAssessmentRecord(
  assessment: MaternalAssessment
): Promise<MaternalAssessment> {
  const docRef = doc(db, COLLECTIONS.ASSESSMENTS, assessment.id);
  const payload = {
    ...cleanData(assessment),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return assessment;
}

export async function updateAssessmentReview(
  id: string,
  status: 'signed_off' | 'clarification_requested',
  notes: string,
  reviewedBy: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ASSESSMENTS, id);
  await updateDoc(docRef, {
    supervisorReviewStatus: status,
    supervisorNotes: notes,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function createHealthUpdateRecord(update: HealthUpdate): Promise<HealthUpdate> {
  const docRef = doc(db, COLLECTIONS.HEALTH_UPDATES, update.healthUpdateId);
  const payload = {
    ...cleanData(update),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return update;
}

export async function updateHealthUpdateReview(
  healthUpdateId: string,
  reviewedBy: string,
  reviewNotes: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.HEALTH_UPDATES, healthUpdateId);
  await updateDoc(docRef, {
    reviewStatus: 'reviewed',
    reviewedBy,
    reviewNotes,
    reviewedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function createReferralRecord(referral: Referral): Promise<Referral> {
  const docRef = doc(db, COLLECTIONS.REFERRALS, referral.id);
  const payload = {
    ...cleanData(referral),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return referral;
}

export async function updateReferralStatusRecord(
  id: string,
  status: Referral['status'],
  supervisorRemarks?: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.REFERRALS, id);
  const payload: Record<string, any> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (supervisorRemarks !== undefined) {
    payload.supervisorRemarks = supervisorRemarks;
  }
  await updateDoc(docRef, payload);
}

export async function createDirectMessage(message: DirectMessage): Promise<DirectMessage> {
  const docRef = doc(db, COLLECTIONS.MESSAGES, message.id);
  const payload = {
    ...cleanData(message),
    createdAt: serverTimestamp(),
  };
  await setDoc(docRef, payload);
  return message;
}

export async function createOrUpdateAssignment(
  assignment: VillageAllocation,
  allocatedMotherIds?: string[]
): Promise<void> {
  const batch = writeBatch(db);

  // Update assignment doc
  const asgnRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id);
  batch.set(
    asgnRef,
    {
      ...cleanData(assignment),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Reassign mothers if mother IDs provided
  if (allocatedMotherIds && allocatedMotherIds.length > 0) {
    for (const mId of allocatedMotherIds) {
      const mRef = doc(db, COLLECTIONS.MOTHERS, mId);
      batch.update(mRef, {
        assignedWorkerId: assignment.assignedWorkerId,
        assignedWorkerName: assignment.assignedWorkerName,
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}

export async function logAuditEvent(
  action: string,
  actorId: string,
  actorRole: string,
  targetResource: string,
  targetId: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const logRef = doc(db, COLLECTIONS.AUDIT_LOGS, logId);
    await setDoc(logRef, {
      id: logId,
      action,
      actorId,
      actorRole,
      targetResource,
      targetId,
      details: cleanData(details),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

/**
 * Upload clinical document attachment to Cloud Storage and return download URL
 */
export async function uploadClinicalDocument(
  file: File,
  motherId: string
): Promise<{ url: string; path: string }> {
  const storagePath = `documents/${motherId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, path: storagePath };
}
