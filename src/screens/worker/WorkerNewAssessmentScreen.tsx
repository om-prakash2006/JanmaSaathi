import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MaternalAssessment } from '../../types';
import { evaluateMaternalRiskLocally } from '../../ml/mlEngine';
import { evaluateClinicalObservations } from '../../ml/clinicalScreening';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerNewAssessmentScreenProps {
  initialMotherId?: string;
  onAssessmentCompleted: (assessment: MaternalAssessment) => void;
  onCancel: () => void;
}

export const WorkerNewAssessmentScreen: React.FC<WorkerNewAssessmentScreenProps> = ({
  initialMotherId,
  onAssessmentCompleted,
  onCancel,
}) => {
  const { mothers, workers, addAssessment } = useData();
  const { t } = useLanguage();
  const worker = workers[0]; // Sunita Devi

  const [selectedMotherId, setSelectedMotherId] = useState(
    initialMotherId || mothers[0]?.id || 'MCP-2025-0894'
  );
  const selectedMother = mothers.find((m) => m.id === selectedMotherId) || mothers[0];

  // Form State across 7 clinical sections
  const [gestationalWeek, setGestationalWeek] = useState(selectedMother.gestationalAgeWeeks || 24);
  const [fundalHeight, setFundalHeight] = useState(24);
  const [systolicBP, setSystolicBP] = useState(118);
  const [diastolicBP, setDiastolicBP] = useState(76);
  const [heartRate, setHeartRate] = useState(78);
  const [bodyTemp, setBodyTemp] = useState(98.4);
  const [bodyWeight, setBodyWeight] = useState<string>('');
  const [bloodGlucose, setBloodGlucose] = useState(94);
  const [hemoglobin, setHemoglobin] = useState(11.6);
  const [fetalHeartRate, setFetalHeartRate] = useState(142);
  const [fetalMovementStatus, setFetalMovementStatus] = useState<'normal' | 'reduced' | 'absent'>('normal');
  const [selectedDangerSigns, setSelectedDangerSigns] = useState<string[]>([]);
  const [symptomsNotes, setSymptomsNotes] = useState('Routine 2nd trimester assessment. No acute distress.');
  const [nutritionalAdvice, setNutritionalAdvice] = useState(
    'Daily IFA tablet with citrus, calcium tablet after midday meal, adequate hydration and left lateral rest.'
  );

  const dangerSignOptions = [
    { key: 'dangerHeadache', label: t('dangerHeadache') },
    { key: 'dangerVisual', label: t('dangerVisual') },
    { key: 'dangerBleeding', label: t('dangerBleeding') },
    { key: 'dangerFever', label: t('dangerFever') },
    { key: 'dangerFetalMovement', label: t('dangerFetalMovement') },
    { key: 'dangerAbdominalPain', label: t('dangerAbdominalPain') },
    { key: 'dangerSwelling', label: t('dangerSwelling') },
    { key: 'dangerConvulsions', label: t('dangerConvulsions') },
  ];

  const toggleDangerSign = (signKey: string) => {
    if (selectedDangerSigns.includes(signKey)) {
      setSelectedDangerSigns(selectedDangerSigns.filter((s) => s !== signKey));
    } else {
      setSelectedDangerSigns([...selectedDangerSigns, signKey]);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    if (bodyWeight !== '' && (Number(bodyWeight) < 30 || Number(bodyWeight) > 200 || isNaN(Number(bodyWeight)))) {
      setSubmissionError('Body weight must be a valid numerical value between 30 and 200 kg.');
      setIsSubmitting(false);
      return;
    }

    const ruleAlerts: string[] = [];
    if (Number(systolicBP) >= 140 || Number(diastolicBP) >= 90) {
      ruleAlerts.push(`Elevated Blood Pressure (${systolicBP}/${diastolicBP} mmHg) - Hypertension protocol flagged`);
    }
    if (fetalMovementStatus !== 'normal') {
      ruleAlerts.push(`Fetal movement altered: ${fetalMovementStatus}`);
    }
    selectedDangerSigns.forEach((sign) => {
      ruleAlerts.push(`Danger sign: ${sign}`);
    });

    let mlResultPayload: any = {
      status: 'model_unavailable',
      message: 'ML Prediction service unavailable.',
    };

    let originalMeasurementsData: any = {
      age: selectedMother.age || 24,
      systolicBP: Number(systolicBP),
      diastolicBP: Number(diastolicBP),
      bloodSugar: Number(bloodGlucose),
      bloodSugarUnit: 'mmol/L',
      bodyTemp: Number(bodyTemp),
      bodyTempUnit: '°F',
      heartRate: Number(heartRate),
    };

    let normalizedInputsData: any = {
      age: selectedMother.age || 24,
      systolicBP: Number(systolicBP),
      diastolicBP: Number(diastolicBP),
      bloodSugarMmolL: Number(bloodGlucose),
      bodyTempFahrenheit: Number(bodyTemp),
      heartRateBpm: Number(heartRate),
    };

    let modelPredictionData: any = null;
    let featureExplanationsData: any = [];

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: selectedMother.age || 24,
          systolicBP: Number(systolicBP),
          diastolicBP: Number(diastolicBP),
          bloodSugar: Number(bloodGlucose),
          bloodSugarUnit: 'mmol/L',
          bodyTemp: Number(bodyTemp),
          bodyTempUnit: '°F',
          heartRate: Number(heartRate),
          supplementaryObservations: {
            haemoglobinGdl: Number(hemoglobin),
            bleeding: selectedDangerSigns.some((s) => s.toLowerCase().includes('bleeding')),
            swelling: selectedDangerSigns.some((s) => s.toLowerCase().includes('swelling')) ? 'Severe' : 'None',
            reducedFetalMovement: fetalMovementStatus !== 'normal',
            clinicalNotes: symptomsNotes,
          },
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.modelPrediction) {
        modelPredictionData = resData.modelPrediction;
        featureExplanationsData = resData.modelPrediction.contributingFeatures || [];
        originalMeasurementsData = resData.originalMeasurements;
        normalizedInputsData = resData.normalizedModelInputs;

        mlResultPayload = {
          status: 'success',
          riskCategory: resData.modelPrediction.riskCategory,
          confidenceScore: resData.modelPrediction.confidenceScore,
          explanation: resData.modelPrediction,
        };
      } else if (resData.validationErrors) {
        setSubmissionError(`Validation Failed: ${resData.validationErrors.join(' ')}`);
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      console.warn('Prediction API call notice (falling back to deterministic local offline inference):', err);
    }

    // Local deterministic offline ML inference fallback if API unavailable
    if (!modelPredictionData) {
      const localEval = evaluateMaternalRiskLocally({
        age: selectedMother.age || 24,
        systolicBP: Number(systolicBP),
        diastolicBP: Number(diastolicBP),
        bloodSugar: Number(bloodGlucose),
        bloodSugarUnit: 'mmol/L',
        bodyTemp: Number(bodyTemp),
        bodyTempUnit: '°F',
        heartRate: Number(heartRate),
      });

      if (localEval.success && localEval.modelPrediction) {
        modelPredictionData = {
          ...localEval.modelPrediction,
          riskCategory: localEval.modelPrediction.predictedCategory,
        };
        featureExplanationsData = localEval.modelPrediction.contributingFeatures || [];
        mlResultPayload = {
          status: 'success',
          riskCategory: localEval.modelPrediction.predictedCategory,
          explanation: localEval.modelPrediction,
        };
      } else if (localEval.validationErrors) {
        setSubmissionError(`Validation Failed: ${localEval.validationErrors.join(' ')}`);
        setIsSubmitting(false);
        return;
      }
    }

    // Independent clinical danger-sign screening execution
    const clinicalScreening = evaluateClinicalObservations(
      {
        gestationalWeek: Number(gestationalWeek),
        systolicBP: Number(systolicBP),
        diastolicBP: Number(diastolicBP),
        heartRate: Number(heartRate),
        bodyTemp: Number(bodyTemp),
        hemoglobin: Number(hemoglobin),
        fundalHeight: Number(fundalHeight),
        fetalHeartRate: Number(fetalHeartRate),
        fetalMovementStatus,
        dangerSigns: selectedDangerSigns,
        symptomsNotes,
      },
      (modelPredictionData?.riskCategory || 'Low') as 'Low' | 'Moderate' | 'High'
    );

    try {
      const newAssessment = await addAssessment({
        motherId: selectedMother.id,
        motherName: selectedMother.name,
        workerId: worker.id,
        workerName: worker.name,
        gestationalWeek: Number(gestationalWeek),
        systolicBP: Number(systolicBP),
        diastolicBP: Number(diastolicBP),
        heartRate: Number(heartRate),
        bloodGlucose: Number(bloodGlucose),
        bodyTemp: Number(bodyTemp),
        hemoglobin: Number(hemoglobin),
        fundalHeight: Number(fundalHeight),
        fetalHeartRate: Number(fetalHeartRate),
        fetalMovementStatus,
        dangerSigns: selectedDangerSigns,
        symptomsNotes,
        nutritionalAdvice,
        originalMeasurements: originalMeasurementsData,
        normalizedModelInputs: normalizedInputsData,
        modelPrediction: modelPredictionData,
        featureExplanations: featureExplanationsData,
        clinicalScreeningResult: clinicalScreening,
        supplementaryDangerObservations: {
          haemoglobinGdl: Number(hemoglobin),
          bleeding: selectedDangerSigns.some((s) => s.toLowerCase().includes('bleeding')),
          swelling: selectedDangerSigns.some((s) => s.toLowerCase().includes('swelling')) ? 'Severe' : 'None',
          reducedFetalMovement: fetalMovementStatus !== 'normal',
          clinicalNotes: symptomsNotes,
        },
        modelVersion: modelPredictionData?.modelVersion || '1.0.1-audited',
        preprocessingVersion: modelPredictionData?.preprocessingVersion || '1.0.1',
        explanationMethod: 'Decision Path Tree Attribution (TreeSHAP / Saabas)',
        assessedAt: new Date().toISOString(),
        mlScreeningResult: mlResultPayload,
        ruleBasedDangerIdentified: clinicalScreening.hasUrgentDangerSigns || ruleAlerts.length > 0,
        ruleBasedAlertDetails: [
          ...clinicalScreening.urgentFindings.map((u) => u.findingTitleEn),
          ...clinicalScreening.concerningFindings.map((c) => c.findingTitleEn),
          ...ruleAlerts,
        ],
        supervisorReviewStatus: 'pending',
      });

      onAssessmentCompleted(newAssessment);
    } catch (dbErr: any) {
      setSubmissionError(dbErr.message || 'Failed to save assessment to Firestore database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-8">
      {/* 1. Header & Navigation */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-container hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{t('back')}</span>
          </button>
          <span className="text-[11px] font-sans text-secondary font-medium">
            {t('officialClinicalRecord')}
          </span>
        </div>
        <h1 className="font-serif text-2xl text-on-surface font-normal tracking-tight mt-2">
          {t('recordAssessment')}
        </h1>
        <p className="font-sans text-xs text-secondary">
          {t('clinicalProtocolSubtitle')}
        </p>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-space-lg">
        {/* Section 1: Patient Selection & Visit Context */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="font-serif text-base text-on-surface font-bold">
              {t('selectMotherForAssessment')}
            </h2>
          </div>

          <div>
            <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
              {t('selectMotherForAssessment')} *
            </label>
            <select
              value={selectedMotherId}
              onChange={(e) => {
                setSelectedMotherId(e.target.value);
                const m = mothers.find((mom) => mom.id === e.target.value);
                if (m) setGestationalWeek(m.gestationalAgeWeeks);
              }}
              className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
            >
              {mothers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id}) — Wk {m.gestationalAgeWeeks}, {m.village}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-secondary bg-surface-container-low p-2.5 rounded-lg">
            <span>Age: <strong className="text-on-surface">{selectedMother.age} yrs</strong></span>
            <span>EDD: <strong className="text-on-surface">{selectedMother.edd}</strong></span>
            <span>Hamlet: <strong className="text-on-surface">{selectedMother.hamlet}</strong></span>
            <span>Worker: <strong className="text-on-surface">{worker.name}</strong></span>
          </div>
        </div>

        {/* Section 2: Gestational Age & Anthropometry */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="font-serif text-base text-on-surface font-bold">
              {t('estimatedGestation')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('gestationalWeek')} *
              </label>
              <input
                type="number"
                required
                min={4}
                max={42}
                value={gestationalWeek}
                onChange={(e) => setGestationalWeek(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('fundalHeight')}
              </label>
              <input
                type="number"
                value={fundalHeight}
                onChange={(e) => setFundalHeight(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Vital Signs */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="font-serif text-base text-on-surface font-bold">
              {t('vitalSigns')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('systolicBP')} *
              </label>
              <input
                type="number"
                required
                min={70}
                max={220}
                value={systolicBP}
                onChange={(e) => setSystolicBP(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('diastolicBP')} *
              </label>
              <input
                type="number"
                required
                min={40}
                max={140}
                value={diastolicBP}
                onChange={(e) => setDiastolicBP(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('pulseHeartRate')}
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('bodyTemp')}
              </label>
              <input
                type="number"
                step="0.1"
                value={bodyTemp}
                onChange={(e) => setBodyTemp(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                Body Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min={30}
                max={200}
                placeholder="Enter body weight"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Laboratory Parameters */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="font-serif text-base text-on-surface font-bold">
              {t('labTestsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('bloodGlucose')}
              </label>
              <input
                type="number"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('hbLevel')}
              </label>
              <input
                type="number"
                step="0.1"
                value={hemoglobin}
                onChange={(e) => setHemoglobin(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Fetal Well-being */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h2 className="font-serif text-base text-on-surface font-bold">
              {t('fetalWellbeingTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('fetalHeartRate')}
              </label>
              <input
                type="number"
                value={fetalHeartRate}
                onChange={(e) => setFetalHeartRate(Number(e.target.value))}
                placeholder="e.g. 140"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                {t('fetalMovement')} *
              </label>
              <select
                value={fetalMovementStatus}
                onChange={(e) => setFetalMovementStatus(e.target.value as any)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
              >
                <option value="normal">{t('fetalNormal')}</option>
                <option value="reduced">{t('fetalReduced')}</option>
                <option value="absent">{t('fetalAbsent')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 6: Standard Danger Signs Screening */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
                6
              </span>
              <h2 className="font-serif text-base text-on-surface font-bold">
                {t('dangerSignsCheck')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {dangerSignOptions.map((sign) => {
              const isChecked = selectedDangerSigns.includes(sign.key);
              return (
                <label
                  key={sign.key}
                  onClick={() => toggleDangerSign(sign.key)}
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-primary-container/10 border-primary-container text-primary-container font-semibold'
                      : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border text-[12px] ${
                      isChecked
                        ? 'bg-primary-container border-primary-container text-on-primary'
                        : 'border-outline-variant'
                    }`}
                  >
                    {isChecked && '✓'}
                  </span>
                  <span>{sign.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 7: Observations, Nutrition & Action Plan */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
              7
            </span>
            <h2 className="font-serif text-base text-on-surface font-bold">
              {t('clinicalNotes')}
            </h2>
          </div>

          <div>
            <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
              {t('clinicalNotes')} *
            </label>
            <textarea
              rows={2}
              required
              value={symptomsNotes}
              onChange={(e) => setSymptomsNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
            />
          </div>

          <div>
            <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
              {t('nutritionalGuidance')}
            </label>
            <textarea
              rows={2}
              value={nutritionalAdvice}
              onChange={(e) => setNutritionalAdvice(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
            />
          </div>
        </div>

        {submissionError && (
          <div className="p-3 rounded-lg bg-error-container/80 border border-error/30 text-xs text-error font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
            <span>{submissionError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex-1 h-12 rounded-lg border border-outline-variant text-on-surface font-sans text-xs font-semibold hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>{t('evaluatingVitals')}</span>
              </>
            ) : (
              <>
                <span>{t('submit')}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
