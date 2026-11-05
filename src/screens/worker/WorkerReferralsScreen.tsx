import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface WorkerReferralsScreenProps {
  initialMotherId?: string;
  onSelectReferral?: (id: string) => void;
}

export const WorkerReferralsScreen: React.FC<WorkerReferralsScreenProps> = ({
  initialMotherId,
}) => {
  const { referrals, mothers, workers, addReferral } = useData();
  const { t } = useLanguage();
  const worker = workers[0]; // Sunita Devi

  const [isModalOpen, setIsModalOpen] = useState(!!initialMotherId);
  const [selectedMotherId, setSelectedMotherId] = useState(
    initialMotherId || mothers[1]?.id || 'MCP-2025-0412'
  );
  const [facility, setFacility] = useState('Rampur Primary Health Centre (PHC)');
  const [facilityType, setFacilityType] = useState<'PHC' | 'CHC' | 'District Hospital'>('PHC');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'emergency'>('urgent');
  const [reason, setReason] = useState('Elevated blood pressure and persistent headache requiring obstetric review.');
  const [transportArranged, setTransportArranged] = useState(true);
  const [accompanied, setAccompanied] = useState(true);

  const [filter, setFilter] = useState<'all' | 'urgent' | 'active'>('all');

  const filteredReferrals = referrals.filter((r) => {
    if (filter === 'urgent') return r.priority === 'urgent' || r.priority === 'emergency';
    if (filter === 'active') return r.status === 'initiated' || r.status === 'acknowledged';
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mom = mothers.find((m) => m.id === selectedMotherId) || mothers[0];

    await addReferral({
      motherId: mom.id,
      motherName: mom.name,
      workerId: worker.id,
      workerName: worker.name,
      referredToFacility: facility,
      facilityType,
      reasonForReferral: reason,
      priority,
      transportArranged,
      accompaniedByWorker: accompanied,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
              {t('navReferrals')}
            </h1>
            <p className="font-sans text-xs text-secondary mt-0.5">
              {t('emergencyReferrals')}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold flex items-center gap-1 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ {t('createReferral')}</span>
          </button>
        </div>
      </section>

      {/* 2. Filter Pills */}
      <section className="flex items-center gap-1.5">
        {[
          { id: 'all', label: `${t('filterAll')} (${referrals.length})` },
          { id: 'urgent', label: t('filterHighRisk') },
          { id: 'active', label: t('statusActive') },
        ].map((pill) => (
          <button
            key={pill.id}
            onClick={() => setFilter(pill.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              filter === pill.id
                ? 'bg-primary-container text-on-primary'
                : 'bg-surface-container text-secondary border border-outline-variant hover:border-primary-container'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </section>

      {/* 3. Referrals List */}
      <section className="space-y-space-sm">
        {filteredReferrals.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-space-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-bold text-on-surface">
                    {item.motherName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.priority === 'emergency'
                        ? 'bg-error text-on-error'
                        : item.priority === 'urgent'
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <span className="font-sans text-xs text-secondary block mt-0.5">
                  ID: {item.motherId} • Ref: {item.id}
                </span>
              </div>
              <span className="font-sans text-xs text-secondary">
                {item.createdAt}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-primary font-semibold">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>{item.referredToFacility}</span>
              </div>
              <p className="text-tertiary">
                <strong className="text-secondary font-medium">{t('referralReason')}:</strong> {item.reasonForReferral}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs border-t border-outline-variant/30">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.status === 'arrived'
                    ? 'bg-surface-variant text-on-surface-variant'
                    : 'bg-primary-container/10 text-primary-container border border-primary-container/30'
                }`}
              >
                {item.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* New Referral Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl p-space-lg border border-outline-variant shadow-2xl flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <h3 className="font-serif text-lg font-bold text-on-surface">{t('createReferral')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('selectMotherForAssessment')} *
                </label>
                <select
                  value={selectedMotherId}
                  onChange={(e) => setSelectedMotherId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                >
                  {mothers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) — Wk {m.gestationalAgeWeeks}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('facilityType')} *
                </label>
                <select
                  value={facility}
                  onChange={(e) => {
                    setFacility(e.target.value);
                    if (e.target.value.includes('PHC')) setFacilityType('PHC');
                    else if (e.target.value.includes('CHC')) setFacilityType('CHC');
                    else setFacilityType('District Hospital');
                  }}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                >
                  <option value="Rampur Primary Health Centre (PHC)">Rampur Primary Health Centre (PHC)</option>
                  <option value="Pipili Community Health Centre (CHC)">Pipili Community Health Centre (CHC)</option>
                  <option value="District Hospital Khordha">District Hospital Khordha</option>
                </select>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('referralReason')} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 rounded-lg border border-outline-variant text-xs font-semibold cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 cursor-pointer"
                >
                  {t('referralSubmitted')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
