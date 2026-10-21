import React, { useState, useEffect } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Camera,
  FileText,
  Plus,
  Compass,
} from 'lucide-react';

export const SiteVisitModal = ({ isOpen, onClose, lead, users = [], onUpdated }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('SCHEDULE'); // 'SCHEDULE' | 'COMPLETE' | 'LIST'
  const [selectedVisitId, setSelectedVisitId] = useState('');

  // Schedule Visit state
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    assignedEngineer: '',
    assignedEngineerName: '',
    siteAddress: '',
    constructionRequirements: '',
    notes: '',
  });

  // Complete Visit state
  const [completeData, setCompleteData] = useState({
    observations: '',
    measurements: '',
    constructionRequirements: '',
    photos: '',
    visitReport: '',
    recommendedNextAction: 'PREPARE_ESTIMATE_QUOTATION',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const siteVisits = lead?.siteVisits || [];
  const scheduledVisits = siteVisits.filter((v) => v.status === 'SCHEDULED' || v.status === 'RESCHEDULED');

  useEffect(() => {
    if (lead) {
      setScheduleData({
        scheduledAt: '',
        assignedEngineer: lead.assignedTo?._id || '',
        assignedEngineerName: lead.assignedTo?.name || '',
        siteAddress: lead.siteAddress?.street || lead.city || '',
        constructionRequirements: lead.requirements || '',
        notes: '',
      });

      if (scheduledVisits.length > 0) {
        setSelectedVisitId(scheduledVisits[0].visitNumber);
      } else if (siteVisits.length > 0) {
        setSelectedVisitId(siteVisits[0].visitNumber);
      }
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!scheduleData.scheduledAt) {
      setError('Please select a visit date and time');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedUser = users.find((u) => u._id === scheduleData.assignedEngineer);
      const payload = {
        scheduledAt: new Date(scheduleData.scheduledAt),
        assignedEngineer: scheduleData.assignedEngineer || undefined,
        assignedEngineerName: selectedUser?.name || scheduleData.assignedEngineerName || undefined,
        siteAddress: scheduleData.siteAddress || undefined,
        constructionRequirements: scheduleData.constructionRequirements || undefined,
        notes: scheduleData.notes.trim() || undefined,
      };

      await leadApi.scheduleSiteVisit(lead._id, payload);
      showToast('Site visit scheduled successfully', 'success');
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule site visit';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedVisitId) {
      setError('Please select which site visit you are reporting');
      return;
    }

    if (!completeData.observations.trim()) {
      setError('Please provide site observations');
      return;
    }

    try {
      setIsSubmitting(true);
      const photosArray = completeData.photos
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        observations: completeData.observations.trim(),
        measurements: completeData.measurements.trim() || undefined,
        constructionRequirements: completeData.constructionRequirements.trim() || undefined,
        photos: photosArray.length > 0 ? photosArray : undefined,
        visitReport: completeData.visitReport.trim() || undefined,
        recommendedNextAction: completeData.recommendedNextAction,
      };

      await leadApi.completeSiteVisit(lead._id, selectedVisitId, payload);
      showToast('Site visit inspection report submitted and lead updated', 'success');
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit site visit report';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Site Visit & Inspection
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  {lead.leadNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: <span className="text-slate-200 font-medium">{lead.clientName}</span> • Phone: {lead.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULE')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'SCHEDULE'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule New Visit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETE')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'COMPLETE'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete / Submit Report</span>
          </button>

          {siteVisits.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'LIST'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Visits History ({siteVisits.length})</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: SCHEDULE VISIT */}
          {activeTab === 'SCHEDULE' && (
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Visit Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Site Engineer / Estimator</label>
                  <select
                    value={scheduleData.assignedEngineer}
                    onChange={(e) => {
                      const engId = e.target.value;
                      const u = users.find((x) => x._id === engId);
                      setScheduleData({
                        ...scheduleData,
                        assignedEngineer: engId,
                        assignedEngineerName: u?.name || '',
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Engineer</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Site Address / Landmark</label>
                <input
                  type="text"
                  placeholder="Plot number, colony, scheme, landmark"
                  value={scheduleData.siteAddress}
                  onChange={(e) => setScheduleData({ ...scheduleData, siteAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Construction Scope & Inspection Objectives</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Check plot level, soil type, frontage road width, water/electricity access"
                  value={scheduleData.constructionRequirements}
                  onChange={(e) => setScheduleData({ ...scheduleData, constructionRequirements: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scheduling Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Client requested visit after 4 PM, call 30 mins prior"
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Visit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: COMPLETE VISIT REPORT */}
          {activeTab === 'COMPLETE' && (
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Visit Number *</label>
                {siteVisits.length === 0 ? (
                  <p className="text-amber-400 py-2">
                    No scheduled visit found for this lead. Please schedule a visit first.
                  </p>
                ) : (
                  <select
                    value={selectedVisitId}
                    onChange={(e) => setSelectedVisitId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {siteVisits.map((v) => (
                      <option key={v.visitNumber} value={v.visitNumber}>
                        {v.visitNumber} — Scheduled {new Date(v.scheduledAt).toLocaleDateString('en-IN')} ({v.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Site Observations & Soil Conditions *</label>
                <textarea
                  rows={2}
                  placeholder="Plot topography, soil type (black cotton, murrum, rocky), approach road, sewer line, water table"
                  value={completeData.observations}
                  onChange={(e) => setCompleteData({ ...completeData, observations: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Physical Measurements / Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. Front: 40ft, Depth: 60ft, Total: 2400 sq.ft"
                    value={completeData.measurements}
                    onChange={(e) => setCompleteData({ ...completeData, measurements: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Recommended Next Action</label>
                  <select
                    value={completeData.recommendedNextAction}
                    onChange={(e) => setCompleteData({ ...completeData, recommendedNextAction: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="PREPARE_ESTIMATE_QUOTATION">Prepare BOQ Estimation & Quotation</option>
                    <option value="REVISE_REQUIREMENTS">Revise Architectural Requirements</option>
                    <option value="FOLLOW_UP_REQUIRED">Follow-up with Client First</option>
                    <option value="NOT_FEASIBLE">Not Feasible / Disqualify</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Inspection Summary / Engineering Visit Report</label>
                <textarea
                  rows={2}
                  placeholder="Recommendations for foundation type (e.g. pile foundation, raft), structural grid, setbacks"
                  value={completeData.visitReport}
                  onChange={(e) => setCompleteData({ ...completeData, visitReport: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Photo URLs (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="https://storage.speeddex.com/sites/img1.jpg"
                  value={completeData.photos}
                  onChange={(e) => setCompleteData({ ...completeData, photos: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || siteVisits.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Report...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Visit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: VISITS HISTORY */}
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              {siteVisits.map((v) => (
                <div key={v.visitNumber} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs">{v.visitNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] grid grid-cols-2 gap-2">
                    <div>
                      Scheduled: <span className="text-slate-200">{new Date(v.scheduledAt).toLocaleString('en-IN')}</span>
                    </div>
                    {v.assignedEngineerName && (
                      <div>
                        Engineer: <span className="text-slate-200">{v.assignedEngineerName}</span>
                      </div>
                    )}
                  </div>
                  {v.observations && (
                    <div className="text-slate-300 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-semibold">Observations: </span>
                      {v.observations}
                    </div>
                  )}
                  {v.visitReport && (
                    <div className="text-slate-300 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-semibold">Report: </span>
                      {v.visitReport}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
