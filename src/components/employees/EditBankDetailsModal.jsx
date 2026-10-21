
import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  Building,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

const COMMON_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank',
  'Bank of India',
  'Canara Bank',
  'Union Bank of India',
];

const INITIAL_FORM = {
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscCode: '',
  branch: '',
  panNumber: '',
  uan: '',
  pfNumber: '',
  aadhaarNumber: '',
};

const getEmployeeName = (employee) => {
  if (!employee) return '';

  return (
    employee.fullName ||
    [
      employee.name?.firstName,
      employee.name?.lastName,
    ]
      .filter(Boolean)
      .join(' ') ||
    ''
  );
};

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  'Failed to update bank details. Please try again.';

const getBankDetails = (employee) => {
  const identity = employee?.identityDetails || {};

  const bank =
    identity.bankDetails ||
    employee?.bankDetails ||
    {};

  return {
    bankName: bank.bankName || '',
    accountHolderName:
      bank.accountHolderName || getEmployeeName(employee),
    accountNumber: bank.accountNumber || '',
    confirmAccountNumber: bank.accountNumber || '',
    ifscCode: bank.ifscCode || '',
    branch: bank.branch || '',
    panNumber: identity.panNumber || '',
    uan: identity.uan || '',
    pfNumber: identity.pfNumber || '',
    aadhaarNumber: identity.aadhaarNumber || '',
  };
};

const FieldError = ({ message }) => {
  if (!message) return null;

  return (
    <p className="mt-1 flex items-start gap-1 text-[10px] text-rose-400">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
};

const inputClass = (hasError = false, mono = false) =>
  [
    'w-full rounded-xl border bg-slate-900 px-3.5 py-2.5',
    'text-xs text-white placeholder:text-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-amber-500/20',
    'transition-colors',
    mono ? 'font-mono' : '',
    hasError
      ? 'border-rose-500 focus:border-rose-400'
      : 'border-slate-800 focus:border-amber-500',
  ]
    .filter(Boolean)
    .join(' ');

export const EditBankDetailsModal = ({
  isOpen,
  onClose,
  employee,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !employee) return;

    setFormData(getBankDetails(employee));
    setFormErrors({});
    setIsSubmitting(false);
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear the field's previous error when the user edits it.
    setFormErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errors = {};

    const bankName = formData.bankName.trim();
    const accountNumber = formData.accountNumber.trim();
    const confirmAccountNumber =
      formData.confirmAccountNumber.trim();
    const ifscCode = formData.ifscCode.trim().toUpperCase();
    const panNumber = formData.panNumber.trim().toUpperCase();
    const uan = formData.uan.trim();
    const aadhaarNumber = formData.aadhaarNumber.trim();

    if (!bankName) {
      errors.bankName = 'Bank name is required.';
    } else if (bankName.length > 100) {
      errors.bankName = 'Bank name cannot exceed 100 characters.';
    }

    if (!accountNumber) {
      errors.accountNumber = 'Account number is required.';
    } else if (!/^\d{8,20}$/.test(accountNumber)) {
      errors.accountNumber =
        'Enter a valid account number containing 8–20 digits.';
    }

    if (!confirmAccountNumber) {
      errors.confirmAccountNumber =
        'Please confirm the account number.';
    } else if (accountNumber !== confirmAccountNumber) {
      errors.confirmAccountNumber =
        'Account numbers do not match.';
    }

    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      errors.ifscCode =
        'Enter a valid 11-character IFSC code, e.g. SBIN0001234.';
    }

    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
      errors.panNumber =
        'Invalid PAN format. Example: ABCDE1234F.';
    }

    if (uan && !/^\d{12}$/.test(uan)) {
      errors.uan = 'UAN must contain exactly 12 digits.';
    }

    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
      errors.aadhaarNumber =
        'Aadhaar number must contain exactly 12 digits.';
    }

    if (formData.accountHolderName.trim().length > 100) {
      errors.accountHolderName =
        'Account holder name cannot exceed 100 characters.';
    }

    if (formData.branch.trim().length > 150) {
      errors.branch = 'Branch cannot exceed 150 characters.';
    }

    if (formData.pfNumber.trim().length > 50) {
      errors.pfNumber = 'PF Member ID cannot exceed 50 characters.';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const bankName = formData.bankName.trim();
      const accountHolderName =
        formData.accountHolderName.trim();
      const accountNumber = formData.accountNumber.trim();
      const ifscCode = formData.ifscCode.trim().toUpperCase();
      const branch = formData.branch.trim();
      const panNumber = formData.panNumber.trim().toUpperCase();
      const uan = formData.uan.trim();
      const pfNumber = formData.pfNumber.trim().toUpperCase();
      const aadhaarNumber = formData.aadhaarNumber.trim();

      const bankDetails = {
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
        branch,
      };

      const payload = {
        ...bankDetails,
        panNumber,
        uan,
        pfNumber,
        aadhaarNumber,
        bankDetails,
      };

      const res = await employeeApi.updateBankDetails(
        employee._id,
        payload
      );

      showToast(
        res?.message ||
        res?.data?.message ||
        'Bank and statutory details updated successfully!',
        'success'
      );

      if (typeof onUpdated === 'function') {
        onUpdated(res?.data?.employee || res?.data || null);
      }

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeName = getEmployeeName(employee);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-bank-details-title"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/90"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/70 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10">
              <CreditCard className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="edit-bank-details-title"
                className="flex flex-wrap items-center gap-2 font-['Outfit'] text-base font-black text-white sm:text-lg"
              >
                Update Bank Details
                <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                  HR
                </span>
              </h2>

              <p className="mt-1 truncate text-xs text-slate-400">
                {employeeName || 'Employee'}
                {employee.employeeId ? (
                  <span className="font-mono text-amber-400">
                    {' '}({employee.employeeId})
                  </span>
                ) : null}
                {employee.designation ? ` • ${employee.designation}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close bank details modal"
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6"
        >
          {/* Bank Presets */}
          <section className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              Select Bank or Type Name
            </label>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_BANKS.map((bank) => (
                <button
                  type="button"
                  key={bank}
                  disabled={isSubmitting}
                  onClick={() => updateField('bankName', bank)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${formData.bankName === bank
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                >
                  {bank}
                </button>
              ))}
            </div>
          </section>

          {/* Bank Details */}
          <section className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Building className="h-4 w-4" />
              Salary Disbursal Bank Account
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Bank Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300">
                  Bank Name <span className="text-rose-400">*</span>
                </label>

                <input
                  type="text"
                  autoComplete="off"
                  maxLength={100}
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  value={formData.bankName}
                  disabled={isSubmitting}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  className={inputClass(!!formErrors.bankName)}
                />

                <FieldError message={formErrors.bankName} />
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Account Number <span className="text-rose-400">*</span>
                </label>

                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={20}
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField(
                      'accountNumber',
                      e.target.value.replace(/\D/g, '').slice(0, 20)
                    )
                  }
                  className={inputClass(!!formErrors.accountNumber, true)}
                />

                <FieldError message={formErrors.accountNumber} />
                <p className="text-[10px] text-slate-500">
                  8–20 digits. Input is masked while typing.
                </p>
              </div>

              {/* Confirm Account Number */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Confirm Account Number{' '}
                    <span className="text-rose-400">*</span>
                  </label>

                  {formData.accountNumber &&
                    formData.confirmAccountNumber &&
                    formData.accountNumber === formData.confirmAccountNumber && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Matched
                      </span>
                    )}
                </div>

                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={20}
                  placeholder="Re-enter account number"
                  value={formData.confirmAccountNumber}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField(
                      'confirmAccountNumber',
                      e.target.value.replace(/\D/g, '').slice(0, 20)
                    )
                  }
                  className={inputClass(
                    !!formErrors.confirmAccountNumber,
                    true
                  )}
                />

                <FieldError message={formErrors.confirmAccountNumber} />
              </div>

              {/* IFSC */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  IFSC Code
                </label>

                <input
                  type="text"
                  maxLength={11}
                  autoComplete="off"
                  placeholder="e.g. SBIN0001234"
                  value={formData.ifscCode}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField(
                      'ifscCode',
                      e.target.value.toUpperCase().replace(/\s+/g, '')
                    )
                  }
                  className={inputClass(!!formErrors.ifscCode, true)}
                />

                <FieldError message={formErrors.ifscCode} />
              </div>

              {/* Account Holder */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Account Holder Name
                </label>

                <input
                  type="text"
                  maxLength={100}
                  autoComplete="off"
                  placeholder="Name as registered with bank"
                  value={formData.accountHolderName}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField('accountHolderName', e.target.value)
                  }
                  className={inputClass(
                    !!formErrors.accountHolderName
                  )}
                />

                <FieldError message={formErrors.accountHolderName} />
              </div>

              {/* Branch */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300">
                  Branch Name / City
                </label>

                <input
                  type="text"
                  maxLength={150}
                  placeholder="e.g. Vijay Nagar, Indore"
                  value={formData.branch}
                  disabled={isSubmitting}
                  onChange={(e) => updateField('branch', e.target.value)}
                  className={inputClass(!!formErrors.branch)}
                />

                <FieldError message={formErrors.branch} />
              </div>
            </div>
          </section>

          {/* Statutory Details */}
          <section className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ShieldCheck className="h-4 w-4" />
              Tax & Statutory Identification
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* PAN */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  PAN Card Number
                </label>

                <input
                  type="text"
                  maxLength={10}
                  autoComplete="off"
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField(
                      'panNumber',
                      e.target.value.toUpperCase().replace(/\s+/g, '')
                    )
                  }
                  className={inputClass(!!formErrors.panNumber, true)}
                />

                <FieldError message={formErrors.panNumber} />
              </div>

              {/* UAN */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  EPF UAN Number
                </label>

                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={12}
                  autoComplete="new-password"
                  placeholder="12-digit UAN"
                  value={formData.uan}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField(
                      'uan',
                      e.target.value.replace(/\D/g, '').slice(0, 12)
                    )
                  }
                  className={inputClass(!!formErrors.uan, true)}
                />

                <FieldError message={formErrors.uan} />
              </div>

              {/* PF Member ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  PF Member ID
                </label>

                <input
                  type="text"
                  maxLength={50}
                  autoComplete="off"
                  placeholder="e.g. MP/IND/0012345/000/0000123"
                  value={formData.pfNumber}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField('pfNumber', e.target.value.toUpperCase())
                  }
                  className={inputClass(!!formErrors.pfNumber, true)}
                />

                <FieldError message={formErrors.pfNumber} />
              </div>

              {/* Aadhaar */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Aadhaar Number
                </label>

                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={12}
                  autoComplete="new-password"
                  placeholder="12-digit Aadhaar number"
                  value={formData.aadhaarNumber}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    updateField(
                      'aadhaarNumber',
                      e.target.value.replace(/\D/g, '').slice(0, 12)
                    )
                  }
                  className={inputClass(
                    !!formErrors.aadhaarNumber,
                    true
                  )}
                />

                <FieldError message={formErrors.aadhaarNumber} />
                <p className="text-[10px] text-slate-500">
                  Sensitive information is masked while typing.
                </p>
              </div>
            </div>
          </section>

          {/* Salary Slip Preview */}
          <section className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              Salary Slip Preview
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-4">
              <div className="min-w-0">
                <span className="mb-1 block text-[10px] text-slate-500">
                  Bank
                </span>
                <strong className="break-words text-white">
                  {formData.bankName || 'Not Set'}
                </strong>
              </div>

              <div className="min-w-0">
                <span className="mb-1 block text-[10px] text-slate-500">
                  Account
                </span>
                <strong className="font-mono text-white">
                  {formData.accountNumber
                    ? `•••• ${formData.accountNumber.slice(-4)}`
                    : 'Not Set'}
                </strong>
              </div>

              <div className="min-w-0">
                <span className="mb-1 block text-[10px] text-slate-500">
                  IFSC
                </span>
                <strong className="break-all font-mono text-amber-400">
                  {formData.ifscCode || 'Not Set'}
                </strong>
              </div>

              <div className="min-w-0">
                <span className="mb-1 block text-[10px] text-slate-500">
                  PAN
                </span>
                <strong className="font-mono text-white">
                  {formData.panNumber
                    ? `${formData.panNumber.slice(0, 3)}••••${formData.panNumber.slice(-2)}`
                    : 'Not Set'}
                </strong>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 font-['Outfit'] text-xs font-bold tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Details...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Bank Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBankDetailsModal;
