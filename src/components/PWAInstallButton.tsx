import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-bold text-on-primary shadow-sm hover:opacity-95 transition cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">install_mobile</span>
        {t('installApp')}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">install_mobile</span>
          {t('installIOS')}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl border border-outline-variant space-y-3">
              <h3 className="font-serif text-base font-bold text-on-surface">{t('iosGuideTitle')}</h3>
              <p className="text-xs text-secondary leading-relaxed">
                {t('iosGuideStep1')}<br />
                {t('iosGuideStep2')}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-primary-container py-2 text-xs font-bold text-on-primary hover:opacity-95 cursor-pointer"
              >
                {t('gotIt')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
