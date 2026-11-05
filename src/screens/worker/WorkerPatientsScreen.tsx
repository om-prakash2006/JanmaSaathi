import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerPatientsScreenProps {
  onStartNewAssessment: (motherId: string) => void;
  onCreateReferral: (motherId: string) => void;
}

export const WorkerPatientsScreen: React.FC<WorkerPatientsScreenProps> = ({
  onStartNewAssessment,
  onCreateReferral,
}) => {
  const { mothers, registerMother } = useData();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrimester, setFilterTrimester] = useState<'all' | 't1' | 't2' | 't3' | 'high'>('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [newMotherName, setNewMotherName] = useState('');
  const [newMotherAge, setNewMotherAge] = useState(24);
  const [newMotherGestation, setNewMotherGestation] = useState(16);
  const [newMotherPhone, setNewMotherPhone] = useState('+91 98450 11234');
  const [newMotherHamlet, setNewMotherHamlet] = useState('Sector 4');

  const filteredMothers = mothers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.village.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTrimester === 't1') return m.trimester === 1;
    if (filterTrimester === 't2') return m.trimester === 2;
    if (filterTrimester === 't3') return m.trimester === 3;
    if (filterTrimester === 'high') return m.riskCategory === 'high';
    return true;
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMotherName.trim()) return;

    setIsRegistering(true);
    setRegisterError(null);
    try {
      await registerMother({
        name: newMotherName.trim(),
        age: Number(newMotherAge),
        gestationalAgeWeeks: Number(newMotherGestation),
        gestationalAgeDays: Number(newMotherGestation) * 7,
        edd: '25 Feb 2027',
        trimester: newMotherGestation <= 13 ? 1 : newMotherGestation <= 27 ? 2 : 3,
        assignedWorkerId: 'HW-44120',
        assignedWorkerName: 'Sunita Devi',
        village: 'Village Rampur',
        hamlet: newMotherHamlet,
        mcpCardNumber: `MCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        mcpIssuedDate: 'Today',
        phone: newMotherPhone,
        email: `${newMotherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
        riskCategory: 'low',
      });

      setIsRegisterModalOpen(false);
      setNewMotherName('');
      setRegisterError(null);
    } catch (err: any) {
      setRegisterError(
        err.message || 'Firestore write rejected by security rules or network disconnection.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
              {t('navPatients')}
            </h1>
            <p className="font-sans text-xs text-secondary mt-0.5">
              {t('activeRegister')}
            </p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold flex items-center gap-1 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ {t('registerMother')}</span>
          </button>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section className="space-y-space-sm">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-3 text-[20px] text-secondary">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container border border-outline-variant font-sans text-xs text-on-surface focus:outline-none focus:border-primary-container"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `${t('filterAll')} (${mothers.length})` },
            { id: 'high', label: t('filterHighRisk') },
            { id: 't2', label: t('trimester2') },
            { id: 't3', label: t('trimester3') },
            { id: 't1', label: t('trimester1') },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterTrimester(pill.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterTrimester === pill.id
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container text-secondary border border-outline-variant hover:border-primary-container'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Mothers List */}
      <section className="space-y-space-sm">
        {filteredMothers.map((mother) => (
          <div
            key={mother.id}
            className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-space-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-bold text-on-surface">
                    {mother.name}
                  </span>
                  {mother.riskCategory === 'high' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      {t('highRisk')}
                    </span>
                  ) : mother.riskCategory === 'medium' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                      {t('moderateRisk')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-secondary">
                      {t('lowRisk')}
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs text-secondary block mt-0.5">
                  ID: {mother.id} • Age: {mother.age} yrs
                </span>
                <span className="font-sans text-xs text-secondary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {mother.village}, {mother.hamlet}
                </span>
              </div>

              <div className="text-right">
                <span className="font-serif text-sm font-bold text-primary">
                  Week {mother.gestationalAgeWeeks}
                </span>
                <span className="font-sans text-[11px] text-secondary block">
                  EDD: {mother.edd}
                </span>
              </div>
            </div>

            {mother.lastVisitSummary && (
              <p className="font-sans text-xs text-tertiary bg-surface-container-low p-2 rounded border border-outline-variant/30">
                {mother.lastVisitSummary}
              </p>
            )}

            <div className="pt-1 flex items-center justify-between gap-2 border-t border-outline-variant/30">
              <span className="font-sans text-[11px] text-secondary">
                {mother.phone}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCreateReferral(mother.id)}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-semibold text-secondary hover:bg-surface-container-high cursor-pointer"
                >
                  {t('createReferral')}
                </button>
                <button
                  onClick={() => onStartNewAssessment(mother.id)}
                  className="px-3 py-1 rounded-lg bg-primary-container text-on-primary text-[11px] font-semibold hover:opacity-95 shadow-sm cursor-pointer"
                >
                  {t('recordAssessment')}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredMothers.length === 0 && (
          <div className="text-center py-12 text-secondary font-sans text-xs">
            {t('noPatientsFound')}
          </div>
        )}
      </section>

      {/* Register New Mother Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl p-space-lg border border-outline-variant shadow-2xl flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <h3 className="font-serif text-lg font-bold text-on-surface">{t('registerMother')}</h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {registerError && (
              <div className="p-3 rounded-lg bg-error-container/80 border border-error/30 text-xs text-error font-medium flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                <div className="flex-1">
                  <p className="font-semibold">{t('persistenceRejection')}:</p>
                  <p className="mt-0.5">{registerError}</p>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/60 flex items-center justify-between">
              <span className="text-[11px] text-secondary font-medium">Demo:</span>
              <button
                type="button"
                onClick={() => {
                  setNewMotherName('[DEMO-TEST] Shanti Devi (Verified Registration)');
                  setNewMotherAge(23);
                  setNewMotherGestation(18);
                  setNewMotherPhone('+91 98765 43210');
                  setNewMotherHamlet('Sector 4 North');
                  setRegisterError(null);
                }}
                className="text-[11px] font-semibold text-primary-container hover:underline cursor-pointer"
              >
                {t('demoRegistrationQuickFill')}
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newMotherName}
                  onChange={(e) => setNewMotherName(e.target.value)}
                  placeholder="e.g. [DEMO-TEST] Shanti Devi"
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                    {t('maternalAge')} *
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={50}
                    value={newMotherAge}
                    onChange={(e) => setNewMotherAge(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                    {t('gestationalWeek')} *
                  </label>
                  <input
                    type="number"
                    required
                    min={4}
                    max={42}
                    value={newMotherGestation}
                    onChange={(e) => setNewMotherGestation(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('phoneNumber')}
                </label>
                <input
                  type="text"
                  value={newMotherPhone}
                  onChange={(e) => setNewMotherPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('villageAddress')} *
                </label>
                <select
                  value={newMotherHamlet}
                  onChange={(e) => setNewMotherHamlet(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                >
                  <option value="Sector 4">Sector 4</option>
                  <option value="Sector 3 East">Sector 3 East</option>
                  <option value="Sector 4 North">Sector 4 North</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 h-11 rounded-lg border border-outline-variant text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRegistering ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{t('save')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
