import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface SupervisorWorkersScreenProps {
  onStartAssign: (workerId?: string) => void;
}

export const SupervisorWorkersScreen: React.FC<SupervisorWorkersScreenProps> = ({
  onStartAssign,
}) => {
  const { workers } = useData();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.staffCode.toLowerCase().includes(search.toLowerCase()) ||
      w.assignedSubCentre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
              {t('navWorkers')}
            </h1>
            <p className="font-sans text-xs text-secondary mt-0.5">
              {t('activeWorkerFleet')}
            </p>
          </div>
          <button
            onClick={() => onStartAssign()}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold flex items-center gap-1 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
            <span>+ {t('navAssign')}</span>
          </button>
        </div>
      </section>

      {/* 2. Search Bar */}
      <section>
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-3 text-[20px] text-secondary">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container border border-outline-variant font-sans text-xs text-on-surface focus:outline-none focus:border-primary-container"
          />
        </div>
      </section>

      {/* 3. Workers List */}
      <section className="space-y-space-sm">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-space-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container font-serif font-bold text-base">
                  {worker.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-bold text-on-surface">
                      {worker.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                      {t('roleWorker')}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-secondary block mt-0.5">
                    {t('staffCodeLabel')}: {worker.staffCode}
                  </span>
                  <span className="font-sans text-xs text-secondary flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    {worker.phone}
                  </span>
                </div>
              </div>

              <div>
                {worker.status === 'unassigned' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/15 text-primary-container border border-primary-container/30">
                    {t('statusPending')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant">
                    {t('statusActive')}
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-xs text-secondary">
              <div className="flex items-center justify-between">
                <span>{t('facilityLabel')}:</span>
                <strong className="text-on-surface">{worker.assignedSubCentre}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('assignedMothers')}:</span>
                <strong className="text-primary">{worker.activeMothersCount}</strong>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end border-t border-outline-variant/30">
              <button
                onClick={() => onStartAssign(worker.id)}
                className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 shadow-sm cursor-pointer"
              >
                {t('allocateWorker')}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
