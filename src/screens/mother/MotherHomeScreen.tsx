import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface MotherHomeScreenProps {
  onNavigateToJourney: () => void;
  onNavigateToConnect: () => void;
  onNavigateToProfile: () => void;
}

export const MotherHomeScreen: React.FC<MotherHomeScreenProps> = ({
  onNavigateToJourney,
  onNavigateToConnect,
}) => {
  const { mothers, healthUpdates, appointments, addHealthUpdate } = useData();
  const { t } = useLanguage();
  const mother = mothers[0]; // Priya Sharma
  const priyaUpdates = healthUpdates.filter((u) => u.motherId === mother.id);
  const nextAppt = appointments.find((a) => a.motherId === mother.id) || appointments[0];

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [symptomList, setSymptomList] = useState<string[]>([]);
  const [observations, setObservations] = useState('');
  const [notes, setNotes] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);

  const availableSymptoms = [
    'Mild Swelling in Feet / Hands',
    'Routine Well-being Check-in',
    'Nausea or Morning Sickness',
    'Backache / Pelvic Pressure',
    'Mild Fatigue',
    'Supplements Query',
  ];

  const toggleSymptom = (sym: string) => {
    if (symptomList.includes(sym)) {
      setSymptomList(symptomList.filter((s) => s !== sym));
    } else {
      setSymptomList([...symptomList, sym]);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observations.trim() && symptomList.length === 0) return;

    await addHealthUpdate({
      motherId: mother.id,
      motherName: mother.name,
      observations: observations.trim() || symptomList.join(', '),
      symptoms: symptomList,
      notes: notes.trim() || 'Logged via Mother Portal check-in.',
    });

    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReportModalOpen(false);
      setObservations('');
      setNotes('');
      setSymptomList([]);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* 1. Header Greeting */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('greetingPriya')}
        </h1>
        <p className="font-sans text-sm text-secondary mt-1">
          {t('motherJourneySubtitle')}
        </p>
      </section>

      {/* 2. Primary Action Button */}
      <section>
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="w-full bg-primary-container active:scale-[0.99] transition-transform rounded-xl p-space-lg text-on-primary flex items-center justify-between shadow-md text-left cursor-pointer"
        >
          <div className="flex items-center gap-space-md min-w-0">
            <div className="w-12 h-12 rounded-full bg-on-primary/15 flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-on-primary text-[28px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                edit_note
              </span>
            </div>
            <div className="flex flex-col min-w-0 pr-space-xs">
              <span className="font-sans text-base font-semibold tracking-tight leading-snug">
                {t('reportHealthUpdate')}
              </span>
              <span className="font-sans text-xs text-on-primary/80 line-clamp-1">
                {t('reportSubtitle')}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-on-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[20px]">
              arrow_forward
            </span>
          </div>
        </button>
      </section>

      {/* 3. Pregnancy Overview Section */}
      <section className="flex flex-col space-y-space-sm">
        <div className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-secondary">
                {t('estimatedGestation')}
              </span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-serif text-xl font-bold text-primary">
                  Week {mother.gestationalAgeWeeks}
                </span>
                <span className="font-sans text-xs text-tertiary">· {t('trimester2')}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-secondary-container text-[22px]">
                calendar_today
              </span>
            </div>
          </div>

          {/* Gestational Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-500"
                style={{ width: `${(mother.gestationalAgeDays / 280) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-secondary font-sans text-xs">
              <span>Week 1</span>
              <span className="font-semibold text-primary">
                Day {mother.gestationalAgeDays} of 280
              </span>
              <span>Week 40</span>
            </div>
          </div>

          <div className="pt-space-xs flex items-center justify-between text-tertiary font-sans text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
              <span>
                <span className="text-secondary">{t('eddLabel')}:</span>{' '}
                <strong className="font-semibold text-primary">{mother.edd}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Upcoming Appointment Section */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <h2 className="font-serif text-lg font-bold text-primary">{t('nextAppointment')}</h2>
          <span className="font-sans text-xs font-semibold text-secondary">{t('statusScheduled')}</span>
        </div>
        <div className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-14 rounded-xl bg-secondary-container flex flex-col items-center justify-center shrink-0 text-on-secondary-container">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wide leading-none">
                {nextAppt.month}
              </span>
              <span className="font-serif text-lg font-bold leading-tight mt-0.5">
                {nextAppt.day}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-primary font-sans text-sm font-bold">
                {nextAppt.date}
              </div>
              <span className="font-sans text-xs text-secondary font-medium mt-0.5">
                {nextAppt.time}
              </span>
              <p className="font-sans text-xs text-tertiary mt-1">
                {nextAppt.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs text-secondary bg-surface-container-high px-space-md py-space-sm rounded-lg">
            <span className="material-symbols-outlined text-[20px] shrink-0 text-primary">location_on</span>
            <span className="font-sans text-xs truncate">{nextAppt.facility}</span>
          </div>
          <div className="pt-space-xs flex justify-end">
            <button
              onClick={onNavigateToJourney}
              className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary-container hover:opacity-85 min-h-[44px] px-space-sm cursor-pointer"
            >
              <span>{t('viewDetails')}</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Recent Health Updates */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <h2 className="font-serif text-lg font-bold text-primary">{t('recentHealthUpdates')}</h2>
          <button
            onClick={onNavigateToConnect}
            className="font-sans text-xs font-semibold text-secondary hover:text-primary cursor-pointer"
          >
            {t('viewDetails')}
          </button>
        </div>

        <div className="space-y-space-sm">
          {priyaUpdates.slice(0, 2).map((item) => (
            <div
              key={item.healthUpdateId}
              className="bg-surface-container rounded-xl p-space-md border border-outline-variant/30 shadow-sm flex flex-col space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-secondary">{item.submittedAt}</span>
                {item.reviewStatus === 'reviewed' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-container text-on-secondary-container">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    {t('statusReviewed')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-secondary">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    {t('statusPending')}
                  </span>
                )}
              </div>
              <p className="font-sans text-sm font-semibold text-on-surface">
                {item.observations}
              </p>
              <p className="font-sans text-xs text-secondary">
                {item.reviewNotes ? item.reviewNotes : item.notes}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Your Health Worker Section */}
      <section className="flex flex-col space-y-space-sm pb-4">
        <div className="flex items-center justify-between px-space-xs">
          <h2 className="font-serif text-lg font-bold text-primary">{t('yourHealthWorker')}</h2>
        </div>

        <div className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container font-serif font-bold text-lg">
              SD
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-base font-bold text-on-surface">
                {mother.assignedWorkerName}
              </span>
              <span className="font-sans text-xs text-secondary">
                {mother.village}, {mother.hamlet}
              </span>
            </div>
          </div>

          {callbackRequested ? (
            <div className="p-3 bg-secondary-container/40 rounded-lg border border-outline-variant text-xs text-on-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary-container">check_circle</span>
                <span>{t('callbackSentNotice', { name: mother.assignedWorkerName })}</span>
              </div>
              <button
                onClick={() => setCallbackRequested(false)}
                className="text-xs text-secondary hover:text-on-surface cursor-pointer"
              >
                {t('dismiss')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
              <button
                onClick={onNavigateToConnect}
                className="min-h-[44px] rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface font-sans text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>{t('sendMessageButton')}</span>
              </button>
              <button
                onClick={() => setCallbackRequested(true)}
                className="min-h-[44px] rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>{t('requestCallback')}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Report Health Update Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-space-lg border border-outline-variant shadow-2xl flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[24px]">edit_note</span>
                <h3 className="font-serif text-lg font-bold text-on-surface">{t('reportHealthUpdate')}</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 flex flex-col items-center text-center space-y-2">
                <span className="material-symbols-outlined text-[48px] text-primary-container">check_circle</span>
                <span className="font-serif text-lg font-bold text-on-surface">{t('updateSubmittedTitle')}</span>
                <p className="font-sans text-xs text-secondary max-w-xs">
                  {t('updateSubmittedDesc')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-space-md">
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1.5">
                    {t('symptomsTitle')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSymptoms.map((sym) => {
                      const selected = symptomList.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => toggleSymptom(sym)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-primary-container text-on-primary border-primary-container'
                              : 'bg-surface-container text-on-surface border-outline-variant hover:border-primary-container'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                    {t('observationsLabel')}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder={t('observationsPlaceholder')}
                    className="w-full p-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-sm focus:outline-none focus:border-primary-container text-on-surface"
                  />
                </div>

                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                    {t('additionalNotesLabel')}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('additionalNotesPlaceholder')}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-sm focus:outline-none focus:border-primary-container text-on-surface"
                  />
                </div>

                <div className="p-3 rounded-lg bg-secondary-container/40 border border-outline-variant/50 text-[11px] text-tertiary flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary-container shrink-0 mt-0.5">info</span>
                  <span>
                    {t('dangerSignWarning')}
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 h-12 rounded-lg border border-outline-variant text-on-surface font-sans text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  >
                    {t('sendToWorker')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
