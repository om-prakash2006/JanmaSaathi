import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mother, DirectMessage } from '../../types';

interface WorkerPatientsScreenProps {
  onStartNewAssessment: (motherId: string) => void;
  onCreateReferral: (motherId: string) => void;
}

export const WorkerPatientsScreen: React.FC<WorkerPatientsScreenProps> = ({
  onStartNewAssessment,
  onCreateReferral,
}) => {
  const {
    mothers,
    workers,
    healthUpdates,
    appointments,
    assessments,
    messages,
    sendMessage,
    markMessagesAsRead,
    reviewHealthUpdate,
    registerMother,
  } = useData();
  const { t, formatName, formatNumber, localize } = useLanguage();
  const worker = workers[0] || { id: 'HW-44120', name: 'Sunita Devi' };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrimester, setFilterTrimester] = useState<'all' | 't1' | 't2' | 't3' | 'high' | 'attention'>('all');

  // Registration modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [newMotherName, setNewMotherName] = useState('');
  const [newMotherAge, setNewMotherAge] = useState(24);
  const [newMotherGestation, setNewMotherGestation] = useState(16);
  const [newMotherPhone, setNewMotherPhone] = useState('+91 98450 11234');
  const [newMotherHamlet, setNewMotherHamlet] = useState('Sector 4');

  // Patient Chat Modal / Slide-in state
  const [activeChatMother, setActiveChatMother] = useState<Mother | null>(null);
  const [chatInputText, setChatInputText] = useState('');

  // Patient Alerts Modal state
  const [activeAlertsMother, setActiveAlertsMother] = useState<Mother | null>(null);
  const [locallyReviewedAlertIds, setLocallyReviewedAlertIds] = useState<string[]>([]);

  // Helper to get all messages for a specific mother
  const getMotherMessages = (motherId: string): DirectMessage[] => {
    return messages.filter(
      (m) => m.motherId === motherId || m.senderId === motherId
    );
  };

  // Helper to count unread messages from a mother
  const getMotherUnreadCount = (motherId: string): number => {
    return getMotherMessages(motherId).filter(
      (m) => m.senderRole === 'mother' && !m.read
    ).length;
  };

  // Helper to generate patient-specific clinical alerts
  const getMotherAlerts = (m: Mother) => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'high' | 'moderate' | 'routine';
      timestamp: string;
      isReviewed: boolean;
      sourceUpdateId?: string;
    }> = [];

    // 1. Pending or reviewed Health Updates submitted by this mother
    const motherUpdates = healthUpdates.filter((u) => u.motherId === m.id);
    motherUpdates.forEach((hu) => {
      const isPending = hu.reviewStatus === 'pending' && !locallyReviewedAlertIds.includes(hu.healthUpdateId);
      const isHigh =
        hu.observations.toLowerCase().includes('headache') ||
        hu.observations.toLowerCase().includes('bleeding') ||
        hu.observations.toLowerCase().includes('severe');
      const obsText = localize(hu.observations, hu.translations?.observations);
      const notesText = hu.notes ? localize(hu.notes, hu.translations?.notes) : '';
      list.push({
        id: hu.healthUpdateId,
        title: isHigh ? localize('Reported Symptoms Requiring Review') : localize('Maternal Health Update Check-in'),
        description: `${obsText} ${notesText ? `(${notesText})` : ''}`,
        severity: isHigh ? 'high' : 'moderate',
        timestamp: formatNumber(hu.submittedAt),
        isReviewed: !isPending,
        sourceUpdateId: hu.healthUpdateId,
      });
    });

    // 2. High-risk or flagged assessments
    const motherAsmts = assessments.filter((a) => a.motherId === m.id);
    motherAsmts.forEach((asmt) => {
      if (asmt.ruleBasedDangerIdentified || asmt.systolicBP >= 140 || asmt.diastolicBP >= 90) {
        list.push({
          id: `alert-${asmt.id}`,
          title: asmt.systolicBP >= 140 ? localize('Elevated Blood Pressure Alert') : localize('Clinical Assessment Flagged'),
          description: localize(`Vitals recorded: BP ${formatNumber(asmt.systolicBP)}/${formatNumber(asmt.diastolicBP)} mmHg, HR ${formatNumber(asmt.heartRate)} bpm. Protocol follow-up scheduled.`),
          severity: 'high',
          timestamp: formatNumber(asmt.recordedAt),
          isReviewed: asmt.supervisorReviewStatus === 'signed_off' || locallyReviewedAlertIds.includes(`alert-${asmt.id}`),
        });
      }
    });

    // 3. Upcoming or missed appointments
    const motherAppts = appointments.filter((a) => a.motherId === m.id);
    motherAppts.forEach((apt) => {
      const aptTitle = localize(apt.title, apt.translations?.title);
      const aptFacility = localize(apt.facility, apt.translations?.facility);
      const aptNotes = apt.notes ? localize(apt.notes, apt.translations?.notes) : '';
      list.push({
        id: `apt-${apt.id}`,
        title: aptTitle,
        description: `${formatNumber(apt.date)} (${formatNumber(apt.time)}) at ${aptFacility}. ${aptNotes ? `${localize('Notes')}: ${aptNotes}` : ''}`,
        severity: apt.title.toLowerCase().includes('urgent') ? 'high' : 'routine',
        timestamp: formatNumber(apt.date),
        isReviewed: locallyReviewedAlertIds.includes(`apt-${apt.id}`),
      });
    });

    // 4. Follow-up summary flags from Mother record
    if (m.lastVisitSummary && (m.lastVisitSummary.includes('Elevated') || m.lastVisitSummary.includes('Missed') || m.lastVisitSummary.includes('due'))) {
      list.push({
        id: `visit-${m.id}`,
        title: m.lastVisitSummary.includes('Missed') ? localize('Missed Antenatal Checkup') : localize('Priority Follow-up Flag'),
        description: localize(m.lastVisitSummary, m.translations?.lastVisitSummary),
        severity: m.riskCategory === 'high' ? 'high' : 'moderate',
        timestamp: formatNumber(m.lastVisitDate || 'Recent'),
        isReviewed: locallyReviewedAlertIds.includes(`visit-${m.id}`),
      });
    }

    return list;
  };

  // Aggregated Counts for Top Summary Bar
  const totalUnreadMessages = mothers.reduce(
    (sum, m) => sum + getMotherUnreadCount(m.id),
    0
  );

  const totalPendingAlerts = mothers.reduce((sum, m) => {
    const alerts = getMotherAlerts(m);
    return sum + alerts.filter((a) => !a.isReviewed).length;
  }, 0);

  // Filtered mothers list
  const filteredMothers = mothers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hamlet.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTrimester === 't1') return m.trimester === 1;
    if (filterTrimester === 't2') return m.trimester === 2;
    if (filterTrimester === 't3') return m.trimester === 3;
    if (filterTrimester === 'high') return m.riskCategory === 'high';
    if (filterTrimester === 'attention') {
      const unread = getMotherUnreadCount(m.id);
      const pendingAlerts = getMotherAlerts(m).filter((a) => !a.isReviewed).length;
      return unread > 0 || pendingAlerts > 0 || m.riskCategory === 'high';
    }
    return true;
  });

  // Open Chat handler
  const handleOpenChat = async (mother: Mother) => {
    setActiveChatMother(mother);
    await markMessagesAsRead(mother.id);
  };

  // Send message in chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatMother) return;

    await sendMessage(
      chatInputText.trim(),
      'worker',
      worker.id,
      worker.name,
      activeChatMother.id
    );
    setChatInputText('');
  };

  // Quick advice chips in chat
  const handleQuickAdvice = (text: string) => {
    setChatInputText(text);
  };

  // Review alert handler
  const handleAcknowledgeAlert = async (alert: { id: string; sourceUpdateId?: string }) => {
    if (alert.sourceUpdateId) {
      await reviewHealthUpdate(
        alert.sourceUpdateId,
        'Sunita Devi (Health Worker)',
        'Observation reviewed and acknowledged during field follow-up.'
      );
    }
    setLocallyReviewedAlertIds((prev) => [...prev, alert.id]);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMotherName.trim()) return;

    setIsRegistering(true);
    setRegisterError(null);
    try {
      await registerMother({
        name: newMotherName.trim(),
        age: Number(newMotherAge),
        gestationalAgeWeeks: Number(newMotherGestation),
        gestationalAgeDays: Number(newMotherGestation) * 7,
        edd: '25 Feb 2027',
        trimester: newMotherGestation <= 13 ? 1 : newMotherGestation <= 27 ? 2 : 3,
        assignedWorkerId: 'HW-44120',
        assignedWorkerName: 'Sunita Devi',
        village: 'Village Rampur',
        hamlet: newMotherHamlet,
        mcpCardNumber: `MCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        mcpIssuedDate: 'Today',
        phone: newMotherPhone,
        email: `${newMotherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
        riskCategory: 'low',
      });

      setIsRegisterModalOpen(false);
      setNewMotherName('');
      setRegisterError(null);
    } catch (err: any) {
      setRegisterError(
        err.message || 'Firestore write rejected by security rules or network disconnection.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-6 font-sans text-on-surface">
      {/* 1. Header */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
              {t('navPatients')}
            </h1>
            <p className="font-sans text-xs text-secondary mt-0.5">
              {t('activeRegister')}
            </p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-sans text-xs font-semibold flex items-center gap-1 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ {t('registerMother')}</span>
          </button>
        </div>
      </section>

      {/* 2. Top Summary Indicators (Unread Messages & Pending Alerts) */}
      <section className="grid grid-cols-2 gap-2.5">
        {/* Unread Messages Pill */}
        <button
          type="button"
          onClick={() => setFilterTrimester(filterTrimester === 'attention' ? 'all' : 'attention')}
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
            totalUnreadMessages > 0
              ? 'bg-primary-container/10 border-primary-container/40 hover:bg-primary-container/15'
              : 'bg-surface-container border-outline-variant/40 hover:bg-surface-container-high'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            totalUnreadMessages > 0 ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-secondary'
          }`}>
            <span className="material-symbols-outlined text-[18px]">chat</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
              {t('messagesLabel')}
            </span>
            <span className={`text-xs font-bold truncate block ${totalUnreadMessages > 0 ? 'text-primary-container' : 'text-on-surface'}`}>
              {t('unreadMessagesSummary', { count: totalUnreadMessages })}
            </span>
          </div>
        </button>

        {/* Pending Alerts Pill */}
        <button
          type="button"
          onClick={() => setFilterTrimester(filterTrimester === 'attention' ? 'all' : 'attention')}
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
            totalPendingAlerts > 0
              ? 'bg-secondary-container/40 border-secondary-container hover:bg-secondary-container/50'
              : 'bg-surface-container border-outline-variant/40 hover:bg-surface-container-high'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            totalPendingAlerts > 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-secondary'
          }`}>
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
              {t('healthAlertsTitle')}
            </span>
            <span className={`text-xs font-bold truncate block ${totalPendingAlerts > 0 ? 'text-on-surface' : 'text-secondary'}`}>
              {t('pendingAlertsSummary', { count: totalPendingAlerts })}
            </span>
          </div>
        </button>
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="space-y-space-sm">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-3 text-[20px] text-secondary">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container border border-outline-variant font-sans text-xs text-on-surface focus:outline-none focus:border-primary-container"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `${t('filterAll')} (${mothers.length})` },
            { id: 'attention', label: t('filterNeedsAttention', { count: totalUnreadMessages + totalPendingAlerts }) },
            { id: 'high', label: t('filterHighRisk') },
            { id: 't2', label: t('trimester2') },
            { id: 't3', label: t('trimester3') },
            { id: 't1', label: t('trimester1') },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterTrimester(pill.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterTrimester === pill.id
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container text-secondary border border-outline-variant hover:border-primary-container'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Mothers Directory List */}
      <section className="space-y-space-sm">
        {filteredMothers.map((mother) => {
          const motherMsgs = getMotherMessages(mother.id);
          const unreadMsgsCount = getMotherUnreadCount(mother.id);
          const latestMsg = motherMsgs[motherMsgs.length - 1];

          const motherAlerts = getMotherAlerts(mother);
          const pendingAlertsCount = motherAlerts.filter((a) => !a.isReviewed).length;
          const hasHighAlert = motherAlerts.some((a) => a.severity === 'high' && !a.isReviewed);

          return (
            <div
              key={mother.id}
              className={`bg-surface-container rounded-xl p-space-md border shadow-sm flex flex-col space-y-space-sm transition-all ${
                unreadMsgsCount > 0
                  ? 'border-primary-container/60 ring-1 ring-primary-container/30'
                  : 'border-outline-variant/40'
              }`}
            >
              {/* Patient Basic Info Row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-bold text-on-surface">
                      {formatName(mother.name)}
                    </span>
                    {mother.riskCategory === 'high' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        {t('highRisk')}
                      </span>
                    ) : mother.riskCategory === 'medium' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                        {t('moderateRisk')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-secondary">
                        {t('lowRisk')}
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-xs text-secondary block mt-0.5">
                    {formatNumber(`ID: ${mother.id}`)} • {localize('Age')}: {formatNumber(mother.age)} yrs
                  </span>
                  <span className="font-sans text-xs text-secondary flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {formatName(mother.village)}, {formatName(mother.hamlet)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-serif text-sm font-bold text-primary">
                    {t('weekLabel', { num: mother.gestationalAgeWeeks })}
                  </span>
                  <span className="font-sans text-[11px] text-secondary block">
                    {t('eddLabel')}: {formatNumber(mother.edd)}
                  </span>
                </div>
              </div>

              {/* 1. Dedicated Patient-Specific Messages Box */}
              <div
                className={`p-2.5 rounded-xl border space-y-1.5 transition-colors ${
                  unreadMsgsCount > 0
                    ? 'bg-primary-container/10 border-primary-container/40'
                    : 'bg-surface-container-low border-outline-variant/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        unreadMsgsCount > 0 ? 'text-primary-container animate-pulse' : 'text-secondary'
                      }`}
                    >
                      chat
                    </span>
                    <span className={unreadMsgsCount > 0 ? 'text-primary-container' : 'text-on-surface'}>
                      {t('messagesLabel')}
                    </span>
                  </div>

                  {/* Unread Status Badge */}
                  {unreadMsgsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      {t('unreadCountBadge', { count: unreadMsgsCount })}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-secondary">
                      {t('noUnreadBadge')}
                    </span>
                  )}
                </div>

                {/* Latest message preview */}
                {latestMsg ? (
                  <div className="text-[11px] text-secondary leading-snug flex items-baseline justify-between gap-2">
                    <p className="truncate flex-1">
                      <strong className="text-on-surface font-semibold">
                        {latestMsg.senderRole === 'worker' ? `${t('you')}:` : `${formatName(mother.name)}:`}
                      </strong>{' '}
                      {localize(latestMsg.text, latestMsg.translations?.text)}
                    </p>
                    <span className="text-[10px] text-secondary shrink-0">
                      {formatNumber(latestMsg.timestamp)}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-secondary italic">
                    {t('noMessagesYet')}
                  </p>
                )}
              </div>

              {/* 2. Patient-Specific Alert Status Line */}
              {motherAlerts.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`material-symbols-outlined text-[16px] shrink-0 ${
                        hasHighAlert ? 'text-error' : pendingAlertsCount > 0 ? 'text-secondary' : 'text-primary-container'
                      }`}
                    >
                      {hasHighAlert ? 'warning' : 'notification_important'}
                    </span>
                    <span className="text-[11px] font-medium truncate text-on-surface">
                      {pendingAlertsCount > 0
                        ? `${pendingAlertsCount} pending clinical/visit alerts`
                        : `${motherAlerts.length} alerts reviewed`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAlertsMother(mother)}
                    className="text-[11px] font-bold text-primary-container hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    {t('viewAlerts')}
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30">
                {/* Left: Chat & Alerts buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenChat(mother)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer ${
                      unreadMsgsCount > 0
                        ? 'bg-primary-container text-on-primary hover:opacity-95'
                        : 'bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">forum</span>
                    <span>{t('openChat')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAlertsMother(mother)}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-semibold text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    {t('totalAlertsBadge', { count: motherAlerts.length })}
                  </button>
                </div>

                {/* Right: Existing Referral & Assessment Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCreateReferral(mother.id)}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-semibold text-secondary hover:bg-surface-container-high cursor-pointer"
                  >
                    {t('createReferral')}
                  </button>
                  <button
                    onClick={() => onStartNewAssessment(mother.id)}
                    className="px-3 py-1 rounded-lg bg-primary-container text-on-primary text-[11px] font-semibold hover:opacity-95 shadow-sm cursor-pointer"
                  >
                    {t('recordAssessment')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMothers.length === 0 && (
          <div className="text-center py-12 text-secondary font-sans text-xs">
            {t('noPatientsFound')}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. INDIVIDUAL PATIENT CHAT MODAL / INTERFACE                             */}
      {/* ========================================================================= */}
      {activeChatMother && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-variant shadow-2xl flex flex-col h-[88vh] overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 bg-surface-container border-b border-outline-variant/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveChatMother(null)}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
                  aria-label={t('backToPatientsList')}
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-sm font-bold text-on-surface">
                      {formatName(activeChatMother.name)}
                    </span>
                    <span className="text-[10px] text-secondary font-medium">
                      ({formatNumber(activeChatMother.id)})
                    </span>
                  </div>
                  <span className="font-sans text-[10px] text-secondary block">
                    {t('weekLabel', { num: activeChatMother.gestationalAgeWeeks })} • {formatName(activeChatMother.hamlet)} • {t('roleWorker')}: {formatName(worker.name)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveChatMother(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-low">
              {getMotherMessages(activeChatMother.id).map((msg) => {
                const isWorker = msg.senderRole === 'worker';
                const isPending = msg.syncStatus === 'pending_sync' || (msg as any).syncState === 'pending_sync';
                const isFailed = msg.syncStatus === 'failed' || (msg as any).syncState === 'conflict';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isWorker ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-secondary mb-0.5 px-1">
                      {isWorker
                        ? `${formatName(worker.name)} (${t('roleWorker')})`
                        : `${formatName(activeChatMother.name)} (${t('roleMother')})`}
                    </span>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isWorker
                          ? 'bg-primary-container text-on-primary rounded-br-none shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface rounded-bl-none border border-outline-variant/40'
                      }`}
                    >
                      {localize(msg.text, msg.translations?.text)}
                    </div>
                    <div className="text-[10px] text-secondary mt-0.5 px-1 flex items-center gap-1.5">
                      {isFailed ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-900 border border-red-300 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">error</span>
                          {localize('Sync Failed')}
                        </span>
                      ) : !isPending ? (
                        <span className="material-symbols-outlined text-[12px] text-emerald-600">done_all</span>
                      ) : null}
                      <span>{formatNumber(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}

              {getMotherMessages(activeChatMother.id).length === 0 && (
                <div className="text-center py-10 text-secondary text-xs italic">
                  {t('noMessagesYet')}
                </div>
              )}
            </div>

            {/* Quick Response Advice Pills */}
            <div className="px-3 py-2 bg-surface-container border-t border-outline-variant/30 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {[
                'Please rest on your left side with pillows.',
                'Remember to bring your MCP card for checkup.',
                'Are you taking your iron-folic acid tablet daily?',
                'I am scheduling a home visit to check your vitals.',
              ].map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAdvice(localize(pill))}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-container-highest text-on-surface border border-outline-variant/50 hover:border-primary-container shrink-0 cursor-pointer"
                >
                  {localize(pill)}
                </button>
              ))}
            </div>

            {/* Message Composer */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-3 bg-surface border-t border-outline-variant/40 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={t('typeReplyToMother', { name: activeChatMother.name.split(' ')[0] })}
                className="flex-1 h-11 px-3 rounded-xl bg-surface-container border border-outline-variant font-sans text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center hover:opacity-95 shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
                aria-label="Send Message"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PATIENT-SPECIFIC ALERTS MODAL                                         */}
      {/* ========================================================================= */}
      {activeAlertsMother && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-variant shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container border-b border-outline-variant/40 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif text-base font-bold text-on-surface">
                  {t('patientAlertsTitle')}
                </h3>
                <span className="font-sans text-xs text-secondary mt-0.5 block">
                  {activeAlertsMother.name} ({activeAlertsMother.id}) • {activeAlertsMother.hamlet}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlertsMother(null)}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Alerts List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-surface-container-low">
              {getMotherAlerts(activeAlertsMother).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex flex-col space-y-2 bg-surface-container-lowest ${
                    alert.severity === 'high'
                      ? 'border-error/40'
                      : alert.severity === 'moderate'
                      ? 'border-secondary-container'
                      : 'border-outline-variant/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-[16px] shrink-0 ${
                          alert.severity === 'high'
                            ? 'text-error'
                            : alert.severity === 'moderate'
                            ? 'text-secondary'
                            : 'text-primary-container'
                        }`}
                      >
                        {alert.severity === 'high' ? 'warning' : 'info'}
                      </span>
                      <strong className="text-xs font-bold text-on-surface">
                        {alert.title}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          alert.severity === 'high'
                            ? 'bg-error-container text-error'
                            : alert.severity === 'moderate'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-container-high text-secondary'
                        }`}
                      >
                        {alert.severity === 'high'
                          ? t('alertSeverityHigh')
                          : alert.severity === 'moderate'
                          ? t('alertSeverityModerate')
                          : t('alertSeverityRoutine')}
                      </span>

                      {alert.isReviewed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-secondary">
                          {t('alertReviewedStatus')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary">
                          {t('statusPending')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-secondary leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-[11px] text-secondary">
                    <span>{alert.timestamp}</span>

                    {!alert.isReviewed && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeAlert(alert)}
                        className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary text-[11px] font-semibold hover:opacity-95 shadow-2xs cursor-pointer"
                      >
                        {t('markAlertReviewedBtn')}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {getMotherAlerts(activeAlertsMother).length === 0 && (
                <div className="text-center py-8 text-secondary text-xs italic">
                  {t('noAlertsForMother')}
                </div>
              )}

              <p className="text-[11px] text-secondary italic pt-2">
                {t('clinicalNoticeAlert')}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-surface border-t border-outline-variant/40 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const m = activeAlertsMother;
                  setActiveAlertsMother(null);
                  handleOpenChat(m);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-highest cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>{t('openChat')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAlertsMother(null)}
                className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. REGISTER MOTHER MODAL (Preserved)                                      */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl p-space-lg border border-outline-variant shadow-2xl flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <h3 className="font-serif text-lg font-bold text-on-surface">{t('registerMother')}</h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {registerError && (
              <div className="p-3 rounded-lg bg-error-container/80 border border-error/30 text-xs text-error font-medium flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                <div className="flex-1">
                  <p className="font-semibold">{t('persistenceRejection')}:</p>
                  <p className="mt-0.5">{registerError}</p>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/60 flex items-center justify-between">
              <span className="text-[11px] text-secondary font-medium">Demo:</span>
              <button
                type="button"
                onClick={() => {
                  setNewMotherName('[DEMO-TEST] Shanti Devi (Verified Registration)');
                  setNewMotherAge(23);
                  setNewMotherGestation(18);
                  setNewMotherPhone('+91 98765 43210');
                  setNewMotherHamlet('Sector 4 North');
                  setRegisterError(null);
                }}
                className="text-[11px] font-semibold text-primary-container hover:underline cursor-pointer"
              >
                {t('demoRegistrationQuickFill')}
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newMotherName}
                  onChange={(e) => setNewMotherName(e.target.value)}
                  placeholder="e.g. [DEMO-TEST] Shanti Devi"
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                    {t('maternalAge')} *
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={50}
                    value={newMotherAge}
                    onChange={(e) => setNewMotherAge(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                    {t('gestationalWeek')} *
                  </label>
                  <input
                    type="number"
                    required
                    min={4}
                    max={42}
                    value={newMotherGestation}
                    onChange={(e) => setNewMotherGestation(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('phoneNumber')}
                </label>
                <input
                  type="text"
                  value={newMotherPhone}
                  onChange={(e) => setNewMotherPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface block mb-1">
                  {t('villageAddress')} *
                </label>
                <select
                  value={newMotherHamlet}
                  onChange={(e) => setNewMotherHamlet(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-sans text-xs text-on-surface"
                >
                  <option value="Sector 4">Sector 4</option>
                  <option value="Sector 3 East">Sector 3 East</option>
                  <option value="Sector 4 North">Sector 4 North</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 h-11 rounded-lg border border-outline-variant text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRegistering ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{t('save')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
