
import React, { useState, useEffect, useCallback } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Clock,
  Phone,
  Mail,
  Building2,
  MapPin,
  IndianRupee,
  Calendar,
  Layers,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Compass,
  FileText,
  Lock,
  Plus,
  ArrowRight,
  ShieldAlert,
  Globe,
  Share2,
  Tag,
} from 'lucide-react';

const INTERACTION_TYPES = [
  { id: 'CALL', label: 'Phone Call', icon: Phone },
  { id: 'MEETING', label: 'Office Meeting', icon: Building2 },
  { id: 'SITE_VISIT', label: 'Site Inspection / Survey', icon: Compass },
  { id: 'WHATSAPP', label: 'WhatsApp Chat', icon: MessageSquare },
  { id: 'EMAIL', label: 'Email Follow-up', icon: Mail },
  { id: 'NOTE', label: 'Internal Note', icon: FileText },
];

const EMPTY_FORM = {
  interactionType: 'CALL',
  summary: '',
  status: 'COMPLETED',
  conductedAt: '',
  scheduledAt: '',
  nextFollowUpDate: '',
  nextFollowUpObjective: '',
  clientConnected: true,
  clientRequirements: '',
  objections: '',
  promisedActions: '',
  notes: '',
  outcome: '',
  isPrivateNote: false,
  siteVisitDetails: {
    locationVerified: false,
    siteConditionRemarks: '',
  },
};

const inputClass =
  'w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold text-slate-700';

const cardClass =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';

const subtleCardClass =
  'rounded-xl border border-slate-200 bg-slate-50 p-4';

const formatDate = (value, options = {}) => {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...options,
  });
};

const formatInr = (amount) => {
  if (amount === undefined || amount === null || amount === '') {
    return 'N/A';
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return 'N/A';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const displayText = (value, fallback = 'N/A') => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return String(value);
};

const normaliseStatus = (value) =>
  displayText(value, 'N/A').replace(/_/g, ' ');

const getDateTimeLocal = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
};

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.message ||
  fallback;

const getLeadPayload = (response) => {
  const data = response?.data ?? response;

  if (data?.lead) return data.lead;

  return data;
};

const getTimelinePayload = (response) => {
  const data = response?.data ?? response;

  if (data?.timeline) return data.timeline;

  return data;
};

const SectionTitle = ({ children, count }) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
      {children}
    </h4>

    {count !== undefined && (
      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
        {count}
      </span>
    )}
  </div>
);

const EmptyState = ({ icon: Icon = FileText, title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
    <Icon className="mx-auto mb-3 h-9 w-9 text-slate-400" />

    <p className="text-sm font-semibold text-slate-800">{title}</p>

    {description && (
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-600">
        {description}
      </p>
    )}

    {action}
  </div>
);

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const InfoBlock = ({ title, children, tone = 'slate' }) => {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
    blue: 'border-sky-200 bg-sky-50 text-sky-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
  };

  const headingTones = {
    slate: 'text-slate-600',
    blue: 'text-sky-800',
    rose: 'text-rose-800',
    green: 'text-emerald-800',
    amber: 'text-amber-800',
  };

  return (
    <div
      className={`rounded-xl border p-3 text-sm leading-6 ${tones[tone] || tones.slate
        }`}
    >
      <p
        className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${headingTones[tone] || headingTones.slate
          }`}
      >
        {title}
      </p>

      <p className="whitespace-pre-wrap break-words">{children}</p>
    </div>
  );
};

export const LeadTimelineModal = ({
  isOpen,
  onClose,
  lead,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('interactions');

  const [timelineData, setTimelineData] = useState({
    followUps: [],
    statusHistory: [],
    lead: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] =
    useState(false);

  const [followUpForm, setFollowUpForm] = useState(() => ({
    ...EMPTY_FORM,
    conductedAt: getDateTimeLocal(),
  }));

  const updateForm = (field, value) => {
    setFollowUpForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSiteVisit = (field, value) => {
    setFollowUpForm((prev) => ({
      ...prev,
      siteVisitDetails: {
        ...prev.siteVisitDetails,
        [field]: value,
      },
    }));
  };

  const loadTimeline = useCallback(async () => {
    if (!lead?._id) return;

    try {
      setIsLoading(true);
      setError('');

      const [timelineResponse, leadResponse] = await Promise.all([
        leadApi.getLeadTimeline(lead._id),
        leadApi.getLeadById(lead._id).catch(() => null),
      ]);

      const payload = getTimelinePayload(timelineResponse);
      const populatedLead =
        getLeadPayload(leadResponse) ||
        payload?.lead ||
        lead;

      const followUps = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.followUps)
          ? payload.followUps
          : [];

      const statusHistory = Array.isArray(populatedLead?.statusHistory)
        ? populatedLead.statusHistory
        : Array.isArray(payload?.statusHistory)
          ? payload.statusHistory
          : [];

      setTimelineData({
        lead: populatedLead || lead,
        followUps,
        statusHistory,
      });
    } catch (err) {
      setError(
        getErrorMessage(err, 'Failed to load lead timeline.')
      );
    } finally {
      setIsLoading(false);
    }
  }, [lead]);

  useEffect(() => {
    if (!isOpen || !lead?._id) return;

    loadTimeline();
  }, [isOpen, lead?._id, loadTimeline]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isSubmittingFollowUp) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmittingFollowUp, onClose]);

  const handleLogFollowUp = async (event) => {
    event.preventDefault();

    if (!lead?._id) {
      showToast('Lead information is missing.', 'error');
      return;
    }

    if (!followUpForm.summary.trim()) {
      showToast('Interaction summary is required.', 'error');
      return;
    }

    if (
      followUpForm.status === 'SCHEDULED' &&
      !followUpForm.scheduledAt
    ) {
      showToast('Please select the scheduled date and time.', 'error');
      return;
    }

    if (
      followUpForm.nextFollowUpDate &&
      followUpForm.nextFollowUpDate <
      new Date().toLocaleDateString('en-CA')
    ) {
      showToast('Next follow-up date cannot be in the past.', 'error');
      return;
    }

    try {
      setIsSubmittingFollowUp(true);

      const payload = {
        interactionType: followUpForm.interactionType,
        summary: followUpForm.summary.trim(),
        status: followUpForm.status,
        clientConnected: Boolean(followUpForm.clientConnected),
        clientRequirements:
          followUpForm.clientRequirements.trim() || undefined,
        objections: followUpForm.objections.trim() || undefined,
        promisedActions:
          followUpForm.promisedActions.trim() || undefined,
        nextFollowUpObjective:
          followUpForm.nextFollowUpObjective.trim() || undefined,
        notes: followUpForm.notes.trim() || undefined,
        outcome: followUpForm.outcome.trim() || undefined,
        isPrivateNote: followUpForm.isPrivateNote,
        nextFollowUpDate:
          followUpForm.nextFollowUpDate || undefined,
      };

      if (followUpForm.status === 'SCHEDULED') {
        payload.scheduledAt = new Date(
          followUpForm.scheduledAt
        ).toISOString();
      } else {
        payload.conductedAt = followUpForm.conductedAt
          ? new Date(followUpForm.conductedAt).toISOString()
          : new Date().toISOString();
      }

      if (followUpForm.interactionType === 'SITE_VISIT') {
        payload.siteVisitDetails = {
          locationVerified:
            followUpForm.siteVisitDetails.locationVerified,
          siteConditionRemarks:
            followUpForm.siteVisitDetails.siteConditionRemarks.trim() ||
            undefined,
        };
      }

      await leadApi.logFollowUp(lead._id, payload);

      showToast('Follow-up logged successfully.', 'success');

      setFollowUpForm({
        ...EMPTY_FORM,
        conductedAt: getDateTimeLocal(),
      });

      setActiveTab('interactions');

      await loadTimeline();

      onUpdated?.();
    } catch (err) {
      showToast(
        getErrorMessage(err, 'Failed to follow-up.'),
        'error'
      );
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  if (!isOpen || !lead) return null;

  const currentLead = timelineData.lead || lead;

  const tabs = [
    {
      id: 'interactions',
      label: 'Interactions',
      icon: MessageSquare,
      count: timelineData.followUps.length,
    },
    {
      id: 'statusHistory',
      label: 'Status History',
      icon: Clock,
      count: timelineData.statusHistory.length,
    },
    {
      id: 'assignmentHistory',
      label: 'Assignments',
      icon: UserCheck,
      count: currentLead.assignmentHistory?.length || 0,
    },
    {
      id: 'logFollowUp',
      label: 'Follow-up Interaction',
      icon: Plus,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmittingFollowUp
        ) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-timeline-title"
        className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-[10px] font-bold text-amber-800">
                  {displayText(currentLead.leadNumber, 'LEAD')}
                </span>

                <h3
                  id="lead-timeline-title"
                  className="truncate text-base font-bold text-slate-950 sm:text-lg"
                >
                  {displayText(currentLead.clientName, 'Lead Timeline')}
                </h3>
              </div>

              <p className="mt-1 text-xs text-slate-600">
                {normaliseStatus(currentLead.projectType)} {' • '}
                {displayText(currentLead.city, 'Indore')} {' • '}
                Budget: {formatInr(currentLead.budget)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingFollowUp}
            aria-label="Close lead timeline"
            className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lead Summary */}
        <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-4 sm:px-6">
          <div className="min-w-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Contact
            </span>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="break-words">
                {displayText(currentLead.phone)}
              </span>
            </div>

            {currentLead.email && (
              <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-all">{currentLead.email}</span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Site Location
            </span>

            <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-900">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <span className="break-words">
                {currentLead.siteAddress?.street ||
                  currentLead.city ||
                  'Indore, MP'}
              </span>
            </div>

            <span className="mt-1 block text-xs text-slate-600">
              {currentLead.estimatedAreaSqFt
                ? `${Number(
                  currentLead.estimatedAreaSqFt
                ).toLocaleString('en-IN')} sq.ft.`
                : 'Area TBD'}
            </span>
          </div>

          <div className="min-w-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Lead Status
            </span>

            <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              {normaliseStatus(currentLead.status)}
            </span>
          </div>

          <div className="min-w-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Assigned Representative
            </span>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <UserCheck className="h-4 w-4 shrink-0 text-slate-500" />

              <span className="break-words">
                {currentLead.assignedTo?.name || 'Unassigned'}
              </span>
            </div>

            {currentLead.nextFollowUpDate && (
              <span className="mt-1 block text-xs font-medium text-amber-800">
                Next: {formatDate(currentLead.nextFollowUpDate)}
              </span>
            )}
          </div>
        </div>

        {/* Responsive Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-3 sm:px-5">
          <div className="flex min-w-max items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition sm:px-4 ${isActive
                    ? 'border-amber-500 bg-amber-50/60 text-amber-800'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>

                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${isActive
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6">
          {isLoading && (
            <div className="flex min-h-48 flex-col items-center justify-center text-slate-600">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-600" />
              <p className="text-sm font-medium">
                Loading lead timeline...
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="flex-1">
                <p className="font-semibold">Unable to load timeline</p>
                <p className="mt-1 break-words">{error}</p>

                <button
                  type="button"
                  onClick={loadTimeline}
                  className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Interactions */}
              {activeTab === 'interactions' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <SectionTitle count={timelineData.followUps.length}>
                      Interaction Chronology
                    </SectionTitle>

                    <button
                      type="button"
                      onClick={() => setActiveTab('logFollowUp')}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
                    >
                      <Plus className="h-4 w-4" />
                      Follow-up
                    </button>
                  </div>

                  {timelineData.followUps.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No interactions recorded yet"
                      description="Record calls, meetings, client conversations or site inspections to build the lead history."
                      action={
                        <button
                          type="button"
                          onClick={() => setActiveTab('logFollowUp')}
                          className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                        >
                          Record First Interaction
                        </button>
                      }
                    />
                  ) : (
                    <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-slate-200">
                      {timelineData.followUps.map((item, index) => {
                        const isSiteVisit =
                          item.interactionType === 'SITE_VISIT';

                        const interaction = INTERACTION_TYPES.find(
                          (type) => type.id === item.interactionType
                        );

                        const InteractionIcon =
                          interaction?.icon || MessageSquare;

                        return (
                          <div
                            key={item._id || `${item.createdAt}-${index}`}
                            className="relative pl-9"
                          >
                            <div className="absolute left-[7px] top-4 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-amber-500 bg-white">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            </div>

                            <div className={`${cardClass} space-y-3`}>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                                    <InteractionIcon className="h-3.5 w-3.5" />
                                    {normaliseStatus(item.interactionType)}
                                  </span>

                                  {item.status && (
                                    <span
                                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${item.status === 'SCHEDULED'
                                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        }`}
                                    >
                                      {normaliseStatus(item.status)}
                                    </span>
                                  )}

                                  {item.clientConnected !== undefined &&
                                    item.clientConnected !== null && (
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold ${item.clientConnected
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                          : 'border-rose-200 bg-rose-50 text-rose-800'
                                          }`}
                                      >
                                        {item.clientConnected ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <Phone className="h-3 w-3" />
                                        )}

                                        {item.clientConnected
                                          ? 'Connected'
                                          : 'Not Connected'}
                                      </span>
                                    )}

                                  {item.isPrivateNote && (
                                    <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800">
                                      <Lock className="h-3 w-3" />
                                      Private
                                    </span>
                                  )}
                                </div>

                                <span className="text-xs text-slate-500">
                                  {formatDate(
                                    item.status === 'SCHEDULED'
                                      ? item.scheduledAt ||
                                      item.createdAt
                                      : item.conductedAt ||
                                      item.createdAt,
                                    {
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                </span>
                              </div>

                              <h5 className="break-words text-sm font-bold leading-6 text-slate-950">
                                {displayText(item.summary, 'Interaction')}
                              </h5>

                              {item.notes && (
                                <InfoBlock title="Discussion Notes">
                                  {item.notes}
                                </InfoBlock>
                              )}

                              {item.clientRequirements && (
                                <InfoBlock
                                  title="Client Requirements & Scope"
                                  tone="blue"
                                >
                                  {item.clientRequirements}
                                </InfoBlock>
                              )}

                              {item.objections && (
                                <InfoBlock
                                  title="Client Objections / Concerns"
                                  tone="rose"
                                >
                                  {item.objections}
                                </InfoBlock>
                              )}

                              {item.promisedActions && (
                                <InfoBlock
                                  title="Promised Actions & Documents"
                                  tone="green"
                                >
                                  {item.promisedActions}
                                </InfoBlock>
                              )}

                              {item.outcome && (
                                <div className="text-sm leading-6 text-slate-700">
                                  <span className="font-bold text-slate-900">
                                    Outcome:{' '}
                                  </span>
                                  <span className="break-words">
                                    {item.outcome}
                                  </span>
                                </div>
                              )}

                              {item.nextFollowUpObjective && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                                  <span className="font-bold">
                                    Next Objective:{' '}
                                  </span>
                                  {item.nextFollowUpObjective}
                                </div>
                              )}

                              {isSiteVisit && item.siteVisitDetails && (
                                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-amber-950">
                                    <Compass className="h-4 w-4" />
                                    Site Survey Details

                                    {item.siteVisitDetails.locationVerified && (
                                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800">
                                        Location Verified
                                      </span>
                                    )}
                                  </div>

                                  {item.siteVisitDetails.siteConditionRemarks && (
                                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                      {item.siteVisitDetails.siteConditionRemarks}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>
                                  Logged by:{' '}
                                  <span className="font-semibold text-slate-700">
                                    {item.performedBy?.name || 'Staff'}
                                  </span>
                                </span>

                                {item.nextFollowUpDate && (
                                  <span className="font-semibold text-amber-800">
                                    Next Follow-up:{' '}
                                    {formatDate(item.nextFollowUpDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Status History */}
              {activeTab === 'statusHistory' && (
                <div className="space-y-5">
                  <SectionTitle count={timelineData.statusHistory.length}>
                    Status Transition Audit
                  </SectionTitle>

                  {timelineData.statusHistory.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="No status changes recorded"
                      description="Status transitions will appear here when changes are recorded by your CRM."
                    />
                  ) : (
                    <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-slate-200">
                      {timelineData.statusHistory.map((item, index) => (
                        <div
                          key={item._id || `${item.changedAt}-${index}`}
                          className="relative pl-9"
                        >
                          <div className="absolute left-[7px] top-4 z-10 h-[18px] w-[18px] rounded-full border-2 border-amber-500 bg-white" />

                          <div className={`${cardClass} space-y-3`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700">
                                  {displayText(item.fromStatus, 'START')}
                                </span>

                                <ArrowRight className="h-4 w-4 text-amber-600" />

                                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-mono text-xs font-bold text-amber-900">
                                  {displayText(item.toStatus)}
                                </span>
                              </div>

                              <span className="text-xs text-slate-500">
                                {formatDate(item.changedAt, {
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {item.remarks && (
                              <InfoBlock title="Remarks">
                                {item.remarks}
                              </InfoBlock>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                              <span>
                                Updated by:{' '}
                                <span className="font-semibold text-slate-800">
                                  {item.changedBy?.name || 'System / Admin'}
                                </span>
                              </span>

                              {item.lossReason && (
                                <span className="font-semibold text-rose-800">
                                  Loss Reason: {item.lossReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Assignment History */}
              {activeTab === 'assignmentHistory' && (
                <div className="space-y-5">
                  <SectionTitle>
                    Assignment & Intake History
                  </SectionTitle>

                  <div className={`${subtleCardClass} space-y-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {currentLead.isWebsiteLead ? (
                          <Globe className="h-5 w-5 shrink-0 text-violet-700" />
                        ) : (
                          <Building2 className="h-5 w-5 shrink-0 text-amber-700" />
                        )}

                        <div>
                          <h5 className="text-sm font-bold text-slate-900">
                            {currentLead.isWebsiteLead
                              ? 'Website Inbound Lead'
                              : 'Internal CRM Lead'}
                          </h5>

                          <p className="mt-1 text-xs text-slate-600">
                            {currentLead.isWebsiteLead
                              ? 'Lead received through the website'
                              : 'Lead entered directly into the CRM'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${currentLead.isWebsiteLead
                          ? 'border-violet-200 bg-violet-50 text-violet-800'
                          : 'border-slate-200 bg-white text-slate-700'
                          }`}
                      >
                        {currentLead.isWebsiteLead
                          ? 'WEBSITE'
                          : 'DIRECT ENTRY'}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Lead Created
                      </span>

                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDate(currentLead.createdAt, {
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {currentLead.isWebsiteLead &&
                      currentLead.websiteMetadata && (
                        <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                          {[
                            {
                              label: 'UTM Source',
                              value:
                                currentLead.websiteMetadata.utmSource ||
                                'Direct Traffic',
                            },
                            {
                              label: 'UTM Medium / Campaign',
                              value: [
                                currentLead.websiteMetadata.utmMedium ||
                                'Website',
                                currentLead.websiteMetadata.utmCampaign,
                              ]
                                .filter(Boolean)
                                .join(' / '),
                            },
                            {
                              label: 'Landing Page URL',
                              value:
                                currentLead.websiteMetadata.pageUrl || '/',
                            },
                            {
                              label: 'HTTP Referrer',
                              value:
                                currentLead.websiteMetadata.referrer ||
                                'Direct / None',
                            },
                          ].map((item) => (
                            <div key={item.label} className="min-w-0">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {item.label}
                              </span>

                              <p className="mt-1 break-all text-xs leading-5 text-slate-800">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className={`${cardClass} space-y-3`}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-700" />

                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Current Representative
                        </span>

                        <p className="mt-1 break-words text-sm font-bold text-slate-900">
                          {currentLead.assignedTo?.name || 'Unassigned'}
                        </p>

                        {currentLead.assignedTo?.email && (
                          <p className="mt-1 break-all text-xs text-slate-600">
                            {currentLead.assignedTo.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Assignment Method
                      </span>

                      <span className="mt-1 inline-flex rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-900">
                        {normaliseStatus(
                          currentLead.assignmentType ||
                          'MANUAL ASSIGNMENT'
                        )}
                      </span>
                    </div>
                  </div>

                  <SectionTitle
                    count={currentLead.assignmentHistory?.length || 0}
                  >
                    Assignment Audit Trail
                  </SectionTitle>

                  {!currentLead.assignmentHistory?.length ? (
                    <EmptyState
                      icon={UserCheck}
                      title="No ownership transfers recorded"
                      description="Assignment and reassignment events will appear here when they are available in the lead record."
                    />
                  ) : (
                    <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-slate-200">
                      {currentLead.assignmentHistory.map(
                        (item, index) => (
                          <div
                            key={
                              item._id ||
                              `${item.assignedAt}-${index}`
                            }
                            className="relative pl-9"
                          >
                            <div className="absolute left-[7px] top-4 z-10 h-[18px] w-[18px] rounded-full border-2 border-cyan-600 bg-white" />

                            <div className={`${cardClass} space-y-3`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                  {item.fromUser?.name ||
                                    'Initial Allocation'}
                                </span>

                                <ArrowRight className="h-4 w-4 text-cyan-700" />

                                <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-900">
                                  {item.toUser?.name || 'Unassigned'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500">
                                {formatDate(item.assignedAt, {
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700">
                                  Type:{' '}
                                  {normaliseStatus(item.assignmentType)}
                                </span>

                                {item.isOverride && (
                                  <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900">
                                    <ShieldAlert className="h-3 w-3" />
                                    Manager Override
                                  </span>
                                )}
                              </div>

                              {item.reason && (
                                <InfoBlock title="Assignment Reason">
                                  {item.reason}
                                </InfoBlock>
                              )}

                              <div className="border-t border-slate-100 pt-3 text-xs text-slate-600">
                                Assigned by:{' '}
                                <span className="font-semibold text-slate-800">
                                  {item.assignedBy?.name ||
                                    'Automated Distribution Engine'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Log Interaction Form */}
              {activeTab === 'logFollowUp' && (
                <form
                  onSubmit={handleLogFollowUp}
                  className="mx-auto max-w-3xl space-y-5"
                >
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="rounded-lg bg-white p-2 text-amber-800 shadow-sm">
                      <Plus className="h-5 w-5" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-950">
                        Record Client Interaction
                      </h4>

                      <p className="mt-1 text-xs leading-5 text-slate-700">
                        Save conversation details, client requirements,
                        agreed actions and the next follow-up reminder.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Interaction Type *">
                      <select
                        required
                        value={followUpForm.interactionType}
                        onChange={(event) =>
                          updateForm(
                            'interactionType',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      >
                        {INTERACTION_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Execution Status *">
                      <select
                        required
                        value={followUpForm.status}
                        onChange={(event) =>
                          updateForm('status', event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="COMPLETED">
                          Completed — Action Performed
                        </option>
                        <option value="SCHEDULED">
                          Scheduled — Upcoming Activity
                        </option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Summary / Headline *">
                    <input
                      type="text"
                      required
                      maxLength={500}
                      value={followUpForm.summary}
                      onChange={(event) =>
                        updateForm('summary', event.target.value)
                      }
                      placeholder="e.g. Discussed foundation depth and floor plan with client"
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Client Reachability *">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          aria-pressed={followUpForm.clientConnected}
                          onClick={() =>
                            updateForm('clientConnected', true)
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition ${followUpForm.clientConnected
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Connected
                        </button>

                        <button
                          type="button"
                          aria-pressed={!followUpForm.clientConnected}
                          onClick={() =>
                            updateForm('clientConnected', false)
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition ${!followUpForm.clientConnected
                            ? 'border-rose-300 bg-rose-50 text-rose-900 ring-2 ring-rose-100'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          <Phone className="h-4 w-4" />
                          Not Connected
                        </button>
                      </div>
                    </Field>

                    <Field
                      label={
                        followUpForm.status === 'SCHEDULED'
                          ? 'Scheduled Date & Time *'
                          : 'Conducted At'
                      }
                    >
                      <input
                        type="datetime-local"
                        required={followUpForm.status === 'SCHEDULED'}
                        value={
                          followUpForm.status === 'SCHEDULED'
                            ? followUpForm.scheduledAt
                            : followUpForm.conductedAt
                        }
                        onChange={(event) =>
                          updateForm(
                            followUpForm.status === 'SCHEDULED'
                              ? 'scheduledAt'
                              : 'conductedAt',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Next Follow-up Reminder Date">
                      <input
                        type="date"
                        value={followUpForm.nextFollowUpDate}
                        onChange={(event) =>
                          updateForm(
                            'nextFollowUpDate',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Next Follow-up Objective">
                      <input
                        type="text"
                        maxLength={500}
                        value={followUpForm.nextFollowUpObjective}
                        onChange={(event) =>
                          updateForm(
                            'nextFollowUpObjective',
                            event.target.value
                          )
                        }
                        placeholder="e.g. Present revised BOQ and discuss advance payment"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Client Requirements / Specifications">
                      <textarea
                        rows={3}
                        maxLength={5000}
                        value={followUpForm.clientRequirements}
                        onChange={(event) =>
                          updateForm(
                            'clientRequirements',
                            event.target.value
                          )
                        }
                        placeholder="e.g. Residential building, 3 floors, 2400 sq ft..."
                        className={`${inputClass} resize-y`}
                      />
                    </Field>

                    <Field label="Objections / Questions / Concerns">
                      <textarea
                        rows={3}
                        maxLength={5000}
                        value={followUpForm.objections}
                        onChange={(event) =>
                          updateForm('objections', event.target.value)
                        }
                        placeholder="e.g. Budget constraints or material concerns..."
                        className={`${inputClass} resize-y`}
                      />
                    </Field>
                  </div>

                  <Field label="Promised Documents / Next Deliverables">
                    <textarea
                      rows={2}
                      maxLength={5000}
                      value={followUpForm.promisedActions}
                      onChange={(event) =>
                        updateForm(
                          'promisedActions',
                          event.target.value
                        )
                      }
                      placeholder="e.g. Send drawings, BOQ or quotation by Friday"
                      className={`${inputClass} resize-y`}
                    />
                  </Field>

                  {followUpForm.interactionType === 'SITE_VISIT' && (
                    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                        <Compass className="h-5 w-5" />
                        Site Inspection Assessment
                      </div>

                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          checked={
                            followUpForm.siteVisitDetails.locationVerified
                          }
                          onChange={(event) =>
                            updateSiteVisit(
                              'locationVerified',
                              event.target.checked
                            )
                          }
                          className="mt-0.5 h-4 w-4 accent-amber-600"
                        />

                        <span>
                          <span className="block font-semibold">
                            Verify site location
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">
                            Confirm plot boundaries and location on the
                            ground.
                          </span>
                        </span>
                      </label>

                      <Field label="Soil / Approach Road / Site Condition">
                        <textarea
                          rows={3}
                          maxLength={5000}
                          value={
                            followUpForm.siteVisitDetails
                              .siteConditionRemarks
                          }
                          onChange={(event) =>
                            updateSiteVisit(
                              'siteConditionRemarks',
                              event.target.value
                            )
                          }
                          placeholder="e.g. Soil condition, approach road width, utilities and site observations..."
                          className={`${inputClass} resize-y`}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label="Detailed Discussion Notes">
                    <textarea
                      rows={4}
                      maxLength={10000}
                      value={followUpForm.notes}
                      onChange={(event) =>
                        updateForm('notes', event.target.value)
                      }
                      placeholder="Enter detailed discussion points, questions, requirements and important observations..."
                      className={`${inputClass} resize-y`}
                    />
                  </Field>

                  <Field label="Outcome / Agreed Action Item">
                    <input
                      type="text"
                      maxLength={1000}
                      value={followUpForm.outcome}
                      onChange={(event) =>
                        updateForm('outcome', event.target.value)
                      }
                      placeholder="e.g. Client requested a revised quotation before Tuesday"
                      className={inputClass}
                    />
                  </Field>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      checked={followUpForm.isPrivateNote}
                      onChange={(event) =>
                        updateForm(
                          'isPrivateNote',
                          event.target.checked
                        )
                      }
                      className="mt-0.5 h-4 w-4 accent-amber-600"
                    />

                    <span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Lock className="h-4 w-4 text-slate-600" />
                        Internal private note
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        Mark this record as private. Actual visibility
                        restrictions must also be enforced by your backend.
                      </span>
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      disabled={isSubmittingFollowUp}
                      onClick={() => setActiveTab('interactions')}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingFollowUp}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingFollowUp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Record...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Follow-up
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadTimelineModal;
