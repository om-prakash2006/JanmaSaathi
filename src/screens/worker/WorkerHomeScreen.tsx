import React from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerHomeScreenProps {
  onStartNewAssessment: (motherId?: string) => void;
  onNavigateToPatients: () => void;
  onNavigateToReferrals: () => void;
  onSelectMother: (motherId: string) => void;
  onRegisterMother: () => void;
}

export const WorkerHomeScreen: React.FC<WorkerHomeScreenProps> = ({
  onStartNewAssessment,
  onNavigateToPatients,
  onNavigateToReferrals,
  onSelectMother,
  onRegisterMother,
}) => {
  const { mothers, workers, referrals } = useData();
  const { t } = useLanguage();
  const worker = workers[0]; // Sunita Devi

  const assignedMothers = mothers.filter((m) => m.assignedWorkerId === worker.id);
  const pendingReferrals = referrals.filter((r) => r.status === 'initiated');

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Location & Context Header */}
      <section className="flex flex-col space-y-space-xs pt-space-xs">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-tertiary font-sans text-xs">
            <span className="material-symbols-outlined text-[15px] text-primary-container">location_on</span>
            Village Rampur, Sector 4 • Sub-Centre
          </span>
          <span className="font-sans text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary-container">badge</span>
            {t('roleWorker')}
          </span>
        </div>
        <div className="pt-space-xs">
          <h1 className="font-serif text-2xl text-on-surface font-normal tracking-tight">
            {t('greetingSunita')}
          </h1>
          <p className="font-sans text-xs text-secondary">
            {t('workerWorkspaceSubtitle')}
          </p>
        </div>
      </section>

      {/* 2. Primary Hero Action Card */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary p-space-lg shadow-sm">
        <div className="absolute -right-6 -bottom-8 pointer-events-none opacity-10">
          <span className="material-symbols-outlined text-[160px] text-surface-container-lowest">ecg_heart</span>
        </div>
        <div className="relative z-10 flex flex-col space-y-space-md">
          <div className="flex items-start justify-between">
            <div className="inline-flex p-2 rounded-lg bg-on-primary/10">
              <span className="material-symbols-outlined text-[24px] text-on-primary">clinical_notes</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-on-primary/15 text-on-primary tracking-wide">
              {t('statusActive')}
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl text-on-primary font-normal leading-snug">
              {t('recordAssessment')}
            </h2>
            <p className="font-sans text-xs text-on-primary/80 leading-relaxed">
              Record a mother's health observations, identify danger signs, and perform explainable maternal screening.
            </p>
          </div>
          <div className="pt-space-xs flex flex-col gap-space-sm">
            <button
              onClick={() => onStartNewAssessment()}
              className="w-full min-h-[48px] px-space-lg rounded bg-surface text-primary-container font-sans text-sm font-bold flex items-center justify-center gap-2 active:opacity-95 shadow-sm transition-transform active:scale-[0.99] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>{t('newMaternalAssessment')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Community Caseload Grid */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base text-tertiary">{t('activeRegister')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div
            onClick={onNavigateToPatients}
            className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('assignedMothers')}</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">pregnant_woman</span>
            </div>
            <span className="font-serif text-2xl text-tertiary font-bold tracking-tight">
              {assignedMothers.length > 0 ? assignedMothers.length : 28}
            </span>
          </div>

          <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('todaysVisits')}</span>
              <span className="material-symbols-outlined text-[18px] text-primary-container">calendar_today</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-tertiary font-bold tracking-tight">3</span>
              <span className="font-sans text-xs text-secondary">{t('statusScheduled')}</span>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('priorityFollowups')}</span>
              <span className="material-symbols-outlined text-[18px] text-primary-container">priority_high</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-primary-container font-bold tracking-tight">3</span>
            </div>
          </div>

          <div
            onClick={onNavigateToReferrals}
            className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('pendingReports')}</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">assignment_late</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-tertiary font-bold tracking-tight">
                {pendingReferrals.length > 0 ? pendingReferrals.length : 2}
              </span>
            </div>
          </div>
        </div>

        {/* Fast Action Cards */}
        <div className="grid grid-cols-2 gap-space-sm pt-1">
          <button
            type="button"
            onClick={onRegisterMother}
            className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center gap-2.5 text-left hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center text-primary-container shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-xs font-bold text-on-surface">{t('registerMother')}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToPatients}
            className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center gap-2.5 text-left hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center text-primary-container shrink-0">
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-xs font-bold text-on-surface">{t('navPatients')}</span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Priority Follow-ups */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif text-base text-tertiary">{t('priorityFollowups')}</h3>
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          </div>
        </div>

        <div className="space-y-space-sm">
          {/* Follow-up 1 */}
          <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-sans text-sm font-bold text-on-surface">Meena Devi</span>
                <span className="font-sans text-xs text-secondary block">ID: MCP-2025-0412</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary">
                {t('flaggedForReview')}
              </span>
            </div>
            <p className="font-sans text-xs text-tertiary">
              Post-visit blood pressure check & IFA restock. Elevated BP recorded.
            </p>
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-error font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Due: Today
              </span>
              <button
                onClick={() => onSelectMother('MCP-2025-0412')}
                className="text-primary-container font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('openProfile')}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Follow-up 2 */}
          <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-sans text-sm font-bold text-on-surface">Anjali Soren</span>
                <span className="font-sans text-xs text-secondary block">ID: MCP-2025-0689</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                {t('statusPending')}
              </span>
            </div>
            <p className="font-sans text-xs text-tertiary">
              Third trimester danger sign follow-up review.
            </p>
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Due: Tomorrow
              </span>
              <button
                onClick={() => onSelectMother('MCP-2025-0689')}
                className="text-primary-container font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('openProfile')}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Today's Scheduled Visits */}
      <section className="flex flex-col space-y-space-sm pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base text-tertiary">{t('todaysVisits')}</h3>
        </div>

        <div className="space-y-space-sm">
          {/* Visit 1: Priya Sharma */}
          <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-sans text-sm font-bold text-on-surface">Priya Sharma</span>
                <span className="font-sans text-xs text-secondary block">ID: MCP-2025-0894</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-surface-container-high text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                10:30 AM
              </span>
            </div>
            <div className="space-y-1 text-xs text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary-container">location_on</span>
                <span>Village Rampur, Sector 4 (Home Visit)</span>
              </div>
            </div>
            <div className="pt-1 flex justify-end gap-2">
              <button
                onClick={() => onStartNewAssessment('MCP-2025-0894')}
                className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
              >
                {t('startAssessment')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
