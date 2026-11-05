import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { PWAInstallButton } from '../../components/PWAInstallButton';

export const WorkerMoreScreen: React.FC = () => {
  const { logout } = useAuth();
  const { workers, resetToDefaultData } = useData();
  const { language, setLanguage, t } = useLanguage();
  const worker = workers[0]; // Sunita Devi

  const [activeCalculator, setActiveCalculator] = useState(false);
  const [calcLMP, setCalcLMP] = useState('2026-05-21');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'inventory' | 'guidelines' | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const calculateEDD = () => {
    if (!calcLMP) return;
    const lmpDate = new Date(calcLMP);
    const edd = new Date(lmpDate);
    edd.setDate(edd.getDate() + 280);

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    setCalcResult(
      `EDD: ${edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (Week ${weeks > 0 ? weeks : 0}, Day ${days > 0 ? days : 0})`
    );
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-8">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('navMore')}
        </h1>
        <p className="font-sans text-xs text-secondary mt-0.5">
          Health Worker workspace utilities and clinical references
        </p>
      </section>

      {/* 2. Worker Profile Card */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex items-center gap-space-md">
        <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container font-serif font-bold text-xl">
          SD
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-sans text-base font-bold text-on-surface">
              {worker.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
              {t('roleWorker')}
            </span>
          </div>
          <span className="font-sans text-xs text-secondary mt-0.5">
            Staff ID: {worker.staffCode}
          </span>
          <span className="font-sans text-xs text-secondary">
            {worker.assignedSubCentre}
          </span>
        </div>
      </section>

      {/* 3. Field Utilities */}
      <section className="space-y-space-sm">
        {/* Gestation Calculator */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">calculate</span>
              <span className="font-sans text-sm font-bold text-on-surface">LMP / EDD Calculator</span>
            </div>
            <button
              onClick={() => setActiveCalculator(!activeCalculator)}
              className="text-xs font-semibold text-primary-container hover:underline cursor-pointer"
            >
              {activeCalculator ? t('close') : t('calculate')}
            </button>
          </div>

          {activeCalculator && (
            <div className="pt-2 border-t border-outline-variant/30 space-y-2">
              <div>
                <label className="text-[11px] font-sans font-semibold text-secondary block mb-1">
                  {t('eddLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={calcLMP}
                    onChange={(e) => setCalcLMP(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs"
                  />
                  <button
                    type="button"
                    onClick={calculateEDD}
                    className="px-4 h-10 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
                  >
                    {t('calculate')}
                  </button>
                </div>
              </div>
              {calcResult && (
                <div className="p-2.5 rounded-lg bg-secondary-container/40 text-xs font-medium text-tertiary">
                  {calcResult}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PWA App Installation Option */}
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">install_mobile</span>
            <div>
              <span className="font-sans text-xs font-bold text-on-surface block">{t('pwaHeadline')}</span>
              <span className="font-sans text-[11px] text-secondary">{t('pwaSubheadline')}</span>
            </div>
          </div>
          <PWAInstallButton />
        </div>
      </section>

      {/* Language Preferences */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-3">
        <div>
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
            {t('languagePreferences')}
          </span>
          <p className="font-sans text-xs text-secondary mt-0.5">
            {t('chooseLanguageDesc')}
          </p>
        </div>

        <div className="space-y-2">
          {[
            { id: 'en' as Language, label: 'English', sub: 'Default' },
            { id: 'hi' as Language, label: 'हिंदी (Hindi)', sub: 'मानक भाषा' },
            { id: 'or' as Language, label: 'ଓଡ଼ିଆ (Odia)', sub: 'ଆଞ୍ଚଳିକ ଭାଷା' },
          ].map((langItem) => {
            const isSelected = language === langItem.id;
            return (
              <button
                key={langItem.id}
                type="button"
                onClick={() => setLanguage(langItem.id)}
                className={`w-full p-3 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-on-primary border-primary-container'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary-container'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-sans text-xs font-semibold">{langItem.label}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-on-primary/80' : 'text-secondary'}`}>
                    {langItem.sub}
                  </span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Demonstration Data Tools */}
      <section className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
          Demonstration Baseline State
        </span>

        {resetMessage && (
          <div className="p-2.5 rounded-lg bg-secondary-container/50 border border-outline-variant text-xs text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary-container">check_circle</span>
            <span>{resetMessage}</span>
          </div>
        )}

        {showResetConfirm ? (
          <div className="p-3 rounded-lg bg-surface-container-high border border-outline-variant space-y-2">
            <span className="font-sans text-xs font-bold text-on-surface block">Reset all demo records back to baseline?</span>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await resetToDefaultData();
                  setShowResetConfirm(false);
                  setResetMessage('Demonstration dataset reset to initial baseline.');
                  setTimeout(() => setResetMessage(null), 4000);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant text-xs font-semibold text-secondary hover:text-on-surface cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Reset Demo Data to Initial Baseline
          </button>
        )}
      </section>

      {/* 5. Sign Out */}
      <section>
        <button
          type="button"
          onClick={logout}
          className="w-full h-12 rounded-lg bg-surface-container-high border border-outline-variant text-error font-sans text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>{t('signOut')}</span>
        </button>
      </section>
    </div>
  );
};
