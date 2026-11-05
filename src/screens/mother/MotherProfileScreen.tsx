import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { PWAInstallButton } from '../../components/PWAInstallButton';

export const MotherProfileScreen: React.FC = () => {
  const { logout } = useAuth();
  const { mothers } = useData();
  const { language, setLanguage, t } = useLanguage();
  const mother = mothers[0]; // Priya

  const [notifications, setNotifications] = useState({
    appointments: true,
    responses: true,
    followups: true,
    tips: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-8">
      {/* 1. Header Greeting */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('navProfile')}
        </h1>
        <p className="font-sans text-sm text-secondary mt-1">
          {t('chooseLanguageDesc')}
        </p>
      </section>

      {/* 2. Profile Card */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container font-serif font-bold text-xl">
            PS
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-sans text-base font-bold text-on-surface">
                {mother.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                {t('statusActive')}
              </span>
            </div>
            <span className="font-sans text-xs text-secondary mt-0.5">
              {t('mcpCardNo')}: {mother.mcpCardNumber}
            </span>
            <span className="font-sans text-xs text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {mother.village}, {mother.hamlet}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Contact & Identification */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-3">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
          {t('contactIdentification')}
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-outline-variant/30">
            <span className="text-secondary">{t('fullName')}</span>
            <span className="font-semibold text-on-surface">{mother.name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-outline-variant/30">
            <span className="text-secondary">{t('registeredEmail')}</span>
            <span className="font-semibold text-on-surface">{mother.email}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-outline-variant/30">
            <span className="text-secondary">{t('phoneNumber')}</span>
            <span className="font-semibold text-on-surface">{mother.phone}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-outline-variant/30">
            <span className="text-secondary">{t('villageAddress')}</span>
            <span className="font-semibold text-on-surface">{mother.village}, {mother.hamlet}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-secondary">{t('dateOfBirth')}</span>
            <span className="font-semibold text-on-surface">14 August 1998 (26 yrs)</span>
          </div>
        </div>
      </section>

      {/* 4. Pregnancy Milestone Summary */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
            {t('pregnancyMilestoneSummary')}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
            {t('trimesterLabel', { num: mother.trimester })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/30">
            <span className="font-sans text-[11px] text-secondary">{t('currentGestation')}</span>
            <p className="font-sans text-sm font-bold text-on-surface mt-0.5">Week {mother.gestationalAgeWeeks}</p>
            <span className="text-[10px] text-secondary">Day {mother.gestationalAgeDays} of 280</span>
          </div>
          <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/30">
            <span className="font-sans text-[11px] text-secondary">{t('eddLabel')}</span>
            <p className="font-sans text-sm font-bold text-on-surface mt-0.5">{mother.edd}</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-container-high text-xs text-secondary flex items-center justify-between">
          <span>{t('yourHealthWorker')}</span>
          <strong className="text-on-surface">{mother.assignedWorkerName}</strong>
        </div>
      </section>

      {/* 5. Language Preferences */}
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
            { id: 'en' as Language, label: 'English', sub: t('langDefault') },
            { id: 'hi' as Language, label: 'हिंदी (Hindi)', sub: t('langStandard') },
            { id: 'or' as Language, label: 'ଓଡ଼ିଆ (Odia)', sub: t('langRegional') },
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

      {/* 6. Notification Preferences */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-3">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-secondary">
          {t('notificationPreferences')}
        </span>

        <div className="space-y-3">
          {[
            {
              key: 'appointments' as const,
              title: t('notifApptTitle'),
              desc: t('notifApptDesc'),
            },
            {
              key: 'responses' as const,
              title: t('notifResponseTitle'),
              desc: t('notifResponseDesc'),
            },
            {
              key: 'followups' as const,
              title: t('notifFollowupTitle'),
              desc: t('notifFollowupDesc'),
            },
            {
              key: 'tips' as const,
              title: t('notifTipsTitle'),
              desc: t('notifTipsDesc'),
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1">
              <div className="flex flex-col pr-4">
                <span className="font-sans text-xs font-semibold text-on-surface">{item.title}</span>
                <span className="font-sans text-[11px] text-secondary">{item.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification(item.key)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                  notifications[item.key] ? 'bg-primary-container' : 'bg-outline-variant'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* PWA Application Installation */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">install_mobile</span>
          <div>
            <span className="font-sans text-xs font-bold text-on-surface block">{t('pwaHeadline')}</span>
            <span className="font-sans text-[11px] text-secondary">{t('pwaSubheadline')}</span>
          </div>
        </div>
        <PWAInstallButton />
      </section>

      {/* 7. Emergency Helpline Banner */}
      <section className="bg-secondary-container/60 rounded-xl p-space-lg border border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-lg">
            *
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-bold text-on-surface">{t('emergencyHelpline')}</span>
            <span className="font-sans text-[11px] text-secondary">{t('emergencyTollFree')}</span>
          </div>
        </div>
        <a
          href="tel:102"
          className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-bold hover:opacity-95 shadow-sm inline-flex items-center cursor-pointer"
        >
          {t('call102')}
        </a>
      </section>

      {/* 8. Sign Out */}
      <section>
        <button
          type="button"
          onClick={logout}
          className="w-full h-12 rounded-lg bg-surface-container-high border border-outline-variant text-error font-sans text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>{t('signOut')}</span>
        </button>
        <p className="text-center font-sans text-[10px] text-secondary mt-3">
          {t('versionFooter')}
        </p>
      </section>
    </div>
  );
};
