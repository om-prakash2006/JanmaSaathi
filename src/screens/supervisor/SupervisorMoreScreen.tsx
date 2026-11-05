import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { PWAInstallButton } from '../../components/PWAInstallButton';

export const SupervisorMoreScreen: React.FC = () => {
  const { logout } = useAuth();
  const { supervisor, resetToDefaultData, mothers, workers, assessments } = useData();
  const { language, setLanguage, t } = useLanguage();
  const [activeModal, setActiveModal] = React.useState<'fleet' | 'rbac' | null>(null);
  const [resetMessage, setResetMessage] = React.useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const handleExportData = () => {
    const exportBundle = {
      timestamp: new Date().toISOString(),
      supervisor: supervisor.name,
      district: supervisor.district,
      mothersCount: mothers.length,
      workersCount: workers.length,
      assessmentsCount: assessments.length,
      status: 'Verified Clinical Export',
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JanmaSaathi_Supervisor_Audit_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-8">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('navMore')}
        </h1>
        <p className="font-sans text-xs text-secondary mt-0.5">
          District health governance, auditing & system controls
        </p>
      </section>

      {/* 2. Supervisor Profile Card */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex items-center gap-space-md">
        <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container font-serif font-bold text-xl">
          RK
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-sans text-base font-bold text-on-surface">
              {supervisor.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
              MOIC
            </span>
          </div>
          <span className="font-sans text-xs text-secondary mt-0.5">
            Supervisor ID: {supervisor.id}
          </span>
          <span className="font-sans text-xs text-secondary">
            {supervisor.designation} • {supervisor.district}
          </span>
        </div>
      </section>

      {/* 3. Administrative Actions */}
      <section className="space-y-space-sm">
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">download</span>
            <div>
              <span className="font-sans text-xs font-bold text-on-surface block">{t('exportAuditData')}</span>
              <span className="font-sans text-[11px] text-secondary">Download complete block maternal records</span>
            </div>
          </div>
          <button
            onClick={handleExportData}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 cursor-pointer"
          >
            Export JSON
          </button>
        </div>

        {/* PWA Mobile App Installation */}
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

      {/* 4. Demonstration Tools */}
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
            Reset Demonstration Dataset
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
