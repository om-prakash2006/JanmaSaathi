import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

export const SupervisorReferralsScreen: React.FC = () => {
  const { referrals, updateReferralStatus } = useData();
  const { t } = useLanguage();
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState('');

  const handleAcknowledge = async (id: string) => {
    await updateReferralStatus(id, 'acknowledged', 'Acknowledged by Dr. Rajesh Kumar (MOIC). Antenatal bed and IV line notified.');
  };

  const handleSaveRemarks = async (id: string) => {
    if (!remarksText.trim()) return;
    await updateReferralStatus(id, 'in_transit', remarksText.trim());
    setSelectedReferralId(null);
    setRemarksText('');
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('emergencyReferrals')}
        </h1>
        <p className="font-sans text-xs text-secondary mt-0.5">
          Emergency escalations, facility reception & medical officer triage
        </p>
      </section>

      {/* 2. Referrals Queue */}
      <section className="space-y-space-sm">
        {referrals.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-space-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-bold text-on-surface">
                    {item.motherName} ({item.motherId})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                  Ref: {item.id}
                </span>
              </div>
              <span className="font-sans text-xs text-secondary">
                {item.createdAt}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>{item.referredToFacility}</span>
              </div>
              <p className="text-tertiary">
                <strong>Indication:</strong> {item.reasonForReferral}
              </p>
            </div>

            {item.supervisorRemarks && (
              <div className="p-2 rounded-lg bg-secondary-container/30 border border-outline-variant/30 text-[11px] text-tertiary">
                <strong>Supervisor Remark:</strong> {item.supervisorRemarks}
              </div>
            )}

            {/* Supervisor Actions */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-outline-variant/30">
              <button
                onClick={() => {
                  setSelectedReferralId(selectedReferralId === item.id ? null : item.id);
                  setRemarksText(item.supervisorRemarks || '');
                }}
                className="text-xs font-semibold text-primary-container hover:underline cursor-pointer"
              >
                {selectedReferralId === item.id ? t('cancel') : 'Add Clinical Notes'}
              </button>

              <div className="flex items-center gap-2">
                {item.status !== 'completed' && (
                  <button
                    onClick={async () => {
                      await updateReferralStatus(item.id, 'completed', 'Case stabilized and discharged.');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-semibold text-secondary hover:bg-surface-container-high cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
                {item.status === 'initiated' && (
                  <button
                    onClick={() => handleAcknowledge(item.id)}
                    className="px-3 py-1 rounded-lg bg-primary-container text-on-primary text-[11px] font-semibold shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>

            {/* Note Editor Drawer */}
            {selectedReferralId === item.id && (
              <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                <textarea
                  rows={2}
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Add Medical Officer Directive / Facility Response..."
                  className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRemarks(item.id)}
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
