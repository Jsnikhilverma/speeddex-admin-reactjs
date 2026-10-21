
import React, { useEffect, useState } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  Target,
  X,
  AlertCircle,
  Loader2,
  Check,
  UserCheck,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PROJECT_TYPES = [
  { id: 'RESIDENTIAL', label: 'Residential Construction (Villa / Duplex / Apartments)' },
  { id: 'COMMERCIAL', label: 'Commercial Complex / Retail Showroom' },
  { id: 'INDUSTRIAL', label: 'Industrial Shed & Warehouse Infra' },
  { id: 'RENOVATION', label: 'Structural Renovation & Extension' },
  { id: 'INTERIOR', label: 'Turnkey Architectural Interior Finishing' },
  { id: 'INFRASTRUCTURE', label: 'Roads, Drainage & Site Development' },
  { id: 'OTHER', label: 'Other Construction Works' },
];

const LEAD_SOURCES = [
  { id: 'DIRECT_CALL', label: 'Direct Phone Call' },
  { id: 'WEBSITE', label: 'Website Inbound Portal' },
  { id: 'REFERRAL', label: 'Client / Architect Referral' },
  { id: 'WALK_IN', label: 'Indore Corporate Office Walk-in' },
  { id: 'EXPO', label: 'Property & Building Material Expo' },
  { id: 'SOCIAL_MEDIA', label: 'Social Media / Digital Ads' },
  { id: 'CHANNEL_PARTNER', label: 'Channel Partner / Broker' },
  { id: 'SITE_BANNER', label: 'On-site Project Banner' },
  { id: 'OTHER', label: 'Other Source' },
];

const createInitialForm = () => ({
  clientName: '',
  phone: '',
  email: '',
  company: '',
  projectType: 'RESIDENTIAL',
  siteAddress: {
    street: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '',
  },
  city: 'Indore',
  budget: '',
  estimatedAreaSqFt: '',
  leadSource: 'DIRECT_CALL',
  requirements: '',
  assignedTo: '',
  nextFollowUpDate: '',
});

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  'Failed to create lead. Please try again.';

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toLocalDateISO = (value) => {
  if (!value) return undefined;

  const [year, month, day] = value.split('-').map(Number);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
};

export const CreateLeadModal = ({
  isOpen,
  onClose,
  onCreated,
  salesUsers = [],
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const isSalesPerson = user?.role === 'SALES';
  const currentUserId = user?._id || user?.id || '';

  const [formData, setFormData] = useState(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setFormData(createInitialForm());
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError('');
  };

  const updateSiteAddress = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      siteAddress: {
        ...previous.siteAddress,
        [field]: value,
      },
    }));

    setError('');
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setError('');
    onClose?.();
  };

  const validateForm = () => {
    const clientName = formData.clientName.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    const pincode = formData.siteAddress.pincode.trim();

    if (!clientName) {
      return 'Client name is required.';
    }

    if (clientName.length < 2) {
      return 'Client name must contain at least 2 characters.';
    }

    if (clientName.length > 120) {
      return 'Client name cannot exceed 120 characters.';
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }

    if (email.length > 254) {
      return 'Email address is too long.';
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return 'Pincode must contain exactly 6 digits.';
    }

    if (
      formData.budget.trim() !== '' &&
      (!Number.isFinite(Number(formData.budget)) ||
        Number(formData.budget) < 0)
    ) {
      return 'Please enter a valid non-negative budget.';
    }

    if (
      formData.estimatedAreaSqFt.trim() !== '' &&
      (!Number.isFinite(Number(formData.estimatedAreaSqFt)) ||
        Number(formData.estimatedAreaSqFt) < 0)
    ) {
      return 'Please enter a valid construction area.';
    }

    if (
      formData.budget.trim() !== '' &&
      Number(formData.budget) > Number.MAX_SAFE_INTEGER
    ) {
      return 'Budget is too large. Please verify the amount.';
    }

    if (
      formData.estimatedAreaSqFt.trim() !== '' &&
      Number(formData.estimatedAreaSqFt) > Number.MAX_SAFE_INTEGER
    ) {
      return 'Construction area is too large. Please verify the value.';
    }

    if (isSalesPerson && !currentUserId) {
      return 'Your user ID could not be identified. Please log in again.';
    }

    if (
      formData.nextFollowUpDate &&
      !toLocalDateISO(formData.nextFollowUpDate)
    ) {
      return 'Please select a valid follow-up date.';
    }

    if (
      formData.nextFollowUpDate &&
      formData.nextFollowUpDate < getLocalDateString()
    ) {
      return 'Initial follow-up date cannot be in the past.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const followUpISO = toLocalDateISO(formData.nextFollowUpDate);

    if (followUpISO === null) {
      setError('Please select a valid follow-up date.');
      return;
    }

    const payload = {
      clientName: formData.clientName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase() || undefined,
      company: formData.company.trim() || undefined,
      projectType: formData.projectType,

      siteAddress: {
        street: formData.siteAddress.street.trim(),
        city: formData.siteAddress.city.trim() || 'Indore',
        state: formData.siteAddress.state.trim() || 'Madhya Pradesh',
        pincode: formData.siteAddress.pincode.trim() || undefined,
      },

      city: formData.city.trim() || 'Indore',

      budget:
        formData.budget.trim() === ''
          ? 0
          : Number(formData.budget),

      estimatedAreaSqFt:
        formData.estimatedAreaSqFt.trim() === ''
          ? 0
          : Number(formData.estimatedAreaSqFt),

      leadSource: formData.leadSource,
      requirements: formData.requirements.trim() || undefined,

      // Sales users always create leads assigned to themselves.
      // Other authorized users can choose a salesperson or use round-robin.
      assignedTo: isSalesPerson
        ? currentUserId
        : formData.assignedTo || undefined,

      nextFollowUpDate: followUpISO || undefined,
    };

    setIsSubmitting(true);

    try {
      const response = await leadApi.createLead(payload);

      showToast(
        response?.message || 'Lead created successfully.',
        'success'
      );
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);
      showToast(message, 'error');
      setIsSubmitting(false);
      return;
    }

    // The API has created the lead successfully.
    setIsSubmitting(false);
    onClose?.();

    // A refresh failure should not be treated as lead creation failure.
    if (typeof onCreated === 'function') {
      try {
        await onCreated();
      } catch {
        showToast(
          'Lead was created, but the list could not refresh. Please refresh the page.',
          'error'
        );
      }
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-60';

  const labelClass =
    'block text-xs font-semibold text-slate-300 mb-1.5';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-lead-title"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-7 max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0">
              <h2
                id="create-lead-title"
                className="text-lg font-bold text-white"
              >
                New Construction Lead
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                Add an inquiry to the Speeddex sales pipeline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto pr-1 py-4 space-y-5"
        >
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Client Details */}
          <section>
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Client Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="lead-client-name" className={labelClass}>
                  Client / Contact Name <span className="text-amber-400">*</span>
                </label>

                <input
                  id="lead-client-name"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={formData.clientName}
                  onChange={(event) =>
                    updateField('clientName', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. Shri Rajesh Agrawal"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lead-phone" className={labelClass}>
                  Mobile Number <span className="text-amber-400">*</span>
                </label>

                <input
                  id="lead-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  required
                  value={formData.phone}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value.replace(/\D/g, '').slice(0, 10)
                    )
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. 9826012345"
                  className={`${inputClass} font-mono`}
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Enter a 10-digit Indian mobile number.
                </p>
              </div>

              <div>
                <label htmlFor="lead-email" className={labelClass}>
                  Email Address <span className="text-slate-500">(Optional)</span>
                </label>

                <input
                  id="lead-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={formData.email}
                  onChange={(event) =>
                    updateField('email', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="rajesh.agrawal@gmail.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lead-company" className={labelClass}>
                  Company / Organization <span className="text-slate-500">(Optional)</span>
                </label>

                <input
                  id="lead-company"
                  type="text"
                  maxLength={150}
                  value={formData.company}
                  onChange={(event) =>
                    updateField('company', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. Agrawal Logistics Pvt Ltd"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Project Details */}
          <section className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Project Scope & Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="lead-project-type" className={labelClass}>
                  Project Type <span className="text-amber-400">*</span>
                </label>

                <select
                  id="lead-project-type"
                  value={formData.projectType}
                  onChange={(event) =>
                    updateField('projectType', event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  {PROJECT_TYPES.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lead-source" className={labelClass}>
                  Lead Inflow Source <span className="text-amber-400">*</span>
                </label>

                <select
                  id="lead-source"
                  value={formData.leadSource}
                  onChange={(event) =>
                    updateField('leadSource', event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  {LEAD_SOURCES.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lead-budget" className={labelClass}>
                  Estimated Budget (₹ INR)
                </label>

                <input
                  id="lead-budget"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={formData.budget}
                  onChange={(event) =>
                    updateField('budget', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. 7500000"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label htmlFor="lead-area" className={labelClass}>
                  Estimated Construction Area (Sq. Ft.)
                </label>

                <input
                  id="lead-area"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={formData.estimatedAreaSqFt}
                  onChange={(event) =>
                    updateField('estimatedAreaSqFt', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. 3500"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </section>

          {/* Site Location */}
          <section>
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Site Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label htmlFor="lead-site-address" className={labelClass}>
                  Site Location / Plot Address
                </label>

                <input
                  id="lead-site-address"
                  type="text"
                  maxLength={300}
                  value={formData.siteAddress.street}
                  onChange={(event) =>
                    updateSiteAddress('street', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="Plot No. 12, Nipania Road, Near Bypass, Indore"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lead-site-city" className={labelClass}>
                  Site City
                </label>

                <input
                  id="lead-site-city"
                  type="text"
                  maxLength={100}
                  value={formData.siteAddress.city}
                  onChange={(event) => {
                    updateSiteAddress('city', event.target.value);
                    updateField('city', event.target.value);
                  }}
                  disabled={isSubmitting}
                  placeholder="Indore"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lead-site-state" className={labelClass}>
                  State
                </label>

                <input
                  id="lead-site-state"
                  type="text"
                  maxLength={100}
                  value={formData.siteAddress.state}
                  onChange={(event) =>
                    updateSiteAddress('state', event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="Madhya Pradesh"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lead-pincode" className={labelClass}>
                  Pincode
                </label>

                <input
                  id="lead-pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.siteAddress.pincode}
                  onChange={(event) =>
                    updateSiteAddress(
                      'pincode',
                      event.target.value.replace(/\D/g, '').slice(0, 6)
                    )
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. 452001"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Assignment */}
          <section>
            <h3 className="text-xs font-bold text-slate-200 mb-3">
              Sales Assignment
            </h3>

            {isSalesPerson ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {user?.name || 'Current Sales Representative'}
                  </span>

                  <span className="text-[10px] text-amber-300/80 block mt-1">
                    This lead will be assigned to your account.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="lead-assignee" className={labelClass}>
                  Assign to Salesperson
                </label>

                <select
                  id="lead-assignee"
                  value={formData.assignedTo}
                  onChange={(event) =>
                    updateField('assignedTo', event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  <option value="">
                    Automatic Round-Robin Assignment
                  </option>

                  {salesUsers
                    .filter((salesUser) => salesUser?._id || salesUser?.id)
                    .map((salesUser) => (
                      <option
                        key={salesUser._id || salesUser.id}
                        value={salesUser._id || salesUser.id}
                      >
                        {salesUser.name || 'Unnamed User'}
                        {salesUser.role ? ` (${salesUser.role})` : ''}
                      </option>
                    ))}
                </select>

                <p className="text-[10px] text-slate-400 mt-1.5">
                  Leave unassigned to use the backend round-robin assignment.
                </p>
              </div>
            )}
          </section>

          {/* Follow-up & Requirements */}
          <section className="space-y-3.5">
            <div>
              <label htmlFor="lead-followup" className={labelClass}>
                Initial Follow-up Date <span className="text-slate-500">(Optional)</span>
              </label>

              <input
                id="lead-followup"
                type="date"
                min={getLocalDateString()}
                value={formData.nextFollowUpDate}
                onChange={(event) =>
                  updateField('nextFollowUpDate', event.target.value)
                }
                disabled={isSubmitting}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label htmlFor="lead-requirements" className={labelClass}>
                Construction Scope / Client Requirements
              </label>

              <textarea
                id="lead-requirements"
                rows={4}
                maxLength={5000}
                value={formData.requirements}
                onChange={(event) =>
                  updateField('requirements', event.target.value)
                }
                disabled={isSubmitting}
                placeholder="Enter client specifications, architectural drawings status, soil observations, estimated scope, or special requirements..."
                className={`${inputClass} resize-y`}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Lead...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Construction Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal;
