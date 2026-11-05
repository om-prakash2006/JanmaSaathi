import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

export const MotherJourneyScreen: React.FC = () => {
  const { mothers, healthUpdates } = useData();
  const { t } = useLanguage();
  const mother = mothers[0]; // Priya
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    provider: string;
    date: string;
    summary: string;
    vitals: string[];
  } | null>(null);

  const timelineEvents = [
    {
      id: 'EVT-01',
      date: '12 November 2026',
      title: 'ANC 3 Checkup & Vitals',
      subtitle: 'Sub-Centre Rampur Health Post',
      provider: 'Sunita Devi (Health Worker)',
      status: t('statusScheduled'),
      statusType: 'upcoming',
      details: 'Routine third antenatal visit: blood pressure measurement, fundal height estimation, fetal heart auscultation, and iron-folic acid restock.',
    },
    ...healthUpdates.filter((u) => u.motherId === mother.id).map((u) => ({
      id: u.healthUpdateId,
      date: u.submittedAt.split('·')[0].trim(),
      title: u.reviewStatus === 'reviewed' ? 'Maternal Health Update Reviewed' : 'Self-Reported Well-Being Check-in',
      subtitle: u.observations,
      provider: u.reviewedBy || 'Self-submitted (Pending Review)',
      status: u.reviewStatus === 'reviewed' ? t('statusReviewed') : t('statusPending'),
      statusType: u.reviewStatus === 'reviewed' ? 'completed' : 'pending',
      details: u.reviewNotes || u.notes,
    })),
    {
      id: 'EVT-04',
      date: '17 September 2026',
      title: 'Second Antenatal Checkup (ANC 2) & Ultrasound',
      subtitle: 'Rampur Primary Health Centre',
      provider: 'Dr. Sharma / Sunita Devi',
      status: t('statusCompleted'),
      statusType: 'completed',
      details: 'Blood pressure normal (116/74 mmHg), fetal heartbeat verified (140 bpm), ultrasound confirmed single intrauterine pregnancy with adequate amniotic fluid.',
    },
    {
      id: 'EVT-05',
      date: '16 July 2026',
      title: 'First Antenatal Checkup (ANC 1) & Blood Tests',
      subtitle: 'Sub-Centre Rampur Health Post',
      provider: 'Sunita Devi (Health Worker)',
      status: t('statusCompleted'),
      statusType: 'completed',
      details: 'Routine baseline screening, haemoglobin check (11.8 g/dL), blood typing (B positive), Tetanus Toxoid Dose 1 administered.',
    },
    {
      id: 'EVT-06',
      date: '15 June 2026',
      title: 'Pregnancy Registered & MCP Card Issued',
      subtitle: 'Village Rampur Sub-Centre',
      provider: 'Sunita Devi (Health Worker)',
      status: t('statusCompleted'),
      statusType: 'completed',
      details: 'Initial pregnancy registration with Village Rampur Sub-Centre. Mother and Child Protection (MCP) card issued with ID MCP-2026-0894.',
    },
  ];

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header Greeting */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('navJourney')}
        </h1>
        <p className="font-sans text-sm text-secondary mt-1">
          {t('motherJourneySubtitle')}
        </p>
      </section>

      {/* 2. Gestation Hero Card */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-sans text-xs uppercase tracking-wider text-secondary">
              {t('currentGestation')}
            </span>
            <div className="flex items-baseline gap-space-xs mt-0.5">
              <span className="font-serif text-xl font-bold text-primary">
                Week {mother.gestationalAgeWeeks}
              </span>
              <span className="font-sans text-xs text-tertiary">
                (Day {mother.gestationalAgeDays} of 280)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary-container">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              favorite
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full rounded-full transition-all duration-500"
              style={{ width: `${(mother.gestationalAgeDays / 280) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-secondary font-sans text-xs">
            <span>Week 1</span>
            <span className="font-bold text-primary">Week {mother.gestationalAgeWeeks}</span>
            <span>Week 40</span>
          </div>
        </div>

        {/* 2 Metadata Chips */}
        <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
          <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/30 flex flex-col">
            <span className="font-sans text-[11px] text-secondary">{t('eddLabel')}</span>
            <span className="font-sans text-xs font-bold text-on-surface mt-0.5">{mother.edd}</span>
          </div>
          <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/30 flex flex-col">
            <span className="font-sans text-[11px] text-secondary">{t('yourHealthWorker')}</span>
            <span className="font-sans text-xs font-bold text-on-surface mt-0.5">{mother.assignedWorkerName}</span>
          </div>
        </div>
      </section>

      {/* 3. Maternal Milestones Timeline */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div>
            <h2 className="font-serif text-lg font-bold text-primary">{t('milestonesTitle')}</h2>
            <p className="font-sans text-xs text-secondary">{t('milestonesSubtitle')}</p>
          </div>
        </div>

        <div className="relative pl-6 space-y-space-md before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/60">
          {timelineEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline marker node */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] ${
                  evt.statusType === 'upcoming'
                    ? 'bg-primary-container ring-4 ring-secondary-container'
                    : evt.statusType === 'completed'
                    ? 'bg-secondary'
                    : 'bg-outline-variant text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {evt.statusType === 'upcoming' ? 'event' : evt.statusType === 'completed' ? 'check' : 'edit_note'}
                </span>
              </div>

              {/* Event Card */}
              <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      evt.statusType === 'upcoming'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : evt.statusType === 'completed'
                        ? 'bg-surface-variant text-on-surface-variant'
                        : 'bg-surface-container-high text-secondary'
                    }`}
                  >
                    {evt.status}
                  </span>
                  <span className="font-sans text-xs text-secondary">{evt.date}</span>
                </div>

                <h3 className="font-sans text-sm font-bold text-on-surface">
                  {evt.title}
                </h3>
                <p className="font-sans text-xs text-tertiary">
                  {evt.subtitle}
                </p>

                {evt.details && (
                  <p className="font-sans text-[11px] text-secondary mt-1 bg-surface-container-lowest p-2 rounded border border-outline-variant/30">
                    {evt.details}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-[11px] text-secondary">
                  <span>{evt.provider}</span>
                  <button
                    onClick={() => setSelectedRecord(selectedRecord === evt.id ? null : evt.id)}
                    className="text-primary-container font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{selectedRecord === evt.id ? t('close') : t('viewDetails')}</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recorded Health Assessments Clinical Documents */}
      <section className="flex flex-col space-y-space-sm pt-2">
        <h2 className="font-serif text-lg font-bold text-primary">{t('recordedAssessments')}</h2>
        <p className="font-sans text-xs text-secondary -mt-1">{t('recordedAssessmentsSubtitle')}</p>

        <div className="space-y-space-sm">
          <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container border border-outline-variant/40">
                <span className="material-symbols-outlined text-[22px]">description</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-xs font-bold text-on-surface">ANC 2 Assessment Record</span>
                <span className="font-sans text-[11px] text-secondary">17 Sep 2026 · Dr. Sharma</span>
              </div>
            </div>
            <button
              onClick={() =>
                setPreviewDoc({
                  title: 'ANC 2 Assessment Record',
                  provider: 'Dr. Sharma · Rampur PHC',
                  date: '17 September 2026',
                  summary: 'Routine second trimester checkup. Fetal development is concordant with gestational age. No signs of hypertension, pre-eclampsia, or gestational diabetes.',
                  vitals: [
                    'Blood Pressure: 116/74 mmHg (Normal)',
                    'Fetal Heart Rate: 140 bpm (Healthy)',
                    'Fundal Height: 20 cm (Consistent)',
                    'Maternal Weight: 54.5 kg (+2.5 kg from baseline)',
                    'IFA Supplementation: 60 tablets dispensed, fully compliant',
                  ],
                })
              }
              className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
            >
              {t('openRecord')}
            </button>
          </div>

          <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container border border-outline-variant/40">
                <span className="material-symbols-outlined text-[22px]">lab_profile</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-xs font-bold text-on-surface">Baseline Laboratory Report</span>
                <span className="font-sans text-[11px] text-secondary">16 Jul 2026 · Rampur PHC</span>
              </div>
            </div>
            <button
              onClick={() =>
                setPreviewDoc({
                  title: 'Baseline Laboratory Report',
                  provider: 'Rampur Primary Health Centre Lab',
                  date: '16 July 2026',
                  summary: 'Comprehensive first-trimester baseline blood and urine investigations. Haemoglobin recorded within satisfactory clinical range.',
                  vitals: [
                    'Haemoglobin (Hb): 11.8 g/dL (Normal adult pregnancy baseline)',
                    'Blood Group & Rh: B Positive (Rh +ve)',
                    'Random Blood Sugar: 5.4 mmol/L (97.3 mg/dL - Normal)',
                    'Urine Albumin: Nil (Negative)',
                    'Urine Sugar: Nil (Negative)',
                    'HIV / VDRL / HBsAg: Non-reactive (Screened negative)',
                  ],
                })
              }
              className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
            >
              {t('openRecord')}
            </button>
          </div>
        </div>
      </section>

      {/* Clinical Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl max-h-[90vh] overflow-y-auto p-space-lg border border-outline-variant shadow-2xl flex flex-col space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-outline-variant/40">
              <div className="flex flex-col">
                <span className="font-sans text-[11px] uppercase tracking-wider text-secondary font-semibold">{t('officialClinicalRecord')}</span>
                <h3 className="font-serif text-lg font-bold text-primary">{previewDoc.title}</h3>
                <span className="font-sans text-xs text-secondary mt-0.5">{previewDoc.provider} · {previewDoc.date}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-surface-container text-xs text-on-surface leading-relaxed">
                {previewDoc.summary}
              </div>

              <div className="flex flex-col space-y-1.5">
                <span className="font-sans text-xs font-bold text-on-surface">{t('vitalSigns')}:</span>
                <div className="space-y-1">
                  {previewDoc.vitals.map((v, idx) => (
                    <div key={idx} className="p-2 rounded-md bg-surface-container-low border border-outline-variant/30 text-xs font-sans text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary-container">check</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/40 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
