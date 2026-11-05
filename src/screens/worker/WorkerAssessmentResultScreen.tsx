import React, { useMemo } from 'react';
import { MaternalAssessment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { evaluateClinicalObservations, ClinicalScreeningResult } from '../../ml/clinicalScreening';
import { evaluateMaternalRiskLocally, PredictionExplanation } from '../../ml/mlEngine';

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
  const { t, language } = useLanguage();

  // Fallback / re-hydrate explanation and clinical screening if missing
  const modelExplanation: PredictionExplanation | null = useMemo(() => {
    if (assessment.modelPrediction && assessment.modelPrediction.decisionPath) {
      return assessment.modelPrediction as unknown as PredictionExplanation;
    }
    // Re-evaluate locally if legacy record
    const evalRes = evaluateMaternalRiskLocally({
      age: assessment.originalMeasurements?.age ?? 24,
      systolicBP: assessment.systolicBP,
      diastolicBP: assessment.diastolicBP,
      bloodSugar: assessment.bloodGlucose,
      bodyTemp: assessment.bodyTemp,
      heartRate: assessment.heartRate,
    });
    return evalRes.modelPrediction || null;
  }, [assessment]);

  const clinicalScreening: ClinicalScreeningResult = useMemo(() => {
    if (assessment.clinicalScreeningResult) {
      return assessment.clinicalScreeningResult;
    }
    const mlRisk = (assessment.modelPrediction?.riskCategory ||
      modelExplanation?.predictedCategory ||
      'Low') as 'Low' | 'Moderate' | 'High';

    return evaluateClinicalObservations(
      {
        gestationalWeek: assessment.gestationalWeek,
        systolicBP: assessment.systolicBP,
        diastolicBP: assessment.diastolicBP,
        heartRate: assessment.heartRate,
        bodyTemp: assessment.bodyTemp,
        hemoglobin: assessment.hemoglobin,
        fundalHeight: assessment.fundalHeight,
        fetalHeartRate: assessment.fetalHeartRate,
        fetalMovementStatus: assessment.fetalMovementStatus,
        dangerSigns: assessment.dangerSigns || [],
        symptomsNotes: assessment.symptomsNotes,
      },
      mlRisk
    );
  }, [assessment, modelExplanation]);

  const riskCategory =
    assessment.modelPrediction?.riskCategory ||
    modelExplanation?.predictedCategory ||
    'Low';

  // Helper for localized text
  const getLocalized = (obj?: { en?: string; hi?: string; or?: string } | null, fallback = '') => {
    if (!obj) return fallback;
    if (language === 'hi') return obj.hi || obj.en || fallback;
    if (language === 'or') return obj.or || obj.en || fallback;
    return obj.en || fallback;
  };

  const hasUrgentDanger = clinicalScreening.hasUrgentDangerSigns;
  const isEmergencyAction =
    hasUrgentDanger ||
    clinicalScreening.recommendedFollowUp.urgencyLevel === 'immediate_emergency' ||
    riskCategory === 'High';

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-10">
      {/* 1. Back Link & Status */}
      <section className="flex items-center justify-between pt-space-xs">
        <button
          onClick={onReturnToAssessments}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-container hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{t('backToPatientsList') || t('back')}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            {t('statusCompleted')}
          </span>
        </div>
      </section>

      {/* 2. Assessment Record Confirmed Card */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 shadow-sm flex flex-col space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container shadow-xs">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              verified
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-bold">
              {t('screeningResult')}
            </span>
            <h1 className="font-serif text-2xl text-on-surface font-normal leading-tight">
              {assessment.motherName}
            </h1>
            <p className="font-sans text-xs text-secondary mt-0.5">
              MCP ID: <strong className="text-on-surface">{assessment.motherId}</strong> •{' '}
              {t('gestationalAge')}: {assessment.gestationalWeek} {t('weeksLabel') || 'weeks'}
            </p>
          </div>
        </div>

        {/* Metadata Chips */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30 flex flex-col">
            <span className="font-sans text-[11px] text-secondary">{t('assessmentId')}</span>
            <span className="font-sans text-xs font-bold text-on-surface truncate">
              {assessment.id}
            </span>
          </div>
          <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30 flex flex-col">
            <span className="font-sans text-[11px] text-secondary">{t('timestamp')}</span>
            <span className="font-sans text-xs font-bold text-on-surface truncate">
              {assessment.recordedAt || assessment.assessedAt?.slice(0, 10)}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION A: PREDICTED RISK LEVEL (ML SCREENING) */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </div>
            <div>
              <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-bold block">
                {t('screeningResult')}
              </span>
              <h2 className="font-serif text-lg text-on-surface font-bold leading-tight">
                {t('predictedRiskCategory')}
              </h2>
            </div>
          </div>
          <span className="text-[11px] font-medium text-secondary bg-surface-container-high px-2 py-1 rounded-md">
            UCI 6-Feature Model
          </span>
        </div>

        {/* Prediction Result Badge & Leaf Samples Card */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 flex flex-col space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-secondary">
              {t('predictedRiskCategory')}:
            </span>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                riskCategory === 'High'
                  ? 'bg-error-container text-error border border-error/20'
                  : riskCategory === 'Moderate'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  riskCategory === 'High'
                    ? 'bg-error animate-pulse'
                    : riskCategory === 'Moderate'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
              ></span>
              {riskCategory === 'High'
                ? t('highRiskCat')
                : riskCategory === 'Moderate'
                ? t('moderateRiskCat')
                : t('lowRiskCat')}
            </span>
          </div>

          {/* Empirical sample context (transparent data reporting, not fabricated confidence) */}
          {modelExplanation?.leafClassDistribution && (
            <div className="pt-2 border-t border-outline-variant/30 flex flex-col space-y-1.5">
              <span className="text-[11px] font-semibold text-secondary">
                {t('leafDistribution') || 'Terminal Leaf Training Sample Distribution'}:
              </span>
              <div className="flex items-center gap-3 text-[11px] text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Low: <strong>{modelExplanation.leafClassDistribution.Low}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Moderate: <strong>{modelExplanation.leafClassDistribution.Moderate}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  High: <strong>{modelExplanation.leafClassDistribution.High}</strong>
                </span>
                <span className="text-secondary ml-auto text-[10px]">
                  (Total: {modelExplanation.terminalLeafSamples})
                </span>
              </div>
              <p className="text-[10px] text-secondary/80 leading-relaxed italic">
                {modelExplanation.distributionNote}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION B: WHY THIS PREDICTION? (GENUINE EXPLAINABLE AI) */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-[22px]">insights</span>
          </div>
          <div>
            <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-bold block">
              {t('modelExplainability') || 'Model Explainability & Feature Contribution'}
            </span>
            <h2 className="font-serif text-lg text-on-surface font-bold leading-tight">
              {t('whyThisPrediction')}
            </h2>
          </div>
        </div>

        {/* 1. Plain-Language Model Decision Summary */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60">
          <span className="text-xs font-bold text-on-surface block mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary-container">format_quote</span>
            {t('modelDecisionSummary')}
          </span>
          <p className="font-sans text-xs text-on-surface/90 leading-relaxed">
            {modelExplanation?.summaryExplanation
              ? getLocalized(modelExplanation.summaryExplanation)
              : language === 'hi'
              ? 'मॉडल ने दर्ज शारीरिक मापों के आधार पर निर्णय वृक्ष का अनुसरण करते हुए जोखिम स्तर का मूल्यांकन किया।'
              : language === 'or'
              ? 'ମଡେଲ ଲିପିବଦ୍ଧ ଶାରୀରିକ ମାପ ଆଧାରରେ ନିଷ୍ପତ୍ତି ଶାଖା ଅନୁସରଣ କରି ବିପଦ ସ୍ତର ମୂଲ୍ୟାଙ୍କନ କରିଛି।'
              : 'The model evaluated the recorded physiological measurements along the decision tree to determine the maternal risk category.'}
          </p>
        </div>

        {/* 2. Features Contributing to INCREASED Risk */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-error text-[18px]">trending_up</span>
            <h3 className="text-xs font-bold text-on-surface">
              {t('featuresIncreasedRisk')}
            </h3>
          </div>

          {modelExplanation?.featuresContributingToIncreasedRisk &&
          modelExplanation.featuresContributingToIncreasedRisk.length > 0 ? (
            <div className="space-y-2">
              {modelExplanation.featuresContributingToIncreasedRisk.map((feat, idx) => (
                <div
                  key={`inc-${idx}`}
                  className="bg-error-container/20 border border-error/30 rounded-xl p-3 flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-error flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      {feat.featureName}: {feat.inputValue} {feat.unit}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-error/15 text-error">
                      Condition: {feat.condition}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface/90 leading-relaxed">
                    {language === 'hi' && feat.descriptionHi
                      ? feat.descriptionHi
                      : language === 'or' && feat.descriptionOr
                      ? feat.descriptionOr
                      : feat.descriptionEn || feat.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 text-[11px] text-secondary italic">
              {t('noIncreasingFeatures')}
            </div>
          )}
        </div>

        {/* 3. Features Contributing to DECREASED Risk */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-700 text-[18px]">trending_down</span>
            <h3 className="text-xs font-bold text-on-surface">
              {t('featuresDecreasedRisk')}
            </h3>
          </div>

          {modelExplanation?.featuresContributingToDecreasedRisk &&
          modelExplanation.featuresContributingToDecreasedRisk.length > 0 ? (
            <div className="space-y-2">
              {modelExplanation.featuresContributingToDecreasedRisk.map((feat, idx) => (
                <div
                  key={`dec-${idx}`}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      {feat.featureName}: {feat.inputValue} {feat.unit}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Condition: {feat.condition}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-relaxed">
                    {language === 'hi' && feat.descriptionHi
                      ? feat.descriptionHi
                      : language === 'or' && feat.descriptionOr
                      ? feat.descriptionOr
                      : feat.descriptionEn || feat.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 text-[11px] text-secondary italic">
              {t('noDecreasingFeatures')}
            </div>
          )}
        </div>

        {/* 4. Complete Evaluated Model Features List */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            {t('evaluatedModelFeatures')}
          </span>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 divide-y divide-outline-variant/30 overflow-hidden">
            {modelExplanation?.evaluatedModelFeatures?.map((f, i) => (
              <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-semibold text-on-surface">
                    {language === 'hi'
                      ? f.featureNameHi
                      : language === 'or'
                      ? f.featureNameOr
                      : f.featureName}
                  </span>
                  <span className="text-[10px] text-secondary">
                    Ref: {f.normalReference}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-on-surface">
                    {f.recordedValue} {f.unit}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      f.impactOnPrediction === 'increases_risk'
                        ? 'bg-error-container text-error'
                        : f.impactOnPrediction === 'lowers_risk'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-surface-container-high text-secondary'
                    }`}
                  >
                    {f.impactOnPrediction === 'increases_risk'
                      ? 'Elevated Risk'
                      : f.impactOnPrediction === 'lowers_risk'
                      ? 'Protective'
                      : 'Baseline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION C: INDEPENDENT CLINICAL DANGER-SIGN SCREENING */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-[22px]">medical_services</span>
          </div>
          <div>
            <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-bold block">
              {t('independentClinicalSubtitle')}
            </span>
            <h2 className="font-serif text-lg text-on-surface font-bold leading-tight">
              {t('independentClinicalScreening')}
            </h2>
          </div>
        </div>

        {/* 1. URGENT CLINICAL DANGER SIGNS (RED) */}
        {clinicalScreening.urgentFindings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-error text-[18px]">emergency</span>
              <h3 className="text-xs font-bold text-error">
                {t('urgentDangerSigns')} ({clinicalScreening.urgentFindings.length})
              </h3>
            </div>
            <div className="space-y-2">
              {clinicalScreening.urgentFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-error-container/30 border border-error/50 rounded-xl p-3 flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-error flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      {language === 'hi'
                        ? finding.findingTitleHi
                        : language === 'or'
                        ? finding.findingTitleOr
                        : finding.findingTitleEn}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-error text-on-error">
                      {finding.recordedValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface leading-relaxed font-medium">
                    {language === 'hi'
                      ? finding.descriptionHi
                      : language === 'or'
                      ? finding.descriptionOr
                      : finding.descriptionEn}
                  </p>
                  <span className="text-[10px] text-secondary italic">
                    Protocol: {finding.clinicalGuidelineRef}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CONCERNING OBSERVATIONS (AMBER) */}
        {clinicalScreening.concerningFindings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-700 text-[18px]">report</span>
              <h3 className="text-xs font-bold text-amber-900">
                {t('concerningObservations')} ({clinicalScreening.concerningFindings.length})
              </h3>
            </div>
            <div className="space-y-2">
              {clinicalScreening.concerningFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">schedule</span>
                      {language === 'hi'
                        ? finding.findingTitleHi
                        : language === 'or'
                        ? finding.findingTitleOr
                        : finding.findingTitleEn}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                      {finding.recordedValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-950 leading-relaxed">
                    {language === 'hi'
                      ? finding.descriptionHi
                      : language === 'or'
                      ? finding.descriptionOr
                      : finding.descriptionEn}
                  </p>
                  <span className="text-[10px] text-secondary italic">
                    Protocol: {finding.clinicalGuidelineRef}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. NORMAL OBSERVATIONS (EMERALD) */}
        {clinicalScreening.normalFindings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">check_circle</span>
              <h3 className="text-xs font-bold text-emerald-900">
                {t('normalObservations')} ({clinicalScreening.normalFindings.length})
              </h3>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/20 overflow-hidden">
              {clinicalScreening.normalFindings.map((finding) => (
                <div key={finding.id} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex flex-col pr-2">
                    <span className="font-semibold text-on-surface">
                      {language === 'hi'
                        ? finding.findingTitleHi
                        : language === 'or'
                        ? finding.findingTitleOr
                        : finding.findingTitleEn}
                    </span>
                    <span className="text-[10px] text-secondary">
                      {language === 'hi'
                        ? finding.descriptionHi
                        : language === 'or'
                        ? finding.descriptionOr
                        : finding.descriptionEn}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                    {finding.recordedValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {clinicalScreening.urgentFindings.length === 0 &&
          clinicalScreening.concerningFindings.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
              <span className="material-symbols-outlined text-[18px] text-emerald-700">task_alt</span>
              <span>{t('noUrgentDangerSigns')}</span>
            </div>
          )}
      </section>

      {/* SECTION D: RECOMMENDED FOLLOW-UP PROTOCOL */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 shadow-sm flex flex-col space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
          </div>
          <div>
            <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-bold block">
              National Health Mission Protocol
            </span>
            <h2 className="font-serif text-lg text-on-surface font-bold leading-tight">
              {t('recommendedFollowUp')}
            </h2>
          </div>
        </div>

        {/* CRITICAL SAFETY OVERRIDE ALERT (When Low ML is overridden by urgent clinical sign) */}
        {clinicalScreening.recommendedFollowUp.overrideApplied && (
          <div className="bg-error text-on-error p-3.5 rounded-xl border border-error shadow-sm flex items-start gap-2.5 animate-pulse">
            <span className="material-symbols-outlined text-[24px] shrink-0">emergency</span>
            <div className="flex flex-col text-xs leading-relaxed">
              <strong className="text-sm font-bold block mb-0.5">
                {t('safetyOverrideAlertTitle')}
              </strong>
              <span>
                {language === 'hi'
                  ? clinicalScreening.recommendedFollowUp.protocolNoteHi
                  : language === 'or'
                  ? clinicalScreening.recommendedFollowUp.protocolNoteOr
                  : clinicalScreening.recommendedFollowUp.protocolNoteEn}
              </span>
            </div>
          </div>
        )}

        {/* Action Recommendation Card */}
        <div
          className={`p-4 rounded-xl border flex flex-col space-y-2 ${
            clinicalScreening.recommendedFollowUp.urgencyLevel === 'immediate_emergency'
              ? 'bg-error-container/40 border-error/50'
              : clinicalScreening.recommendedFollowUp.urgencyLevel === 'consult_24_48h'
              ? 'bg-amber-50 border-amber-300'
              : clinicalScreening.recommendedFollowUp.urgencyLevel === 'followup_7d'
              ? 'bg-surface-container-lowest border-outline-variant/60'
              : 'bg-emerald-50 border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                clinicalScreening.recommendedFollowUp.urgencyLevel === 'immediate_emergency'
                  ? 'bg-error'
                  : clinicalScreening.recommendedFollowUp.urgencyLevel === 'consult_24_48h'
                  ? 'bg-amber-600'
                  : clinicalScreening.recommendedFollowUp.urgencyLevel === 'followup_7d'
                  ? 'bg-primary-container'
                  : 'bg-emerald-600'
              }`}
            ></span>
            <h3 className="text-sm font-bold text-on-surface">
              {language === 'hi'
                ? clinicalScreening.recommendedFollowUp.actionTitleHi
                : language === 'or'
                ? clinicalScreening.recommendedFollowUp.actionTitleOr
                : clinicalScreening.recommendedFollowUp.actionTitleEn}
            </h3>
          </div>

          <p className="text-xs text-on-surface/90 leading-relaxed">
            {language === 'hi'
              ? clinicalScreening.recommendedFollowUp.protocolNoteHi
              : language === 'or'
              ? clinicalScreening.recommendedFollowUp.protocolNoteOr
              : clinicalScreening.recommendedFollowUp.protocolNoteEn}
          </p>

          <div className="pt-2 border-t border-outline-variant/30 text-[10px] text-secondary italic">
            {t('clinicalPrecedenceRule')}
          </div>
        </div>
      </section>

      {/* SECTION E: CLINICAL SAFETY DISCLAIMER */}
      <section className="bg-surface-container/60 rounded-xl p-4 border border-outline-variant/40 flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
          health_and_safety
        </span>
        <div className="flex flex-col space-y-0.5">
          <strong className="text-xs font-bold text-secondary">
            {t('clinicalSafetyDisclaimer')}:
          </strong>
          <p className="text-[11px] text-tertiary leading-relaxed">
            {t('assistiveDeviceNotice')}
          </p>
        </div>
      </section>

      {/* SECTION F: ACTION FOOTER */}
      <section className="space-y-2.5 pt-2">
        {isEmergencyAction ? (
          <button
            onClick={() => onReferMother(assessment.motherId)}
            className="w-full h-12 rounded-xl bg-error text-on-error font-sans text-xs font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[20px]">emergency</span>
            <span>{t('referMotherNow')}</span>
          </button>
        ) : (
          <button
            onClick={() => onReferMother(assessment.motherId)}
            className="w-full h-11 rounded-xl bg-surface-container-highest border border-outline-variant text-on-surface font-sans text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">forward</span>
            <span>{t('referMotherNow')} (Routine Transfer)</span>
          </button>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onScheduleVisit}
            className="flex-1 h-11 rounded-xl bg-surface-container-highest border border-outline-variant text-on-surface font-sans text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            {t('todaysVisits')}
          </button>
          <button
            onClick={onReturnToAssessments}
            className="flex-1 h-11 rounded-xl bg-primary-container text-on-primary font-sans text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
          >
            {t('viewAllAssessments') || t('navAssessments')}
          </button>
        </div>
      </section>
    </div>
  );
};
