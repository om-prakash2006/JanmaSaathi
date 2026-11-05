import type { ClinicalScreeningResult } from '../ml/clinicalScreening';

export type Role = 'mother' | 'worker' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
  staffId?: string;
  phone: string;
  avatarUrl?: string;
  mcpId?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedSubCentre?: string;
  village?: string;
  hamlet?: string;
}

export interface Mother {
  id: string; // e.g. MCP-2025-0894
  name: string;
  age: number;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  edd: string; // e.g. 18 Oct 2025
  trimester: 1 | 2 | 3;
  assignedWorkerId: string;
  assignedWorkerName: string;
  village: string;
  hamlet: string;
  mcpCardNumber: string;
  mcpIssuedDate: string;
  phone: string;
  email: string;
  riskCategory: 'low' | 'medium' | 'high' | 'pending';
  lastVisitDate?: string;
  lastVisitSummary?: string;
  authUid?: string | null;
  parity?: number;
  gravidity?: number;
  lmpDate?: string;
  isSynthetic: boolean;
}

export interface HealthWorker {
  id: string; // e.g. HW-44120
  staffCode: string;
  name: string;
  role: 'Health Worker' | 'Senior Health Worker';
  assignedSubCentre: string;
  assignedHamlets: string[];
  village: string;
  phone: string;
  supervisorId: string;
  activeMothersCount: number;
  status: 'active' | 'on-leave' | 'unassigned';
  experienceYears: number;
  isSynthetic: boolean;
}

export interface Supervisor {
  id: string; // e.g. SUP-2025-012
  name: string;
  designation: string;
  block: string;
  district: string;
  managedSectors: string[];
  isSynthetic: boolean;
}

export interface MLPrediction {
  riskCategory: 'Low' | 'Moderate' | 'High';
  confidenceScore?: number;
  decisionPath: string[];
  contributingFeatures: {
    featureName: string;
    featureKey?: string;
    inputValue: number;
    condition: string;
    threshold: number;
    unit: string;
    impact: 'increases_risk' | 'lowers_risk' | 'neutral';
    deltaHighRisk?: number;
    deltaLowRisk?: number;
    description: string;
    descriptionEn?: string;
    descriptionHi?: string;
    descriptionOr?: string;
  }[];
  featuresContributingToIncreasedRisk?: {
    featureName: string;
    featureKey?: string;
    inputValue: number;
    condition: string;
    threshold: number;
    unit: string;
    impact: 'increases_risk';
    deltaHighRisk?: number;
    description: string;
    descriptionEn?: string;
    descriptionHi?: string;
    descriptionOr?: string;
  }[];
  featuresContributingToDecreasedRisk?: {
    featureName: string;
    featureKey?: string;
    inputValue: number;
    condition: string;
    threshold: number;
    unit: string;
    impact: 'lowers_risk';
    deltaLowRisk?: number;
    description: string;
    descriptionEn?: string;
    descriptionHi?: string;
    descriptionOr?: string;
  }[];
  evaluatedModelFeatures?: {
    featureKey: string;
    featureName: string;
    featureNameHi: string;
    featureNameOr: string;
    recordedValue: number;
    unit: string;
    normalReference: string;
    isEvaluatedInPath: boolean;
    impactOnPrediction: 'increases_risk' | 'lowers_risk' | 'neutral';
  }[];
  summaryExplanation?: {
    en: string;
    hi: string;
    or: string;
  };
  distributionNote?: string;
  modelVersion: string;
  preprocessingVersion: string;
  explanationMethod: string;
  limitationsNote: string;
  leafClassDistribution?: { Low: number; Moderate: number; High: number };
  leafTotalSamples?: number;
  terminalLeafSamples?: number;
}

export interface MaternalAssessment {
  id: string; // e.g. ASM-2026-9042-01
  motherId: string;
  motherName: string;
  workerId: string;
  workerName: string;
  recordedAt: string;
  gestationalWeek: number;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  bloodGlucose: number;
  bodyTemp: number;
  hemoglobin?: number;
  fundalHeight?: number;
  fetalHeartRate?: number;
  fetalMovementStatus: 'normal' | 'reduced' | 'absent';
  dangerSigns: string[];
  symptomsNotes: string;
  nutritionalAdvice: string;

  // Extended fields for Phase 2 ML & Persistence
  originalMeasurements?: {
    age: number;
    systolicBP: number;
    diastolicBP: number;
    bloodSugar: number;
    bloodSugarUnit: string;
    bodyTemp: number;
    bodyTempUnit: string;
    heartRate: number;
  };
  normalizedModelInputs?: {
    age: number;
    systolicBP: number;
    diastolicBP: number;
    bloodSugarMmolL: number;
    bodyTempFahrenheit: number;
    heartRateBpm: number;
  };
  modelPrediction?: MLPrediction;
  featureExplanations?: MLPrediction['contributingFeatures'];
  supplementaryDangerObservations?: {
    haemoglobinGdl: number | null;
    bleeding: boolean;
    swelling: string;
    reducedFetalMovement: boolean;
    clinicalNotes: string;
  };
  modelVersion?: string;
  preprocessingVersion?: string;
  explanationMethod?: string;
  assessedAt?: string;

  mlScreeningResult?: {
    status: 'success' | 'model_unavailable' | 'validation_failed';
    riskCategory?: 'Low' | 'Moderate' | 'High';
    confidenceScore?: number;
    message?: string;
    explanation?: MLPrediction;
  };

  ruleBasedDangerIdentified: boolean;
  ruleBasedAlertDetails: string[];
  clinicalScreeningResult?: ClinicalScreeningResult;
  supervisorReviewStatus: 'pending' | 'signed_off' | 'clarification_requested';
  supervisorNotes?: string;
  isSynthetic: boolean;
}

export interface HealthUpdate {
  healthUpdateId: string;
  motherId: string;
  motherName: string;
  submittedBy: string;
  assignedHealthWorkerId: string;
  assignedHealthWorkerName: string;
  observations: string;
  symptoms: string[];
  notes: string;
  submittedAt: string;
  reviewStatus: 'pending' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  isSynthetic: boolean;
}

export interface Referral {
  id: string; // REF-2025-0041
  motherId: string;
  motherName: string;
  workerId: string;
  workerName: string;
  referredToFacility: string;
  facilityType: 'Sub-Centre' | 'PHC' | 'CHC' | 'District Hospital';
  reasonForReferral: string;
  priority: 'routine' | 'urgent' | 'emergency';
  transportArranged: boolean;
  accompaniedByWorker: boolean;
  status: 'initiated' | 'acknowledged' | 'in_transit' | 'arrived' | 'completed' | 'clarification_requested';
  supervisorRemarks?: string;
  createdAt: string;
  isSynthetic: boolean;
}

export interface Appointment {
  id: string;
  motherId: string;
  title: string;
  date: string; // e.g. "Thursday, 12 June 2025"
  month: string; // e.g. "JUN"
  day: string; // e.g. "12"
  time: string; // e.g. "10:30 AM"
  facility: string; // e.g. "Sub-Centre Rampur Health Post"
  notes: string;
  status: 'confirmed' | 'rescheduled' | 'completed';
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'mother' | 'worker';
  text: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
  motherId?: string;
}

export interface VillageAllocation {
  id: string;
  villageName: string;
  sector: string;
  subCentre: string;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  totalMothers: number;
  allocatedMothers: number;
}
