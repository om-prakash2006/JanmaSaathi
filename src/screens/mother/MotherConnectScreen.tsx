import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

export const MotherConnectScreen: React.FC = () => {
  const { mothers, healthUpdates, messages, sendMessage } = useData();
  const { t } = useLanguage();
  const mother = mothers[0]; // Priya
  const priyaUpdates = healthUpdates.filter((u) => u.motherId === mother.id);
  const [inputText, setInputText] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(false);

  const suggestedQueries = [
    { key: 'queryDietNutrition', text: t('queryDietNutrition') },
    { key: 'queryAppointment', text: t('queryAppointment') },
    { key: 'queryMedication', text: t('queryMedication') },
    { key: 'queryFetalMovements', text: t('queryFetalMovements') },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await sendMessage(inputText.trim(), 'mother', mother.id, mother.name);
    setInputText('');
  };

  const handleQuickSend = (queryText: string) => {
    setInputText(queryText);
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6">
      {/* 1. Header Greeting */}
      <section className="flex flex-col pt-space-xs">
        <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
          {t('navConnect')}
        </h1>
        <p className="font-sans text-sm text-secondary mt-1">
          {t('reportSubtitle')}
        </p>
      </section>

      {/* 2. Health Worker Assigned Card */}
      <section className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 text-primary-container font-serif font-bold text-lg">
              SD
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-sans text-base font-bold text-on-surface">
                  {mother.assignedWorkerName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  {t('statusActive')}
                </span>
              </div>
              <span className="font-sans text-xs text-secondary">
                {t('yourHealthWorker')}
              </span>
              <span className="font-sans text-xs text-secondary">
                {mother.village}, {mother.hamlet}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <a
            href="#chat-section"
            className="min-h-[44px] rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>{t('sendMessageButton')}</span>
          </a>
          <button
            type="button"
            onClick={() => {
              setCallbackRequested(true);
              setTimeout(() => setCallbackRequested(false), 3000);
            }}
            className="min-h-[44px] rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface font-sans text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>{callbackRequested ? t('callbackQueued') : t('requestCallback')}</span>
          </button>
        </div>

        {callbackRequested && (
          <div className="p-2.5 rounded-lg bg-primary-container/10 border border-primary-container/30 text-xs text-primary-container text-center font-medium">
            {t('callbackSentNotice', { name: mother.assignedWorkerName })}
          </div>
        )}
      </section>

      {/* 3. Recent Health Updates & Review Status */}
      <section className="flex flex-col space-y-space-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">fact_check</span>
          <h2 className="font-serif text-lg font-bold text-primary">{t('recentHealthUpdates')}</h2>
        </div>

        <div className="space-y-space-sm">
          {priyaUpdates.map((item) => (
            <div
              key={item.healthUpdateId}
              className="bg-surface-container rounded-xl p-space-md border border-outline-variant/40 shadow-sm flex flex-col space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-on-surface">
                  {item.submittedAt}
                </span>
                {item.reviewStatus === 'reviewed' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-container text-on-secondary-container flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                    {t('statusReviewed')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                    {t('statusPending')}
                  </span>
                )}
              </div>

              <p className="font-sans text-xs text-on-surface">
                <strong className="text-secondary font-medium">{t('clinicalNotes')}:</strong> {item.observations}
              </p>

              {item.reviewNotes && (
                <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-tertiary">
                  <span className="font-semibold text-primary block mb-0.5">{mother.assignedWorkerName}:</span>
                  <p className="italic font-serif">"{item.reviewNotes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recent Messages Section */}
      <section id="chat-section" className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">chat_bubble</span>
            <h2 className="font-serif text-lg font-bold text-primary">{t('askHealthWorker')}</h2>
          </div>
          <span className="font-sans text-[11px] text-secondary">{t('statusActive')}</span>
        </div>

        {/* Message Thread */}
        <div className="bg-surface-container-low rounded-xl p-space-md border border-outline-variant/40 shadow-sm space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderRole === 'mother';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-secondary mb-0.5 px-1">
                  {isMe ? `${t('roleMother')} (${mother.name})` : `${mother.assignedWorkerName} (${t('roleWorker')})`}
                </span>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-primary-container text-on-primary rounded-br-none shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface rounded-bl-none border border-outline-variant/40'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-secondary mt-0.5 px-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">done_all</span>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {/* Suggested Inquiries */}
          <div className="pt-2">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
              {t('suggestedInquiries')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQueries.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => handleQuickSend(q.text)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-surface-container-high text-on-surface border border-outline-variant/40 hover:border-primary-container cursor-pointer"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          {/* Composer Input */}
          <form onSubmit={handleSend} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('typeMessagePlaceholder')}
              className="flex-1 h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs focus:outline-none focus:border-primary-container text-on-surface"
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-lg bg-primary-container text-on-primary flex items-center justify-center hover:opacity-95 shadow-sm cursor-pointer"
              aria-label={t('sendMessageButton')}
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>

        <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 text-[11px] text-secondary flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary-container shrink-0 mt-0.5">verified_user</span>
          <span>
            {t('confidentialNotice')}
          </span>
        </div>
      </section>
    </div>
  );
};
