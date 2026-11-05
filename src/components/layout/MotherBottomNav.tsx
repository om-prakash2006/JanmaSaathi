import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type MotherTab = 'home' | 'journey' | 'connect' | 'profile';

interface MotherBottomNavProps {
  activeTab: MotherTab;
  onTabChange: (tab: MotherTab) => void;
}

export const MotherBottomNav: React.FC<MotherBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'home' as MotherTab, label: t('navHome'), icon: 'home' },
    { id: 'journey' as MotherTab, label: t('navJourney'), icon: 'calendar_month' },
    { id: 'connect' as MotherTab, label: t('navConnect'), icon: 'chat' },
    { id: 'profile' as MotherTab, label: t('navProfile'), icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface/95 backdrop-blur-md border-t border-outline-variant/40">
      <div className="h-16 flex items-center justify-around max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
                isActive ? 'text-primary-container' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
              >
                {tab.icon}
              </span>
              <span className={`text-[11px] font-sans mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
