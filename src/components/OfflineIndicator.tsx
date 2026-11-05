import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 flex items-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white shadow-xl animate-bounce">
      <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
      <span>{t('offlineStatusText')}</span>
    </div>
  );
};
