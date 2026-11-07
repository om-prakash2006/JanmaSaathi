import React from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface SupervisorOverviewScreenProps {
  onNavigateToAssign: () => void;
  onNavigateToWorkers: () => void;
  onNavigateToReferrals: () => void;
  onNavigateToReports: () => void;
}

export const SupervisorOverviewScreen: React.FC<SupervisorOverviewScreenProps> = ({
  onNavigateToAssign,
  onNavigateToWorkers,
  onNavigateToReferrals,
  onNavigateToReports,
}) => {
  const { supervisor, workers, mothers, referrals, assessments } = useData();
  const { t, formatName, formatNumber, localize } = useLanguage();

  const unassignedWorkers = workers.filter((w) => w.status === 'unassigned');
  const pendingReports = assessments.filter((a) => a.supervisorReviewStatus === 'pending');
  const activeReferrals = referrals.filter((r) => r.status !== 'completed');

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header Greeting & Context */}
      <section className="flex flex-col space-y-space-xs pt-space-xs">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-tertiary font-sans text-xs">
            <span className="material-symbols-outlined text-[15px] text-primary-container">shield</span>
            {localize(supervisor.district)}
          </span>
          <span className="font-sans text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary-container">apartment</span>
            {localize(supervisor.block)}
          </span>
        </div>
        <div className="pt-space-xs">
          <h1 className="font-serif text-2xl text-on-surface font-normal tracking-tight">
            {t('greetingSupervisor')}
          </h1>
          <p className="font-sans text-xs text-secondary">
            {t('supervisorOverviewSubtitle')}
          </p>
        </div>
      </section>

      {/* 2. Primary Hero Workflow Card */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary p-space-lg shadow-sm">
        <div className="relative z-10 flex flex-col space-y-space-md">
          <div className="flex items-start justify-between">
            <div className="inline-flex p-2 rounded-lg bg-on-primary/10">
              <span className="material-symbols-outlined text-[24px] text-on-primary">assignment_ind</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-on-primary/15 text-on-primary tracking-wide">
              {t('sectorCoverage')}
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl text-on-primary font-normal leading-snug">
              {t('allocateWorker')}
            </h2>
            <p className="font-sans text-xs text-on-primary/80 leading-relaxed">
              {t('allocateWorkerDesc')}
            </p>
          </div>
          <div className="pt-space-xs">
            <button
              onClick={onNavigateToAssign}
              className="w-full min-h-[48px] px-space-lg rounded bg-surface text-primary-container font-sans text-sm font-bold flex items-center justify-center gap-2 active:opacity-95 shadow-sm transition-transform active:scale-[0.99] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
              <span>{t('allocateWorker')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Operational Overview 2x2 Grid */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base text-tertiary">{t('overview')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div
            onClick={onNavigateToWorkers}
            className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('activeWorkerFleet')}</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">badge</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-tertiary font-bold tracking-tight">
                {formatNumber(workers.length)}
              </span>
              <span className="font-sans text-xs text-secondary">
                {t('unassignedCount', { count: formatNumber(unassignedWorkers.length) })}
              </span>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('totalRegisteredMothers')}</span>
              <span className="material-symbols-outlined text-[18px] text-primary-container">pregnant_woman</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-tertiary font-bold tracking-tight">
                {formatNumber(mothers.length)}
              </span>
            </div>
          </div>

          <div
            onClick={onNavigateToReports}
            className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('pendingReviews')}</span>
              <span className="material-symbols-outlined text-[18px] text-primary-container">rate_review</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-primary-container font-bold tracking-tight">
                {formatNumber(pendingReports.length)}
              </span>
            </div>
          </div>

          <div
            onClick={onNavigateToReferrals}
            className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between min-h-[88px] border border-outline-variant/40 shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-secondary font-medium">{t('emergencyReferrals')}</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">emergency</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl text-tertiary font-bold tracking-tight">
                {formatNumber(activeReferrals.length)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Referral Triage Alerts */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif text-base text-tertiary">{t('emergencyReferrals')}</h3>
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          </div>
          <button
            onClick={onNavigateToReferrals}
            className="font-sans text-xs font-semibold text-secondary hover:text-primary cursor-pointer"
          >
            {t('viewDetails')} ({formatNumber(referrals.length)})
          </button>
        </div>

        <div className="space-y-space-sm">
          {referrals.slice(0, 2).map((ref) => (
            <div
              key={ref.id}
              className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-sans text-sm font-bold text-on-surface">
                    {formatName(ref.motherName)} ({formatNumber(ref.motherId)})
                  </span>
                  <span className="font-sans text-xs text-secondary block">
                    {formatName(ref.workerName)} • {localize(ref.referredToFacility, ref.translations?.referredToFacility)}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ref.priority === 'emergency'
                      ? 'bg-error text-on-error'
                      : 'bg-primary-container text-on-primary'
                  }`}
                >
                  {ref.priority === 'emergency' ? t('alertSeverityHigh') : ref.priority === 'urgent' ? t('alertSeverityModerate') : t('alertSeverityRoutine')}
                </span>
              </div>
              <p className="font-sans text-xs text-tertiary">
                {localize(ref.reasonForReferral, ref.translations?.reasonForReferral)}
              </p>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={onNavigateToReferrals}
                  className="font-sans text-xs font-semibold text-primary-container hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{t('viewDetails')}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
