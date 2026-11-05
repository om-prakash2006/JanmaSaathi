import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import {
  seedInitialDataIfEmpty,
  subscribeMothers,
  subscribeWorkers,
  subscribeSupervisors,
  subscribeAssessments,
  subscribeHealthUpdates,
  subscribeReferrals,
  subscribeAppointments,
  subscribeMessages,
  subscribeAssignments,
  createMotherRecord,
  createAssessmentRecord,
  updateAssessmentReview,
  createHealthUpdateRecord,
  updateHealthUpdateReview,
  createReferralRecord,
  updateReferralStatusRecord,
  createDirectMessage,
  createOrUpdateAssignment,
  logAuditEvent,
} from '../services/firestoreService';
import { saveLocalDraft, getLocalDrafts } from '../utils/indexedDB';
import { triggerBackgroundSync, initAutoSyncTriggers } from '../utils/syncManager';
import { evaluateMaternalRiskLocally } from '../ml/mlEngine';

interface DataContextType {
  supervisor: Supervisor;
  workers: HealthWorker[];
  mothers: Mother[];
  healthUpdates: HealthUpdate[];
  appointments: Appointment[];
  messages: DirectMessage[];
  assessments: MaternalAssessment[];
  referrals: Referral[];
  villageAllocations: VillageAllocation[];
  isLoading: boolean;
  dbError: string | null;

  // Real Database Mutations
  addHealthUpdate: (data: {
    motherId: string;
    motherName: string;
    observations: string;
    symptoms: string[];
    notes: string;
    submittedBy?: string;
  }) => Promise<HealthUpdate>;

  reviewHealthUpdate: (
    healthUpdateId: string,
    reviewedBy: string,
    reviewNotes: string
  ) => Promise<void>;

  addAssessment: (
    assessment: Omit<MaternalAssessment, 'id' | 'recordedAt' | 'isSynthetic'>
  ) => Promise<MaternalAssessment>;

  reviewAssessment: (
    id: string,
    status: 'signed_off' | 'clarification_requested',
    notes: string,
    reviewedBy?: string
  ) => Promise<void>;

  addReferral: (
    referral: Omit<Referral, 'id' | 'createdAt' | 'status' | 'isSynthetic'>
  ) => Promise<Referral>;

  updateReferralStatus: (
    id: string,
    status: Referral['status'],
    supervisorRemarks?: string
  ) => Promise<void>;

  allocateWorker: (
    allocationId: string,
    workerId: string,
    allocatedMotherIds?: string[]
  ) => Promise<void>;

  sendMessage: (
    text: string,
    senderRole: 'mother' | 'worker',
    senderId: string,
    senderName: string
  ) => Promise<void>;

  registerMother: (data: Omit<Mother, 'id' | 'isSynthetic'>) => Promise<Mother>;

  resetToDefaultData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_CACHE_KEY = 'janmasaathi_firestore_cache_v3';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supervisor, setSupervisor] = useState<Supervisor>(DEMO_SUPERVISOR);
  const [workers, setWorkers] = useState<HealthWorker[]>(DEMO_WORKERS);
  const [mothers, setMothers] = useState<Mother[]>(DEMO_MOTHERS);
  const [healthUpdates, setHealthUpdates] = useState<HealthUpdate[]>(DEMO_HEALTH_UPDATES);
  const [appointments, setAppointments] = useState<Appointment[]>(DEMO_APPOINTMENTS);
  const [messages, setMessages] = useState<DirectMessage[]>(DEMO_MESSAGES);
  const [assessments, setAssessments] = useState<MaternalAssessment[]>(DEMO_ASSESSMENTS);
  const [referrals, setReferrals] = useState<Referral[]>(DEMO_REFERRALS);
  const [villageAllocations, setVillageAllocations] = useState<VillageAllocation[]>(DEMO_VILLAGE_ALLOCATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // 1. Restore local IndexedDB drafts & fallback cache on mount
  useEffect(() => {
    async function restoreLocalData() {
      try {
        // Load IndexedDB stores
        const localMothers = await getLocalDrafts<Mother>('maternalProfiles');
        const localAssessments = await getLocalDrafts<MaternalAssessment>('assessmentDrafts');
        const localUpdates = await getLocalDrafts<HealthUpdate>('healthUpdateDrafts');
        const localRefs = await getLocalDrafts<Referral>('referralDrafts');
        const localMsgs = await getLocalDrafts<DirectMessage>('messageDrafts');

        if (localMothers.length > 0) {
          setMothers((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newDrafts = localMothers.filter((m) => !existingIds.has(m.id));
            return [...newDrafts, ...prev];
          });
        }

        if (localAssessments.length > 0) {
          setAssessments((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newDrafts = localAssessments.filter((a) => !existingIds.has(a.id));
            return [...newDrafts, ...prev];
          });
        }

        if (localUpdates.length > 0) {
          setHealthUpdates((prev) => {
            const existingIds = new Set(prev.map((u) => u.healthUpdateId));
            const newDrafts = localUpdates.filter((u) => !existingIds.has(u.healthUpdateId));
            return [...newDrafts, ...prev];
          });
        }

        if (localRefs.length > 0) {
          setReferrals((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newDrafts = localRefs.filter((r) => !existingIds.has(r.id));
            return [...newDrafts, ...prev];
          });
        }

        if (localMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newDrafts = localMsgs.filter((m) => !existingIds.has(m.id));
            return [...newDrafts, ...prev];
          });
        }
      } catch (err) {
        console.warn('IndexedDB local restoration notice:', err);
      }
    }

    restoreLocalData();
    initAutoSyncTriggers(() => undefined);
  }, []);

  // 2. Connect real-time Firestore listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function initFirestore() {
      setIsLoading(true);
      try {
        unsubs.push(
          subscribeMothers(
            (liveMothers) => {
              if (liveMothers.length > 0) {
                setMothers((prev) => {
                  const localDrafts = prev.filter((m) => (m as any).syncState === 'pending_sync');
                  const liveIds = new Set(liveMothers.map((m) => m.id));
                  const unSynced = localDrafts.filter((m) => !liveIds.has(m.id));
                  return [...unSynced, ...liveMothers];
                });
                setDbError(null);
              }
            },
            (err) => {
              console.warn('Mothers sync notice:', err.message);
            }
          )
        );

        unsubs.push(
          subscribeWorkers((liveWorkers) => {
            if (liveWorkers.length > 0) setWorkers(liveWorkers);
          })
        );

        unsubs.push(
          subscribeSupervisors((liveSups) => {
            if (liveSups.length > 0) setSupervisor(liveSups[0]);
          })
        );

        unsubs.push(
          subscribeAssessments((liveAssessments) => {
            if (liveAssessments.length > 0) {
              setAssessments((prev) => {
                const localDrafts = prev.filter((a) => (a as any).syncState === 'pending_sync');
                const liveIds = new Set(liveAssessments.map((a) => a.id));
                const unSynced = localDrafts.filter((a) => !liveIds.has(a.id));
                return [...unSynced, ...liveAssessments];
              });
            }
          })
        );

        unsubs.push(
          subscribeHealthUpdates((liveUpdates) => {
            if (liveUpdates.length > 0) {
              setHealthUpdates((prev) => {
                const localDrafts = prev.filter((u) => (u as any).syncState === 'pending_sync');
                const liveIds = new Set(liveUpdates.map((u) => u.healthUpdateId));
                const unSynced = localDrafts.filter((u) => !liveIds.has(u.healthUpdateId));
                return [...unSynced, ...liveUpdates];
              });
            }
          })
        );

        unsubs.push(
          subscribeReferrals((liveRefs) => {
            if (liveRefs.length > 0) {
              setReferrals((prev) => {
                const localDrafts = prev.filter((r) => (r as any).syncState === 'pending_sync');
                const liveIds = new Set(liveRefs.map((r) => r.id));
                const unSynced = localDrafts.filter((r) => !liveIds.has(r.id));
                return [...unSynced, ...liveRefs];
              });
            }
          })
        );

        unsubs.push(
          subscribeAppointments((liveAppts) => {
            if (liveAppts.length > 0) setAppointments(liveAppts);
          })
        );

        unsubs.push(
          subscribeMessages((liveMsgs) => {
            if (liveMsgs.length > 0) {
              setMessages((prev) => {
                const localDrafts = prev.filter((m) => (m as any).syncState === 'pending_sync');
                const liveIds = new Set(liveMsgs.map((m) => m.id));
                const unSynced = localDrafts.filter((m) => !liveIds.has(m.id));
                return [...unSynced, ...liveMsgs];
              });
            }
          })
        );

        unsubs.push(
          subscribeAssignments((liveAssignments) => {
            if (liveAssignments.length > 0) setVillageAllocations(liveAssignments);
          })
        );
      } catch (err: any) {
        console.warn('Firestore live subscription fallback active:', err.message);
        setDbError(err.message || 'Connecting to Cloud Firestore');
      } finally {
        setIsLoading(false);
      }
    }

    initFirestore();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // 3. Save snapshot to local cache for instant fallback
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_CACHE_KEY,
        JSON.stringify({
          mothers,
          workers,
          assessments,
          healthUpdates,
          referrals,
          appointments,
          messages,
        })
      );
    } catch {
      // ignore
    }
  }, [mothers, workers, assessments, healthUpdates, referrals, appointments, messages]);

  // MUTATIONS with Local-First IndexedDB Persistence

  const addHealthUpdate = useCallback(
    async (data: {
      motherId: string;
      motherName: string;
      observations: string;
      symptoms: string[];
      notes: string;
      submittedBy?: string;
    }): Promise<HealthUpdate> => {
      const mother = mothers.find((m) => m.id === data.motherId) || mothers[0];
      const newUpdateId = `HUPD-${Date.now().toString().slice(-6)}`;
      const nowFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newUpdate: HealthUpdate = {
        healthUpdateId: newUpdateId,
        motherId: data.motherId,
        motherName: data.motherName,
        assignedHealthWorkerId: mother.assignedWorkerId,
        assignedHealthWorkerName: mother.assignedWorkerName,
        submittedAt: nowFormatted,
        observations: data.observations,
        symptoms: data.symptoms,
        notes: data.notes,
        reviewStatus: 'pending',
        submittedBy: data.submittedBy || 'mother-auth-user',
        isSynthetic: false,
      };

      // Save to IndexedDB object store
      await saveLocalDraft('healthUpdateDrafts', { ...newUpdate, id: newUpdateId });

      try {
        await createHealthUpdateRecord(newUpdate);
        await logAuditEvent('CREATE_HEALTH_UPDATE', data.motherId, 'mother', 'healthUpdates', newUpdateId, {
          observations: data.observations,
        });
      } catch (err) {
        console.warn('Health update saved locally (queued for offline sync):', err);
      }

      setHealthUpdates((prev) => [newUpdate, ...prev]);
      triggerBackgroundSync();
      return newUpdate;
    },
    [mothers]
  );

  const reviewHealthUpdate = useCallback(
    async (healthUpdateId: string, reviewedBy: string, reviewNotes: string): Promise<void> => {
      try {
        await updateHealthUpdateReview(healthUpdateId, reviewedBy, reviewNotes);
        await logAuditEvent('REVIEW_HEALTH_UPDATE', reviewedBy, 'worker', 'healthUpdates', healthUpdateId, {
          reviewNotes,
        });
      } catch (err) {
        console.warn('Realtime Firestore write fallback:', err);
      }

      setHealthUpdates((prev) =>
        prev.map((u) =>
          u.healthUpdateId === healthUpdateId
            ? {
                ...u,
                reviewStatus: 'reviewed',
                reviewedBy,
                reviewNotes,
                reviewedAt: new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
              }
            : u
        )
      );
    },
    []
  );

  const addAssessment = useCallback(
    async (
      assessmentData: Omit<MaternalAssessment, 'id' | 'recordedAt' | 'isSynthetic'>
    ): Promise<MaternalAssessment> => {
      const newId = `ASMT-${assessmentData.motherId}-${Date.now().toString().slice(-4)}`;
      const recordedAtFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const targetMother = mothers.find((m) => m.id === assessmentData.motherId);
      let newAssessment: MaternalAssessment = {
        ...assessmentData,
        id: newId,
        recordedAt: recordedAtFormatted,
        isSynthetic: targetMother?.isSynthetic || false,
      };

      // If prediction missing or calculated offline, evaluate local deterministic ML Decision Tree
      if (!newAssessment.modelPrediction) {
        const rawAge = newAssessment.originalMeasurements?.age;
        const ageNum = typeof rawAge === 'number' ? rawAge : typeof (rawAge as any)?.value === 'number' ? (rawAge as any).value : targetMother?.age || 24;

        const localEval = evaluateMaternalRiskLocally({
          age: ageNum,
          systolicBP: newAssessment.systolicBP,
          diastolicBP: newAssessment.diastolicBP,
          bloodSugar: newAssessment.bloodGlucose,
          bodyTemp: newAssessment.bodyTemp,
          heartRate: newAssessment.heartRate,
        });

        if (localEval.success && localEval.modelPrediction) {
          newAssessment.modelPrediction = localEval.modelPrediction as any;
        }
      }

      // 1. Guaranteed local storage write in IndexedDB
      await saveLocalDraft('assessmentDrafts', {
        ...newAssessment,
        owningUid: assessmentData.workerId,
      });

      // 2. Online write attempt with Cloud Firestore
      try {
        await createAssessmentRecord(newAssessment);
        try {
          await logAuditEvent('CREATE_ASSESSMENT', assessmentData.workerId, 'worker', 'assessments', newId, {
            motherId: assessmentData.motherId,
          });
        } catch {
          // secondary
        }
      } catch (err: any) {
        console.warn('Assessment saved locally (queued for offline sync):', err?.message);
      }

      setAssessments((prev) => [newAssessment, ...prev]);

      // Update mother's last visit summary
      setMothers((prev) =>
        prev.map((m) =>
          m.id === assessmentData.motherId
            ? {
                ...m,
                lastVisitDate: recordedAtFormatted,
                lastVisitSummary: `Antenatal Assessment: BP ${assessmentData.systolicBP}/${assessmentData.diastolicBP}`,
              }
            : m
        )
      );

      triggerBackgroundSync();
      return newAssessment;
    },
    [mothers]
  );

  const reviewAssessment = useCallback(
    async (
      id: string,
      status: 'signed_off' | 'clarification_requested',
      notes: string,
      reviewedBy: string = 'Dr. Rajesh Kumar'
    ): Promise<void> => {
      try {
        await updateAssessmentReview(id, status, notes, reviewedBy);
        await logAuditEvent('REVIEW_ASSESSMENT', reviewedBy, 'supervisor', 'assessments', id, {
          status,
          notes,
        });
      } catch (err) {
        console.warn('Realtime Firestore write fallback:', err);
      }

      setAssessments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                supervisorReviewStatus: status,
                supervisorNotes: notes,
              }
            : a
        )
      );
    },
    []
  );

  const addReferral = useCallback(
    async (
      referralData: Omit<Referral, 'id' | 'createdAt' | 'status' | 'isSynthetic'>
    ): Promise<Referral> => {
      const newId = `REF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReferral: Referral = {
        ...referralData,
        id: newId,
        status: 'initiated',
        createdAt: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        isSynthetic: false,
      };

      await saveLocalDraft('referralDrafts', newReferral);

      try {
        await createReferralRecord(newReferral);
        await logAuditEvent('CREATE_REFERRAL', referralData.workerId, 'worker', 'referrals', newId, {
          motherId: referralData.motherId,
          priority: referralData.priority,
          facility: referralData.referredToFacility,
        });
      } catch (err) {
        console.warn('Referral saved locally (queued for offline sync):', err);
      }

      setReferrals((prev) => [newReferral, ...prev]);
      triggerBackgroundSync();
      return newReferral;
    },
    []
  );

  const updateReferralStatus = useCallback(
    async (
      id: string,
      status: Referral['status'],
      supervisorRemarks?: string
    ): Promise<void> => {
      try {
        await updateReferralStatusRecord(id, status, supervisorRemarks);
        await logAuditEvent('UPDATE_REFERRAL_STATUS', 'supervisor', 'supervisor', 'referrals', id, {
          status,
          supervisorRemarks,
        });
      } catch (err) {
        console.warn('Realtime Firestore write fallback:', err);
      }

      setReferrals((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                ...(supervisorRemarks ? { supervisorRemarks } : {}),
              }
            : r
        )
      );
    },
    []
  );

  const allocateWorker = useCallback(
    async (
      allocationId: string,
      workerId: string,
      allocatedMotherIds?: string[]
    ): Promise<void> => {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker) return;

      const allocation = villageAllocations.find((a) => a.id === allocationId);
      if (!allocation) return;

      const updatedAllocation: VillageAllocation = {
        ...allocation,
        assignedWorkerId: workerId,
        assignedWorkerName: worker.name,
      };

      try {
        await createOrUpdateAssignment(updatedAllocation, allocatedMotherIds);
        await logAuditEvent('ALLOCATE_WORKER', 'supervisor', 'supervisor', 'assignments', allocationId, {
          workerId,
          allocatedMotherIds,
        });
      } catch (err) {
        console.warn('Realtime Firestore write fallback:', err);
      }

      setVillageAllocations((prev) =>
        prev.map((a) => (a.id === allocationId ? updatedAllocation : a))
      );

      if (allocatedMotherIds && allocatedMotherIds.length > 0) {
        setMothers((prev) =>
          prev.map((m) =>
            allocatedMotherIds.includes(m.id)
              ? {
                  ...m,
                  assignedWorkerId: workerId,
                  assignedWorkerName: worker.name,
                }
              : m
          )
        );
      }
    },
    [workers, villageAllocations]
  );

  const sendMessage = useCallback(
    async (
      text: string,
      senderRole: 'mother' | 'worker',
      senderId: string,
      senderName: string
    ): Promise<void> => {
      const newMsgId = `MSG-${Date.now().toString().slice(-5)}`;

      const newMsg: DirectMessage = {
        id: newMsgId,
        senderId,
        senderName,
        senderRole,
        text,
        timestamp: 'Just now',
        delivered: true,
        read: false,
      };

      await saveLocalDraft('messageDrafts', newMsg);

      try {
        await createDirectMessage(newMsg);
      } catch (err) {
        console.warn('Message saved locally (queued for offline sync):', err);
      }

      setMessages((prev) => [...prev, newMsg]);
      triggerBackgroundSync();
    },
    []
  );

  const registerMother = useCallback(
    async (motherData: Omit<Mother, 'id' | 'isSynthetic'>): Promise<Mother> => {
      const newId = `MCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newMother: Mother = {
        ...motherData,
        id: newId,
        authUid: null,
        isSynthetic: false,
      };

      await saveLocalDraft('maternalProfiles', newMother);

      try {
        await createMotherRecord(newMother);
        try {
          await logAuditEvent('REGISTER_MOTHER', motherData.assignedWorkerId, 'worker', 'mothers', newId, {
            mcpCardNumber: motherData.mcpCardNumber,
            name: motherData.name,
          });
        } catch {
          // audit log is secondary to registration
        }
      } catch (err: any) {
        console.warn('Mother registration saved locally (queued for offline sync):', err?.message);
      }

      setMothers((prev) => [newMother, ...prev]);
      triggerBackgroundSync();
      return newMother;
    },
    []
  );

  const resetToDefaultData = useCallback(async (): Promise<void> => {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    setSupervisor(DEMO_SUPERVISOR);
    setWorkers(DEMO_WORKERS);
    setMothers(DEMO_MOTHERS);
    setHealthUpdates(DEMO_HEALTH_UPDATES);
    setAppointments(DEMO_APPOINTMENTS);
    setMessages(DEMO_MESSAGES);
    setAssessments(DEMO_ASSESSMENTS);
    setReferrals(DEMO_REFERRALS);
    setVillageAllocations(DEMO_VILLAGE_ALLOCATIONS);

    try {
      await seedInitialDataIfEmpty();
    } catch {
      // ignore
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        supervisor,
        workers,
        mothers,
        healthUpdates,
        appointments,
        messages,
        assessments,
        referrals,
        villageAllocations,
        isLoading,
        dbError,
        addHealthUpdate,
        reviewHealthUpdate,
        addAssessment,
        reviewAssessment,
        addReferral,
        updateReferralStatus,
        allocateWorker,
        sendMessage,
        registerMother,
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
