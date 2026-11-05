import { MaternalAssessment, HealthUpdate, Referral } from '../types';

const OFFLINE_ASSESSMENTS_KEY = 'janmasaathi_offline_assessments_queue';
const OFFLINE_UPDATES_KEY = 'janmasaathi_offline_updates_queue';
const OFFLINE_REFERRALS_KEY = 'janmasaathi_offline_referrals_queue';

export function getOfflineQueueStats(): { assessments: number; updates: number; referrals: number } {
  try {
    const assessments = JSON.parse(localStorage.getItem(OFFLINE_ASSESSMENTS_KEY) || '[]');
    const updates = JSON.parse(localStorage.getItem(OFFLINE_UPDATES_KEY) || '[]');
    const referrals = JSON.parse(localStorage.getItem(OFFLINE_REFERRALS_KEY) || '[]');
    return {
      assessments: assessments.length,
      updates: updates.length,
      referrals: referrals.length,
    };
  } catch {
    return { assessments: 0, updates: 0, referrals: 0 };
  }
}

export function queueOfflineAssessment(assessment: MaternalAssessment) {
  try {
    const list = JSON.parse(localStorage.getItem(OFFLINE_ASSESSMENTS_KEY) || '[]');
    list.push({ ...assessment, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_ASSESSMENTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to queue offline assessment:', err);
  }
}

export function queueOfflineUpdate(update: HealthUpdate) {
  try {
    const list = JSON.parse(localStorage.getItem(OFFLINE_UPDATES_KEY) || '[]');
    list.push({ ...update, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_UPDATES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to queue offline update:', err);
  }
}

export function queueOfflineReferral(referral: Referral) {
  try {
    const list = JSON.parse(localStorage.getItem(OFFLINE_REFERRALS_KEY) || '[]');
    list.push({ ...referral, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_REFERRALS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to queue offline referral:', err);
  }
}

export function getQueuedAssessments(): MaternalAssessment[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_ASSESSMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearOfflineQueues() {
  localStorage.removeItem(OFFLINE_ASSESSMENTS_KEY);
  localStorage.removeItem(OFFLINE_UPDATES_KEY);
  localStorage.removeItem(OFFLINE_REFERRALS_KEY);
}
