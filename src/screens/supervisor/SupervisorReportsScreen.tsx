import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

export const SupervisorReportsScreen: React.FC = () => {
  const { assessments, reviewAssessment } = useData();
  const { t, formatName, formatNumber, localize } = useLanguage();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleSignOff = async (id: string) => {
    await reviewAssessment(id, 'signed_off', 'Observations reviewed and clinically approved by Dr. Rajesh Kumar.');
  };

  const handleRequestClarification = async (id: string) => {
    if (!reviewNotes.trim()) return;
    await reviewAssessment(id, 'clarification_requested', reviewNotes.trim());
    setSelectedAssessmentId(null);
    setReviewNotes('');
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('navReports')}
        </h1>
        <p className="font-sans text-xs text-secondary mt-0.5">
          {t('pendingReviews')}
        </p>
      </section>

      {/* 2. Assessment Reports List */}
      <section className="space-y-space-sm">
        {assessments.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-space-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-bold text-on-surface">
                    {formatName(item.motherName)} ({formatNumber(item.motherId)})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.supervisorReviewStatus === 'signed_off'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : item.supervisorReviewStatus === 'clarification_requested'
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    {item.supervisorReviewStatus === 'signed_off'
                      ? t('statusReviewed')
                      : item.supervisorReviewStatus === 'clarification_requested'
                      ? t('addClarification')
                      : t('statusPending')}
                  </span>
                </div>
                <span className="font-sans text-xs text-secondary block mt-0.5">
                  {formatNumber(`Ref: ${item.id}`)}
                </span>
              </div>
              <span className="font-sans text-xs text-secondary">
                {formatNumber(item.recordedAt)}
              </span>
            </div>

            {/* Vitals summary bar */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className="bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/20">
                <span className="text-[10px] text-secondary block">{t('vitalsGestation')}</span>
                <strong className="text-on-surface">{t('weekLabel', { num: item.gestationalWeek })}</strong>
              </div>
              <div className="bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/20">
                <span className="text-[10px] text-secondary block">{t('vitalsBP')}</span>
                <strong className={item.systolicBP >= 140 ? 'text-primary font-bold' : 'text-on-surface'}>
                  {formatNumber(item.systolicBP)}/{formatNumber(item.diastolicBP)}
                </strong>
              </div>
              <div className="bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/20">
                <span className="text-[10px] text-secondary block">{t('vitalsHR')}</span>
                <strong className="text-on-surface">{formatNumber(item.heartRate)} bpm</strong>
              </div>
              <div className="bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/20">
                <span className="text-[10px] text-secondary block">{t('vitalsGlucose')}</span>
                <strong className="text-on-surface">{formatNumber(item.bloodGlucose)} mg</strong>
              </div>
            </div>

            {/* Clinical observations & danger alerts */}
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-xs text-secondary">
              <p>
                <strong className="text-on-surface">{t('fieldObservationLabel')}:</strong> {localize(item.symptomsNotes, item.translations?.symptomsNotes)}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-outline-variant/30">
              <button
                onClick={() => {
                  setSelectedAssessmentId(selectedAssessmentId === item.id ? null : item.id);
                  setReviewNotes(item.supervisorNotes || '');
                }}
                className="text-xs font-semibold text-primary-container hover:underline cursor-pointer"
              >
                {selectedAssessmentId === item.id ? t('close') : t('addClarification')}
              </button>

              <div className="flex items-center gap-2">
                {item.supervisorReviewStatus !== 'signed_off' && (
                  <button
                    onClick={() => handleSignOff(item.id)}
                    className="px-3 py-1 rounded-lg bg-primary-container text-on-primary text-[11px] font-semibold shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    {t('clinicalSignOff')}
                  </button>
                )}
              </div>
            </div>

            {/* Clarification Drawer */}
            {selectedAssessmentId === item.id && (
              <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={t('clarificationPlaceholder')}
                  className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => handleRequestClarification(item.id)}
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
