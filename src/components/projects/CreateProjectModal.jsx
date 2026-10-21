import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api/projectApi';
import { leadApi } from '../../api/leadApi';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  HardHat,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  IndianRupee,
  UserCheck,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState('handover'); // 'handover' | 'standalone'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  // Standalone / Common Form fields
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('RESIDENTIAL');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [approvedBudget, setApprovedBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedCompletionDate, setPlannedCompletionDate] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('452001');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      const future = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(today);
      setPlannedCompletionDate(future);
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setIsLoadingFixtures(true);
      const [leadsRes, empRes] = await Promise.all([
        leadApi.getLeads({ status: 'CONVERTED', limit: 50 }).catch(() => ({ data: [] })),
        employeeApi.getEmployees({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const leadList = Array.isArray(leadsRes?.data) ? leadsRes.data : leadsRes?.data?.leads || [];
      setConvertedLeads(leadList);
      if (leadList.length === 0) {
        setMode('standalone');
      }

      const empList = Array.isArray(empRes?.data) ? empRes.data : empRes?.data?.employees || [];
      setEmployees(empList);
    } catch (err) {
      console.error('Failed to load project modal fixtures', err);
    } finally {
      setIsLoadingFixtures(false);
    }
  };

  const handleLeadSelect = (leadId) => {
    setSelectedLeadId(leadId);
    const lead = convertedLeads.find((l) => l._id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setProjectName(`${lead.clientName} - ${lead.projectType} Project`);
      setProjectType(lead.projectType || 'RESIDENTIAL');
      setClientName(lead.clientName || '');
      setClientPhone(lead.phone || '');
      setClientEmail(lead.email || '');
      setClientCompany(lead.company || '');
      setContractAmount(lead.acceptedAmount ? String(lead.acceptedAmount) : String(lead.budget || ''));
      setApprovedBudget(lead.acceptedAmount ? String(lead.acceptedAmount) : String(lead.budget || ''));
      if (lead.siteAddress) {
        setStreetAddress(lead.siteAddress.street || '');
        setCity(lead.siteAddress.city || 'Indore');
        setState(lead.siteAddress.state || 'Madhya Pradesh');
        setPincode(lead.siteAddress.pincode || '');
      }
      setScopeOfWork(lead.requirements || '');
    } else {
      setSelectedLead(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'handover') {
        if (!selectedLeadId) {
          showToast('Please select a converted lead for handover', 'error');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          name: projectName.trim(),
          projectManager: projectManagerId || undefined,
          startDate: startDate || undefined,
          plannedCompletionDate: plannedCompletionDate || undefined,
          approvedBudget: approvedBudget ? Number(approvedBudget) : undefined,
          priority,
          notes: notes.trim(),
        };

        const res = await projectApi.createFromLead(selectedLeadId, payload);
        showToast(res.message || 'Project created successfully from lead handover!', 'success');
        onSuccess(res.data);
        onClose();
      } else {
        // Standalone Project
        if (!projectName.trim() || !clientName.trim() || !clientPhone.trim()) {
          showToast('Project name, client name and phone are required', 'error');
          setIsSubmitting(false);
          return;
        }

        // Clean phone number (strip spaces/dashes/leading zeros)
        let cleanPhone = clientPhone.trim().replace(/[^\d+]/g, '');
        if (cleanPhone.startsWith('+91')) cleanPhone = cleanPhone.slice(3);
        else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
        else if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);

        const payload = {
          name: projectName.trim(),
          projectType,
          client: {
            name: clientName.trim(),
            phone: cleanPhone || clientPhone.trim(),
            email: clientEmail.trim() || undefined,
            company: clientCompany.trim() || undefined,
            billingAddress: {
              street: streetAddress.trim(),
              city: city.trim(),
              state: state.trim(),
              pincode: pincode.trim(),
              country: 'India',
            },
          },
          contractAmount: Number(contractAmount) || 0,
          approvedBudget: Number(approvedBudget) || Number(contractAmount) || 0,
          startDate,
          plannedCompletionDate,
          projectManager: projectManagerId || undefined,
          siteAddress: {
            street: streetAddress.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            country: 'India',
          },
          scopeOfWork: scopeOfWork.trim(),
          priority,
          notes: notes.trim(),
        };

        const res = await projectApi.createStandalone(payload);
        showToast(res.message || 'Standalone construction project created!', 'success');
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      const msg =
        err?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create project';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-amber-500/10 text-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] tracking-wide">
                Initialize Construction Project
              </h2>
              <p className="text-xs text-slate-400">
                Setup new project code, client contract, handover baseline and site operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex gap-2 p-1.5 mt-5 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('handover')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'handover'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Handover from Converted Lead (CRM)
          </button>
          <button
            type="button"
            onClick={() => setMode('standalone')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              mode === 'standalone'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Standalone Direct Project
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Mode 1: Handover Lead Selector */}
          {mode === 'handover' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 space-y-3">
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Select Converted CRM Lead
              </label>
              {isLoadingFixtures ? (
                <p className="text-xs text-slate-500 animate-pulse">Loading converted leads...</p>
              ) : convertedLeads.length === 0 ? (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No converted leads found awaiting project handover. Create a standalone project instead.</span>
                </div>
              ) : (
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Choose Converted Lead --</option>
                  {convertedLeads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.leadNumber} - {l.clientName} ({l.projectType} • ₹{(l.acceptedAmount || l.budget || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              )}

              {selectedLead && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Client:</span>
                    <span className="text-slate-300 font-semibold">{selectedLead.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact:</span>
                    <span className="text-slate-300">{selectedLead.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contract Award:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      ₹{(selectedLead.acceptedAmount || selectedLead.budget || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Project Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Sunil Agrawal Luxury Villa Residence"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                disabled={mode === 'handover' && !!selectedLead}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-60"
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="RENOVATION">Renovation</option>
                <option value="INTERIOR">Interior</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Client Details (Editable in Standalone mode) */}
          {mode === 'standalone' && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-slate-400">Client Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Kailash Patidar"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Company (Optional)</label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Organization name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Financials & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contract Value (₹)</label>
              <input
                type="number"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                disabled={mode === 'handover'}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-amber-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Approved Budget (₹)</label>
              <input
                type="number"
                value={approvedBudget}
                onChange={(e) => setApprovedBudget(e.target.value)}
                placeholder="Cost allocation"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Completion *</label>
              <input
                type="date"
                value={plannedCompletionDate}
                onChange={(e) => setPlannedCompletionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Assignments & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lead Project Manager</label>
              <select
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Assign Project Manager --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.employeeId} - {emp.fullName || `${emp.name?.firstName} ${emp.name?.lastName}`} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Escalation</option>
              </select>
            </div>
          </div>

          {/* Site Address */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Site Street Address</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Plot / Scheme / Road"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="452xxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Handover Notes & Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key client preferences, special terms, site mobilization notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Initializing Project...</>
              ) : (
                <>
                  <span>Create Project</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
