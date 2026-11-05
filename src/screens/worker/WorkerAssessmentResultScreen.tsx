import React from 'react';
import { MaternalAssessment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerAssessmentResultScreenProps {
  assessment: MaternalAssessment;
  onReferMother: (motherId: string) => void;
  onReturnToAssessments: () => void;
  onScheduleVisit: () => void;
}

export const WorkerAssessmentResultScreen: React.FC<WorkerAssessmentResultScreenProps> = ({
  assessment,
  onReferMother,
  onReturnToAssessments,
  onScheduleVisit,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-8">
      {/* 1. Back Link */}
      <section className="flex items-center justify-between pt-space-xs">
        <button
          onClick={onReturnToAssessments}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-container hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{t('back')}</span>
        </button>
        <span className="font-sans text-xs text-secondary font-medium">
          {t('statusCompleted')}
        </span>
      </section>

      {/* 2. Record Confirmed Card */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
        <div className="flex items-start gap-space-md">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0 text-primary-container">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              check_circle
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-sans text-xs uppercase tracking-wider text-secondary font-bold">
              {t('statusActive')}
            </span>
            <h1 className="font-serif text-2xl text-on-surface font-normal leading-tight">
              {t('updateSubmittedTitle')}
            </h1>
            <p className="font-sans text-xs text-secondary mt-0.5">
              {t('offlineSavedNotice')}
            </p>
          </div>
        </div>

        {/* Metadata Chips */}
        <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
          <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/30 flex flex-col">
            <span className="font-sans text-[11px] text-secondary">{t('assessmentId')}</span>
            <span className="font-sans text-xs font-bold text-on-surface truncate">
              {assessment.id}
            </span>
          </div>
          <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/30 flex flex-col">
            <span className="font-sans text-[11px] text-secondary">{t('timestamp')}</span>
            <span className="font-sans text-xs font-bold text-on-surface truncate">
              {assessment.recordedAt}
            </span>
          </div>
        </div>
      </section>

      {/* 3. AI-Assisted Maternal Risk Screening */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[24px]">psychology</span>
            <div>
              <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-bold block">
                {t('screeningResult')}
              </span>
              <h2 className="font-serif text-lg text-on-surface font-bold">
                {t('predictedRiskCategory')}
              </h2>
            </div>
          </div>
        </div>

        {/* Prediction Result Header Card */}
        {assessment.modelPrediction ? (
          <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">{t('predictedRiskCategory')}:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  assessment.modelPrediction.riskCategory === 'High'
                    ? 'bg-error-container text-error'
                    : assessment.modelPrediction.riskCategory === 'Moderate'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {assessment.modelPrediction.riskCategory === 'High'
                  ? t('highRiskCat')
                  : assessment.modelPrediction.riskCategory === 'Moderate'
                  ? t('moderateRiskCat')
                  : t('lowRiskCat')}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-[11px] text-tertiary leading-relaxed">
              <strong className="text-secondary block mb-0.5">{t('clinicalDisclaimer')}:</strong>
              {t('disclaimerText')}
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/50 flex flex-col space-y-2 text-xs text-secondary">
            <span>{t('provisionalOfflineScreening')}</span>
          </div>
        )}
      </section>

      {/* 4. Action Footer */}
      <section className="space-y-2 pt-2">
        {assessment.ruleBasedDangerIdentified && (
          <button
            onClick={() => onReferMother(assessment.motherId)}
            className="w-full h-12 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            <span>{t('referMotherNow')}</span>
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onScheduleVisit}
            className="flex-1 h-11 rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface font-sans text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            {t('todaysVisits')}
          </button>
          <button
            onClick={onReturnToAssessments}
            className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
          >
            {t('navAssessments')}
          </button>
        </div>
      </section>
    </div>
  );
};
