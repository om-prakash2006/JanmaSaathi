import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface SupervisorAssignScreenProps {
  preselectedWorkerId?: string;
  onFinished: () => void;
  onCancel: () => void;
}

export const SupervisorAssignScreen: React.FC<SupervisorAssignScreenProps> = ({
  preselectedWorkerId,
  onFinished,
  onCancel,
}) => {
  const { workers, mothers, villageAllocations, allocateWorker } = useData();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [selectedWorkerId, setSelectedWorkerId] = useState(
    preselectedWorkerId || workers.find((w) => w.status === 'unassigned')?.id || workers[0].id
  );
  const [selectedAllocationId, setSelectedAllocationId] = useState(
    villageAllocations.find((v) => !v.assignedWorkerId)?.id || villageAllocations[0].id
  );
  const [hamletText, setHamletText] = useState('Ward 3, North Hamlet, School Tola');
  const [selectedMotherIds, setSelectedMotherIds] = useState<string[]>(
    mothers.filter((m) => !m.assignedWorkerId || m.assignedWorkerId === '').map((m) => m.id)
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];
  const selectedAllocation = villageAllocations.find((v) => v.id === selectedAllocationId) || villageAllocations[0];
  const unallocatedMothers = mothers.filter((m) => !m.assignedWorkerId || m.assignedWorkerId === '');

  const toggleMotherSelection = (id: string) => {
    if (selectedMotherIds.includes(id)) {
      setSelectedMotherIds(selectedMotherIds.filter((mId) => mId !== id));
    } else {
      setSelectedMotherIds([...selectedMotherIds, id]);
    }
  };

  const handleConfirmAssignment = async () => {
    await allocateWorker(selectedAllocation.id, selectedWorker.id, selectedMotherIds);
    setIsSuccess(true);
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-8">
      {/* 1. Header & Step Breadcrumb */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-container hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{t('back')}</span>
          </button>
          <span className="font-sans text-xs text-secondary font-bold">
            Step {step} of 5
          </span>
        </div>
        <h1 className="font-serif text-2xl text-on-surface font-normal tracking-tight mt-2">
          {t('assignWorkerToHamlet')}
        </h1>
        <p className="font-sans text-xs text-secondary">
          {t('allocateWorker')}
        </p>

        {/* 5-step progress indicator */}
        <div className="flex items-center gap-1.5 pt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-primary-container' : 'bg-outline-variant/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Wizard Steps */}
      {isSuccess ? (
        <section className="bg-surface-container rounded-xl p-space-xl border border-outline-variant/40 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-primary-container">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              check_circle
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-on-surface">
              {t('allocationSuccess')}
            </h2>
            <p className="font-sans text-xs text-secondary max-w-sm">
              <strong>{selectedWorker.name}</strong> has been allocated to{' '}
              <strong>{selectedAllocation.villageName}</strong> with{' '}
              <strong>{selectedMotherIds.length}</strong> mothers assigned.
            </p>
          </div>

          <button
            onClick={onFinished}
            className="w-full h-12 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
          >
            {t('navOverview')}
          </button>
        </section>
      ) : (
        <>
          {/* STEP 1: Select Health Worker */}
          {step === 1 && (
            <section className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-serif text-base text-on-surface font-bold">
                  {t('selectWorkerToAssign')}
                </h2>
              </div>

              <div className="space-y-2">
                {workers.map((worker) => {
                  const isSelected = selectedWorkerId === worker.id;
                  return (
                    <div
                      key={worker.id}
                      onClick={() => setSelectedWorkerId(worker.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-container/10 border-primary-container'
                          : 'bg-surface-container-lowest border-outline-variant/50 hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-primary-container font-serif font-bold text-xs">
                          {worker.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <span className="font-sans text-xs font-bold text-on-surface block">
                            {worker.name}
                          </span>
                          <span className="font-sans text-[11px] text-secondary">
                            Staff Code: {worker.staffCode}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          worker.status === 'unassigned'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}
                      >
                        {worker.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2: Select Village & Sub-Centre */}
          {step === 2 && (
            <section className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-serif text-base text-on-surface font-bold">
                  {t('selectVillageHamlet')}
                </h2>
              </div>

              <div className="space-y-2">
                {villageAllocations.map((alloc) => {
                  const isSelected = selectedAllocationId === alloc.id;
                  return (
                    <div
                      key={alloc.id}
                      onClick={() => setSelectedAllocationId(alloc.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-container/10 border-primary-container'
                          : 'bg-surface-container-lowest border-outline-variant/50 hover:bg-surface-container'
                      }`}
                    >
                      <div>
                        <span className="font-sans text-xs font-bold text-on-surface block">
                          {alloc.villageName} — {alloc.sector}
                        </span>
                        <span className="font-sans text-[11px] text-secondary">
                          Facility: {alloc.subCentre}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-primary block">
                          {alloc.totalMothers} Mothers
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 3: Define Service Hamlets */}
          {step === 3 && (
            <section className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="font-serif text-base text-on-surface font-bold">
                  {t('selectVillageHamlet')}
                </h2>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  Specify Hamlets / Wards *
                </label>
                <textarea
                  rows={3}
                  value={hamletText}
                  onChange={(e) => setHamletText(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                />
              </div>
            </section>
          )}

          {/* STEP 4: Allocate Unassigned Mothers */}
          {step === 4 && (
            <section className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <h2 className="font-serif text-base text-on-surface font-bold">
                    {t('assignedMothers')}
                  </h2>
                </div>
                <span className="text-xs font-bold text-primary">
                  {selectedMotherIds.length} Selected
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unallocatedMothers.map((m) => {
                  const isChecked = selectedMotherIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMotherSelection(m.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                        isChecked
                          ? 'bg-primary-container/10 border-primary-container font-semibold'
                          : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[11px] ${
                            isChecked
                              ? 'bg-primary-container border-primary-container text-on-primary'
                              : 'border-outline-variant'
                          }`}
                        >
                          {isChecked && '✓'}
                        </span>
                        <span>
                          {m.name} ({m.id})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 5: Review & Confirm Assignment */}
          {step === 5 && (
            <section className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary-container text-primary-container text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <h2 className="font-serif text-base text-on-surface font-bold">
                  {t('confirmAllocation')}
                </h2>
              </div>

              <div className="space-y-2 text-xs bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40">
                <div className="flex justify-between py-1 border-b border-outline-variant/30">
                  <span className="text-secondary">{t('roleWorker')}:</span>
                  <strong className="text-on-surface">{selectedWorker.name} ({selectedWorker.staffCode})</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/30">
                  <span className="text-secondary">Area:</span>
                  <strong className="text-on-surface">{selectedAllocation.villageName} ({selectedAllocation.sector})</strong>
                </div>
              </div>
            </section>
          )}

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12 rounded-lg border border-outline-variant text-on-surface font-sans text-xs font-semibold hover:bg-surface-container cursor-pointer"
              >
                {t('back')}
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 h-12 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-bold hover:opacity-95 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAssignment}
                className="flex-1 h-12 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-bold hover:opacity-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{t('confirmAllocation')}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
