
import React, { useState, useEffect, useMemo } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { useToast } from '../../context/ToastContext';
import {
  UserPlus,
  X,
  AlertCircle,
  Loader2,
  Check,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Home,
  ShieldAlert,
  IndianRupee,
  Coins,
  Shield,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LockKeyhole,
  Wallet,
  MapPin,
  ClipboardCheck,
  Fingerprint,
  BadgeCheck,
} from 'lucide-react';
import {
  ROLES,
  ROLE_LABELS,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '../../utils/permissions';

/* -------------------------------------------------------
   Reusable UI Components
------------------------------------------------------- */

const cn = (...classes) => classes.filter(Boolean).join(' ');


const inputClass =
  'w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

const labelClass =
  'mb-2 block text-xs font-semibold tracking-wide text-gray-800';


const Field = ({
  label,
  required = false,
  icon: Icon,
  hint,
  className = '',
  children,
}) => (
  <div className={cn('min-w-0', className)}>
    {label && (
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-amber-400">*</span>}
      </label>
    )}

    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      )}
      {children}
    </div>

    {hint && (
      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-600">
        {hint}
      </p>
    )}
  </div>
);

const Input = ({
  icon: Icon,
  className = '',
  ...props
}) => (
  <input
    {...props}
    className={cn(
      inputClass,
      Icon && 'pl-10',
      className
    )}
  />
);

const Select = ({ className = '', children, ...props }) => (
  <select
    {...props}
    className={cn(
      inputClass,
      'cursor-pointer appearance-none pr-9',
      className
    )}
  >
    {children}
  </select>
);

const SectionHeading = ({
  icon: Icon,
  title,
  description,
  badge,
}) => (
  <div className="mb-5 flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-900">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold tracking-tight text-gray-900">
          {title}
        </h3>
        {badge && (
          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-white">
        {description}
      </p>
    </div>
  </div>
);

const Panel = ({ title, icon: Icon, children, className = '' }) => (
  <div
    className={cn(
      'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5',
      className
    )}
  >
    {title && (
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
        {Icon && <Icon className="h-4 w-4 text-gray-700" />}
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
          {title}
        </h4>
      </div>
    )}
    {children}
  </div>
);

const Toggle = ({ checked, onChange, label, description }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4">
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-white">{label}</span>
      {description && (
        <span className="mt-1 block text-xs leading-relaxed text-slate-400">
          {description}
        </span>
      )}
    </span>

    <span className="relative inline-flex shrink-0 items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="h-6 w-11 rounded-full bg-slate-700 transition-colors peer-checked:bg-amber-500 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900" />
      <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
);

const money = (value) =>
  `₹${(Number(value) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const getLocalDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

const createInitialForm = () => ({
  name: {
    firstName: '',
    lastName: '',
  },

  contactDetails: {
    email: '',
    phone: '',
    alternatePhone: '',
    personalEmail: '',
  },

  joiningDate: getLocalDate(),
  designation: '',
  department: '',
  employmentStatus: 'PROBATION',

  emergencyContact: {
    name: '',
    relationship: '',
    phone: '',
  },

  address: {
    current: {
      street: '',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '',
      country: 'India',
    },
    permanent: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    isPermanentSameAsCurrent: false,
  },

  identityDetails: {
    panNumber: '',
    aadhaarNumber: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
    },
  },

  salary: {
    basic: '',
    houseRentAllowance: '',
    conveyanceAllowance: '',
    specialAllowance: '',
    otherAllowances: '',
    providentFund: '',
    professionalTax: '200',
    tds: '',
    otherDeductions: '',
    notes: 'Initial salary structure agreed upon onboarding',
  },

  portalAccess: {
    createLogin: true,
    role: ROLES.SALES,
    password: 'Speeddex@123',
    customPermissions: ROLE_PERMISSIONS[ROLES.SALES] || [],
  },
});

/* -------------------------------------------------------
   Main Modal
------------------------------------------------------- */

const STEPS = [
  {
    id: 'basic',
    title: 'Personal',
    subtitle: 'Identity & contact',
    icon: User,
  },
  {
    id: 'job',
    title: 'Employment',
    subtitle: 'Role & department',
    icon: Briefcase,
  },
  {
    id: 'salary',
    title: 'Compensation',
    subtitle: 'Salary structure',
    icon: Wallet,
  },
  {
    id: 'address',
    title: 'Address',
    subtitle: 'Residential details',
    icon: MapPin,
  },
  {
    id: 'identity',
    title: 'Bank & Tax',
    subtitle: 'Financial details',
    icon: Fingerprint,
  },
  {
    id: 'portal',
    title: 'Access',
    subtitle: 'Login & permissions',
    icon: Shield,
  },
];

export const CreateEmployeeModal = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const currentStepIndex = STEPS.findIndex(
    (step) => step.id === activeSection
  );

  const updateForm = (updater) => {
    setFormData((prev) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
    setError('');
  };

  const updateRootField = (field, value) => {
    updateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateField = (section, field, value) => {
    // If field is omitted or passed as empty string, update the root level field directly
    if (value === undefined || field === '') {
      const actualValue = value !== undefined ? value : field;
      updateForm((prev) => ({
        ...prev,
        [section]: actualValue,
      }));
      return;
    }

    updateForm((prev) => ({
      ...prev,
      [section]: {
        ...(typeof prev[section] === 'object' && prev[section] !== null
          ? prev[section]
          : {}),
        [field]: value,
      },
    }));
  };

  const updateNestedField = (section, group, field, value) => {
    if (!group) {
      updateField(section, field, value);
      return;
    }

    updateForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: {
          ...(prev[section]?.[group] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updatePortal = (changes) => {
    updateForm((prev) => ({
      ...prev,
      portalAccess: {
        ...prev.portalAccess,
        ...changes,
      },
    }));
  };

  const updateAddress = (type, field, value) => {
    updateForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [type]: {
          ...prev.address[type],
          [field]: value,
        },
      },
    }));
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    setError('');
    setActiveSection('basic');
    setCreatedCredentials(null);
    setCopiedCredentials(false);
    setShowPortalPassword(false);
    setFormData(createInitialForm());

    departmentApi
      .getDepartments({ limit: 100, isActive: true })
      .then((res) => {
        setDepartments(res?.data?.departments || []);
      })
      .catch(() => {
        setDepartments([]);
      });

    return undefined;
  }, [isOpen]);

  const salarySummary = useMemo(() => {
    const salary = formData.salary;

    const basic = Number(salary.basic) || 0;
    const hra = Number(salary.houseRentAllowance) || 0;
    const conveyance = Number(salary.conveyanceAllowance) || 0;
    const special = Number(salary.specialAllowance) || 0;
    const otherAllowances = Number(salary.otherAllowances) || 0;

    const pf = Number(salary.providentFund) || 0;
    const pt = Number(salary.professionalTax) || 0;
    const tds = Number(salary.tds) || 0;
    const otherDeductions = Number(salary.otherDeductions) || 0;

    const gross =
      basic + hra + conveyance + special + otherAllowances;

    const deductions = pf + pt + tds + otherDeductions;

    return {
      gross,
      deductions,
      net: gross - deductions,
      annualGross: gross * 12,
    };
  }, [formData.salary]);

  const generateRandomPassword = () => {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';

    let generated = 'Spd@';

    // Use crypto when available instead of Math.random for credentials.
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const randomValues = new Uint32Array(12);
      window.crypto.getRandomValues(randomValues);

      generated += Array.from(randomValues)
        .map((value) => chars[value % chars.length])
        .join('');
    } else {
      generated += Array.from({ length: 12 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
    }

    updatePortal({ password: generated });
    setShowPortalPassword(true);
  };

  const getCredentialsText = () => {
    if (!createdCredentials) return '';

    return [
      'SPEEDDEX CRM / HRMS — EMPLOYEE LOGIN',
      `Portal URL: ${window.location.origin}/login`,
      `Employee: ${createdCredentials.name}`,
      `Employee ID: ${createdCredentials.employeeId || 'Not assigned'}`,
      `Login Email: ${createdCredentials.email}`,
      `Password: ${createdCredentials.password}`,
      `Role: ${createdCredentials.role}`,
      '',
      'Please change your password after your first login.',
    ].join('\n');
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;

    const text = getCredentialsText();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error('Clipboard access is unavailable');
        }
      }

      setCopiedCredentials(true);
      showToast('Credentials copied to clipboard', 'success');
    } catch {
      showToast(
        'Could not copy automatically. Please copy the details manually.',
        'error'
      );
    }
  };

  const handleFinish = () => {
    setCreatedCredentials(null);
    onCreated?.();
    onClose?.();
  };

  const validateSection = (section) => {
    const { name, contactDetails, designation, joiningDate } = formData;

    if (section === 'basic') {
      if (!name.firstName?.trim() || !name.lastName?.trim()) {
        return 'Please enter the employee first name and last name.';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetails.email?.trim() || '')) {
        return 'Please enter a valid official email address.';
      }

      if (!/^[6-9]\d{9}$/.test(contactDetails.phone?.trim() || '')) {
        return 'Please enter a valid 10-digit Indian mobile number.';
      }

      if (
        contactDetails.alternatePhone &&
        !/^[6-9]\d{9}$/.test(contactDetails.alternatePhone.trim())
      ) {
        return 'Alternate phone must be a valid 10-digit Indian mobile number.';
      }

      if (
        contactDetails.personalEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          contactDetails.personalEmail.trim()
        )
      ) {
        return 'Please enter a valid personal email address.';
      }

      if (
        formData.portalAccess.createLogin &&
        (!formData.portalAccess.password ||
          formData.portalAccess.password.trim().length < 8)
      ) {
        return 'Login password must contain at least 8 characters.';
      }
    }

    if (section === 'job') {
      const desig = typeof designation === 'string' ? designation.trim() : '';
      if (!desig || !joiningDate) {
        return 'Designation and joining date are required.';
      }

      if (joiningDate > getLocalDate()) {
        return 'Joining date cannot be in the future.';
      }
    }

    if (section === 'salary') {
      const salaryValues = Object.entries(formData.salary).filter(
        ([key]) => key !== 'notes'
      );

      const invalid = salaryValues.some(
        ([, value]) =>
          value !== '' &&
          (!Number.isFinite(Number(value)) || Number(value) < 0)
      );

      if (invalid) {
        return 'Salary and deduction amounts must be valid non-negative numbers.';
      }
    }

    if (section === 'address') {
      const current = formData.address.current;
      const permanent = formData.address.permanent;

      if (
        current.pincode &&
        !/^\d{6}$/.test(current.pincode.trim())
      ) {
        return 'Current address pincode must contain 6 digits.';
      }

      if (
        !formData.address.isPermanentSameAsCurrent &&
        permanent.pincode &&
        !/^\d{6}$/.test(permanent.pincode.trim())
      ) {
        return 'Permanent address pincode must contain 6 digits.';
      }

      if (
        formData.emergencyContact.phone &&
        !/^[6-9]\d{9}$/.test(formData.emergencyContact.phone.trim())
      ) {
        return 'Emergency contact must be a valid 10-digit Indian mobile number.';
      }
    }

    if (section === 'identity') {
      const { panNumber, aadhaarNumber, bankDetails } =
        formData.identityDetails;

      if (
        panNumber &&
        !/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber.trim().toUpperCase())
      ) {
        return 'Please enter a valid PAN number.';
      }

      if (
        aadhaarNumber &&
        !/^\d{12}$/.test(aadhaarNumber.trim())
      ) {
        return 'Aadhaar number must contain exactly 12 digits.';
      }

      if (
        bankDetails.ifscCode &&
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
          bankDetails.ifscCode.trim().toUpperCase()
        )
      ) {
        return 'Please enter a valid IFSC code.';
      }
    }

    return '';
  };

  const goToStep = (stepId) => {
    setActiveSection(stepId);
    setError('');
  };

  const handleNext = () => {
    const validationError = validateSection(activeSection);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      goToStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      goToStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError('');

    // Validate all steps before sending data.
    for (const step of STEPS) {
      const validationError = validateSection(step.id);

      if (validationError) {
        setActiveSection(step.id);
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const firstName = formData.name.firstName.trim();
      const lastName = formData.name.lastName.trim();
      const email = formData.contactDetails.email.trim().toLowerCase();
      const password = formData.portalAccess.password.trim();

      const payload = {
        name: {
          firstName,
          lastName,
        },

        contactDetails: {
          email,
          phone: formData.contactDetails.phone.trim(),
          alternatePhone:
            formData.contactDetails.alternatePhone.trim() || undefined,
          personalEmail:
            formData.contactDetails.personalEmail.trim().toLowerCase() ||
            undefined,
        },

        joiningDate: formData.joiningDate,
        designation: typeof formData.designation === 'string' ? formData.designation.trim() : '',
        department: formData.department || null,
        employmentStatus: formData.employmentStatus,

        emergencyContact: {
          name: formData.emergencyContact.name.trim(),
          relationship: formData.emergencyContact.relationship.trim(),
          phone: formData.emergencyContact.phone.trim(),
        },

        address: {
          current: { ...formData.address.current },
          permanent: formData.address.isPermanentSameAsCurrent
            ? { ...formData.address.current }
            : { ...formData.address.permanent },
          isPermanentSameAsCurrent:
            formData.address.isPermanentSameAsCurrent,
        },

        identityDetails: {
          ...formData.identityDetails,
          panNumber: formData.identityDetails.panNumber
            .trim()
            .toUpperCase(),
          aadhaarNumber: formData.identityDetails.aadhaarNumber.trim(),
          bankDetails: {
            ...formData.identityDetails.bankDetails,
            ifscCode: formData.identityDetails.bankDetails.ifscCode
              .trim()
              .toUpperCase(),
          },
        },
      };

      if (formData.portalAccess.createLogin) {
        payload.portalAccess = {
          createLogin: true,
          role: formData.portalAccess.role,
          password,
          customPermissions: [
            ...new Set(formData.portalAccess.customPermissions || []),
          ],
        };
      }

      if (Number(formData.salary.basic) > 0) {
        payload.initialSalary = {
          effectiveFrom: formData.joiningDate,
          currency: 'INR',
          notes:
            formData.salary.notes ||
            'Initial salary structure agreed upon onboarding',

          earnings: {
            basic: Number(formData.salary.basic) || 0,
            houseRentAllowance:
              Number(formData.salary.houseRentAllowance) || 0,
            conveyanceAllowance:
              Number(formData.salary.conveyanceAllowance) || 0,
            specialAllowance:
              Number(formData.salary.specialAllowance) || 0,
            otherAllowances:
              Number(formData.salary.otherAllowances) > 0
                ? [
                  {
                    title: 'Other Allowances',
                    amount: Number(formData.salary.otherAllowances),
                  },
                ]
                : [],
          },

          deductions: {
            providentFund: {
              employeeContribution:
                Number(formData.salary.providentFund) || 0,
              employerContribution: 0,
            },
            professionalTax:
              Number(formData.salary.professionalTax) || 0,
            tds: Number(formData.salary.tds) || 0,
            otherDeductions:
              Number(formData.salary.otherDeductions) > 0
                ? [
                  {
                    title: 'Other Deductions',
                    amount: Number(formData.salary.otherDeductions),
                  },
                ]
                : [],
          },
        };
      }

      const res = await employeeApi.createEmployee(payload);

      showToast('Employee onboarded successfully', 'success');

      if (formData.portalAccess.createLogin) {
        setCreatedCredentials({
          name: `${firstName} ${lastName}`,
          email,
          password,
          role: formData.portalAccess.role,
          customPermissions: formData.portalAccess.customPermissions || [],
          employeeId: res?.data?.employee?.employeeId,
        });
      } else {
        onCreated?.();
        onClose?.();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to onboard employee. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderPasswordField = () => (
    <Field label="Login password" required>
      <div className="relative">
        <Input
          type={showPortalPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={formData.portalAccess.password}
          onChange={(e) => updatePortal({ password: e.target.value })}
          placeholder="Enter a secure password"
          className="pr-24 font-mono"
          required={formData.portalAccess.createLogin}
          minLength={8}
        />

        <button
          type="button"
          onClick={() => setShowPortalPassword((prev) => !prev)}
          aria-label={
            showPortalPassword ? 'Hide password' : 'Show password'
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-amber-300"
        >
          {showPortalPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={generateRandomPassword}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Generate secure password
      </button>
    </Field>
  );

  const renderRoleSelector = () => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Object.values(ROLES).map((role) => {
        const selected = formData.portalAccess.role === role;
        const meta = ROLE_LABELS[role] || {};

        return (
          <button
            key={role}
            type="button"
            onClick={() =>
              updatePortal({
                role,
                customPermissions: [...(ROLE_PERMISSIONS[role] || [])],
              })
            }
            className={cn(
              'min-w-0 rounded-xl border p-3 text-left transition-all',
              selected
                ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/20'
                : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'
            )}
          >
            <span
              className={cn(
                'block truncate text-xs font-bold',
                selected ? 'text-amber-300' : 'text-white'
              )}
            >
              {role}
            </span>
            <span className="mt-1 block truncate text-[10px] text-slate-400">
              {meta.title || role}
            </span>
          </button>
        );
      })}
    </div>
  );

  /* -----------------------------------------------------
     SUCCESS SCREEN
  ----------------------------------------------------- */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-850/85 p-2 backdrop-blur-md sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose?.();
        }
      }}
    >
      <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-black/20 sm:rounded-3xl">
        {/* Premium top accent */}
        <div className="h-1 shrink-0 bg-gradient-to-r from-amber-700 via-amber-300 to-amber-600" />

        {/* Header */}
        <header className="relative shrink-0 overflow-hidden border-b border-gray-200 bg-white px-4 py-4 sm:px-7 sm:py-5">
          <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-amber-400/[0.06] blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                  createdCredentials
                    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400'
                    : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                )}
              >
                {createdCredentials ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-white sm:text-xl">
                    {createdCredentials
                      ? 'Employee onboarded'
                      : 'New employee onboarding'}
                  </h2>


                </div>

                <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                  {createdCredentials
                    ? 'Your employee account has been created.'
                    : 'SPEEDDEX CONSTRUCTION · Employee management'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={createdCredentials ? handleFinish : onClose}
              disabled={isSubmitting}
              aria-label="Close modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {createdCredentials ? (
          /* SUCCESS VIEW */
          <div className="overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="py-3 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <BadgeCheck className="h-10 w-10" />
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
                  Account created successfully!
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                  Employee profile is saved. Share the login information
                  securely with the employee.
                </p>
              </div>

              <Panel title="Employee account" icon={ClipboardCheck}>
                <div className="space-y-0">
                  {[
                    ['Employee name', createdCredentials.name],
                    ['Employee ID', createdCredentials.employeeId || 'Not assigned'],
                    ['Login email', createdCredentials.email],
                    ['Assigned role', createdCredentials.role],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 py-3 last:border-0"
                    >
                      <span className="text-xs text-slate-400">
                        {label}
                      </span>
                      <span className="break-all text-right text-sm font-semibold text-white">
                        {value}
                      </span>
                    </div>
                  ))}

                  <div className="border-b border-slate-800 py-3">
                    <span className="block text-xs text-slate-400">
                      Portal URL
                    </span>
                    <span className="mt-1 block break-all text-sm font-semibold text-amber-300">
                      {window.location.origin}/login
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="text-xs text-slate-400">
                      Temporary password
                    </span>
                    <span className="break-all rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 font-mono text-sm font-bold text-amber-300">
                      {createdCredentials.password}
                    </span>
                  </div>
                </div>
              </Panel>

              <div className="flex gap-3 rounded-xl border border-blue-400/15 bg-blue-400/5 p-3.5">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                <p className="text-xs leading-relaxed text-slate-300">
                  Share credentials only with the employee. Ensure your
                  login system supports password changes after first login.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
                >
                  {copiedCredentials ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedCredentials
                    ? 'Copied successfully'
                    : 'Copy credentials'}
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:from-amber-300 hover:to-amber-400"
                >
                  Done & continue
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Step progress */}
            <div className="shrink-0 border-b border-slate-800 bg-slate-900/60 px-3 py-3 sm:px-7 sm:py-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Onboarding progress
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </span>
              </div>

              <div className="mb-4 h-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                  style={{
                    width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const active = activeSection === step.id;
                  const completed = index < currentStepIndex;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      title={`${step.title}: ${step.subtitle}`}
                      className="group flex min-w-0 flex-col items-center gap-1.5 text-center"
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl border transition-all sm:h-10 sm:w-10',
                          active
                            ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                            : completed
                              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                              : 'border-slate-700 bg-slate-950 text-slate-500 group-hover:border-slate-500 group-hover:text-slate-300'
                        )}
                      >
                        {completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </span>

                      <span
                        className={cn(
                          'max-w-full truncate text-[9px] font-bold sm:text-[11px]',
                          active
                            ? 'text-amber-300'
                            : completed
                              ? 'text-emerald-400'
                              : 'text-slate-500 group-hover:text-slate-300'
                        )}
                      >
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7">
                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3.5 text-sm text-rose-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="leading-relaxed">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="ml-auto shrink-0 text-rose-300/70 hover:text-rose-200"
                      aria-label="Dismiss error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* STEP 1: PERSONAL */}
                {activeSection === 'basic' && (
                  <div className="mx-auto max-w-3xl space-y-5">
                    <SectionHeading
                      icon={User}
                      title="Personal & contact details"
                      description="Start with the employee's identity and primary contact information."
                      badge="Required details"
                    />

                    <Panel title="Personal information" icon={User}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="First name" required>
                          <Input
                            autoFocus
                            value={formData.name.firstName}
                            onChange={(e) =>
                              updateForm((prev) => ({
                                ...prev,
                                name: {
                                  ...prev.name,
                                  firstName: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. Ramesh"
                            autoComplete="given-name"
                            required
                          />
                        </Field>

                        <Field label="Last name" required>
                          <Input
                            value={formData.name.lastName}
                            onChange={(e) =>
                              updateForm((prev) => ({
                                ...prev,
                                name: {
                                  ...prev.name,
                                  lastName: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. Sharma"
                            autoComplete="family-name"
                            required
                          />
                        </Field>
                      </div>
                    </Panel>

                    <Panel title="Contact information" icon={Phone}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Official email" icon={Mail} required>
                          <Input
                            type="email"
                            icon={Mail}
                            autoComplete="email"
                            value={formData.contactDetails.email}
                            onChange={(e) =>
                              updateField(
                                'contactDetails',
                                'email',
                                e.target.value
                              )
                            }
                            placeholder="name@company.com"
                            required
                          />
                        </Field>

                        <Field label="Mobile number" icon={Phone} required>
                          <Input
                            type="tel"
                            icon={Phone}
                            inputMode="numeric"
                            maxLength={10}
                            value={formData.contactDetails.phone}
                            onChange={(e) =>
                              updateForm((prev) => ({
                                ...prev,
                                contactDetails: {
                                  ...prev.contactDetails,
                                  phone: e.target.value.replace(/\D/g, ''),
                                },
                              }))
                            }
                            placeholder="10-digit mobile number"
                            autoComplete="tel-national"
                            required
                          />
                        </Field>

                        <Field label="Alternate phone">
                          <Input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={formData.contactDetails.alternatePhone}
                            onChange={(e) =>
                              updateForm((prev) => ({
                                ...prev,
                                contactDetails: {
                                  ...prev.contactDetails,
                                  alternatePhone: e.target.value.replace(
                                    /\D/g,
                                    ''
                                  ),
                                },
                              }))
                            }
                            placeholder="Optional"
                          />
                        </Field>

                        <Field label="Personal email">
                          <Input
                            type="email"
                            value={formData.contactDetails.personalEmail}
                            onChange={(e) =>
                              updateForm((prev) => ({
                                ...prev,
                                contactDetails: {
                                  ...prev.contactDetails,
                                  personalEmail: e.target.value,
                                },
                              }))
                            }
                            placeholder="personal@gmail.com"
                          />
                        </Field>
                      </div>
                    </Panel>

                    <Panel
                      className="border-amber-400/20 bg-gradient-to-br from-amber-400/[0.06] to-transparent"
                    >
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                          <Key className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-black">
                            Employee portal account
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            Give this employee access to the CRM and HRMS.
                          </p>
                        </div>
                      </div>

                      <Toggle
                        checked={formData.portalAccess.createLogin}
                        onChange={(value) =>
                          updatePortal({ createLogin: value })
                        }
                        label="Create login credentials"
                        description="Use the official email as the login ID."
                      />

                      {formData.portalAccess.createLogin && (
                        <div className="mt-5 border-t border-slate-800 pt-4">
                          {renderPasswordField()}

                          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                            You can configure the role and module-level
                            permissions in Step 6.
                          </p>
                        </div>
                      )}
                    </Panel>
                  </div>
                )}

                {/* STEP 2: EMPLOYMENT */}
                {activeSection === 'job' && (
                  <div className="mx-auto max-w-3xl space-y-5">
                    <SectionHeading
                      icon={Briefcase}
                      title="Employment information"
                      description="Define the employee's position, joining date and organizational assignment."
                    />

                    <Panel title="Job assignment" icon={Building2}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Designation / job title" required>
                          <Input
                            autoFocus
                            value={formData.designation}
                            onChange={(e) =>
                              updateRootField(
                                'designation',
                                e.target.value
                              )
                            }
                            placeholder="e.g. Site Engineer"
                            required
                          />
                        </Field>

                        <Field
                          label="Department"
                          hint="Optional. The employee can remain unassigned."
                        >
                          <Select
                            value={formData.department}
                            onChange={(e) =>
                              updateRootField(
                                'department',
                                e.target.value
                              )
                            }
                          >
                            <option value="">No department assigned</option>
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name}
                                {dept.code ? ` (${dept.code})` : ''}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Joining date" required>
                          <Input
                            type="date"
                            value={formData.joiningDate}
                            max={getLocalDate()}
                            onChange={(e) =>
                              updateRootField(
                                'joiningDate',
                                e.target.value
                              )
                            }
                            required
                          />
                        </Field>

                        <Field label="Employment status" required>
                          <Select
                            value={formData.employmentStatus}
                            onChange={(e) =>
                              updateRootField(
                                'employmentStatus',
                                e.target.value
                              )
                            }
                          >
                            <option value="PROBATION">Probation</option>
                            <option value="CONFIRMED">
                              Confirmed / Full-time
                            </option>
                            <option value="CONTRACT">Contract basis</option>
                            <option value="INTERN">Intern</option>
                          </Select>
                        </Field>
                      </div>
                    </Panel>

                    <div className="flex items-start gap-3 rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-4">
                      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Organizational assignment
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
                          Select the appropriate department for reporting
                          and internal organization. You can leave this
                          blank if the department has not been decided.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SALARY */}
                {activeSection === 'salary' && (
                  <div className="mx-auto max-w-4xl space-y-5">
                    <SectionHeading
                      icon={Wallet}
                      title="Compensation & salary"
                      description="Configure monthly earnings and deductions for the employee's initial salary structure."
                      badge="Monthly amounts"
                    />

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {[
                        {
                          label: 'Monthly gross',
                          value: salarySummary.gross,
                          color: 'text-white',
                          icon: IndianRupee,
                        },
                        {
                          label: 'Total deductions',
                          value: salarySummary.deductions,
                          color: 'text-rose-300',
                          icon: Coins,
                        },
                        {
                          label: 'Take-home',
                          value: salarySummary.net,
                          color: 'text-emerald-300',
                          icon: Wallet,
                        },
                        {
                          label: 'Annualized gross',
                          value: salarySummary.annualGross,
                          color: 'text-amber-300',
                          icon: Calendar,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-slate-800 bg-white p-3 sm:p-4"
                          >
                            <Icon className="mb-3 h-4 w-4 text-slate-500" />
                            <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-wider text-slate-400">
                              {item.label}
                            </p>
                            <p
                              className={cn(
                                'mt-1 break-words text-base font-bold tracking-tight sm:text-lg',
                                item.color
                              )}
                            >
                              {money(item.value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <Panel title="Monthly earnings" icon={IndianRupee}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                          ['basic', 'Basic salary', '35000'],
                          ['houseRentAllowance', 'House rent allowance', '15000'],
                          ['conveyanceAllowance', 'Conveyance allowance', '2000'],
                          ['specialAllowance', 'Special / site allowance', '3000'],
                          ['otherAllowances', 'Other allowances', '0'],
                        ].map(([key, label, placeholder]) => (
                          <Field key={key} label={label}>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={formData.salary[key]}
                              onChange={(e) =>
                                updateField('salary', key, e.target.value)
                              }
                              placeholder={placeholder}
                            />
                          </Field>
                        ))}
                      </div>
                    </Panel>

                    <Panel title="Monthly deductions" icon={Coins}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                          ['providentFund', 'Employee PF', '1800'],
                          ['professionalTax', 'Professional tax', '200'],
                          ['tds', 'TDS / income tax', '0'],
                          ['otherDeductions', 'Other deductions', '0'],
                        ].map(([key, label, placeholder]) => (
                          <Field key={key} label={label}>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={formData.salary[key]}
                              onChange={(e) =>
                                updateField('salary', key, e.target.value)
                              }
                              placeholder={placeholder}
                            />
                          </Field>
                        ))}

                        <Field
                          label="Salary structure notes"
                          className="sm:col-span-2"
                        >
                          <Input
                            value={formData.salary.notes}
                            onChange={(e) =>
                              updateField('salary', 'notes', e.target.value)
                            }
                            placeholder="Notes for payroll and HR"
                          />
                        </Field>
                      </div>
                    </Panel>

                    {salarySummary.net < 0 && (
                      <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Deductions exceed gross salary. Review the figures
                        before saving.
                      </div>
                    )}

                    <p className="text-[11px] leading-relaxed text-slate-500">
                      The summary uses the amounts entered here. Actual
                      payroll, statutory deductions, employer PF
                      contributions and CTC may differ based on your
                      company's payroll rules.
                    </p>
                  </div>
                )}

                {/* STEP 4: ADDRESS */}
                {activeSection === 'address' && (
                  <div className="mx-auto max-w-3xl space-y-5">
                    <SectionHeading
                      icon={MapPin}
                      title="Address & emergency contact"
                      description="Record residential details and a contact to reach in an emergency."
                    />

                    {['current', 'permanent'].map((type) => {
                      const address = formData.address[type];
                      const isCurrent = type === 'current';

                      return (
                        <Panel
                          key={type}
                          title={
                            isCurrent
                              ? 'Current residential address'
                              : 'Permanent residential address'
                          }
                          icon={Home}
                        >
                          {!isCurrent && (
                            <div className="mb-4">
                              <Toggle
                                checked={
                                  formData.address.isPermanentSameAsCurrent
                                }
                                onChange={(value) =>
                                  updateForm((prev) => ({
                                    ...prev,
                                    address: {
                                      ...prev.address,
                                      isPermanentSameAsCurrent: value,
                                    },
                                  }))
                                }
                                label="Same as current address"
                              />
                            </div>
                          )}

                          {(isCurrent ||
                            !formData.address.isPermanentSameAsCurrent) && (
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                  label="Street / locality"
                                  className="sm:col-span-2"
                                >
                                  <Input
                                    value={address.street}
                                    onChange={(e) =>
                                      updateAddress(
                                        type,
                                        'street',
                                        e.target.value
                                      )
                                    }
                                    placeholder="House, street, locality"
                                  />
                                </Field>

                                <Field label="City">
                                  <Input
                                    value={address.city}
                                    onChange={(e) =>
                                      updateAddress(
                                        type,
                                        'city',
                                        e.target.value
                                      )
                                    }
                                    placeholder="City"
                                  />
                                </Field>

                                <Field label="State">
                                  <Input
                                    value={address.state}
                                    onChange={(e) =>
                                      updateAddress(
                                        type,
                                        'state',
                                        e.target.value
                                      )
                                    }
                                    placeholder="State"
                                  />
                                </Field>

                                <Field label="Pincode">
                                  <Input
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={address.pincode}
                                    onChange={(e) =>
                                      updateAddress(
                                        type,
                                        'pincode',
                                        e.target.value.replace(/\D/g, '')
                                      )
                                    }
                                    placeholder="6-digit pincode"
                                  />
                                </Field>

                                <Field label="Country">
                                  <Input
                                    value={address.country}
                                    onChange={(e) =>
                                      updateAddress(
                                        type,
                                        'country',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Country"
                                  />
                                </Field>
                              </div>
                            )}
                        </Panel>
                      );
                    })}

                    <Panel title="Emergency contact" icon={ShieldAlert}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Contact person's name">
                          <Input
                            value={formData.emergencyContact.name}
                            onChange={(e) =>
                              updateField(
                                'emergencyContact',
                                'name',
                                e.target.value
                              )
                            }
                            placeholder="Full name"
                          />
                        </Field>

                        <Field label="Relationship">
                          <Input
                            value={formData.emergencyContact.relationship}
                            onChange={(e) =>
                              updateField(
                                'emergencyContact',
                                'relationship',
                                e.target.value
                              )
                            }
                            placeholder="e.g. Father, Spouse"
                          />
                        </Field>

                        <Field label="Emergency mobile">
                          <Input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={formData.emergencyContact.phone}
                            onChange={(e) =>
                              updateField(
                                'emergencyContact',
                                'phone',
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            placeholder="10-digit mobile number"
                          />
                        </Field>
                      </div>
                    </Panel>
                  </div>
                )}

                {/* STEP 5: BANK & TAX */}
                {activeSection === 'identity' && (
                  <div className="mx-auto max-w-3xl space-y-5">
                    <SectionHeading
                      icon={Fingerprint}
                      title="Bank & tax information"
                      description="Add employee identity and salary account information for HR records."
                    />

                    <Panel title="Tax identification" icon={Fingerprint}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                          label="PAN number"
                          hint="Format: ABCDE1234F"
                        >
                          <Input
                            maxLength={10}
                            value={formData.identityDetails.panNumber}
                            onChange={(e) =>
                              updateField(
                                'identityDetails',
                                'panNumber',
                                e.target.value.toUpperCase()
                              )
                            }
                            placeholder="ABCDE1234F"
                            className="uppercase"
                          />
                        </Field>

                        <Field
                          label="Aadhaar number"
                          hint="Optional · 12 digits"
                        >
                          <Input
                            inputMode="numeric"
                            maxLength={12}
                            value={formData.identityDetails.aadhaarNumber}
                            onChange={(e) =>
                              updateField(
                                'identityDetails',
                                'aadhaarNumber',
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            placeholder="12-digit number"
                          />
                        </Field>
                      </div>
                    </Panel>

                    <Panel title="Salary account details" icon={CreditCard}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Bank name">
                          <Input
                            value={
                              formData.identityDetails.bankDetails.bankName
                            }
                            onChange={(e) =>
                              updateNestedField(
                                'identityDetails',
                                'bankDetails',
                                'bankName',
                                e.target.value
                              )
                            }
                            placeholder="Bank name"
                          />
                        </Field>

                        <Field label="Account number">
                          <Input
                            value={
                              formData.identityDetails.bankDetails
                                .accountNumber
                            }
                            onChange={(e) =>
                              updateNestedField(
                                'identityDetails',
                                'bankDetails',
                                'accountNumber',
                                e.target.value
                              )
                            }
                            placeholder="Bank account number"
                          />
                        </Field>

                        <Field label="IFSC code">
                          <Input
                            maxLength={11}
                            value={
                              formData.identityDetails.bankDetails.ifscCode
                            }
                            onChange={(e) =>
                              updateNestedField(
                                'identityDetails',
                                'bankDetails',
                                'ifscCode',
                                e.target.value.toUpperCase()
                              )
                            }
                            placeholder="SBIN0001234"
                            className="uppercase"
                          />
                        </Field>

                        <Field label="Branch">
                          <Input
                            value={
                              formData.identityDetails.bankDetails.branch
                            }
                            onChange={(e) =>
                              updateNestedField(
                                'identityDetails',
                                'bankDetails',
                                'branch',
                                e.target.value
                              )
                            }
                            placeholder="Branch location"
                          />
                        </Field>
                      </div>
                    </Panel>

                    <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3.5">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      <p className="text-xs leading-relaxed text-slate-400">
                        PAN, Aadhaar and bank details are sensitive.
                        Restrict access to authorized HR and payroll
                        personnel and protect these fields in your backend.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 6: PORTAL ACCESS */}
                {activeSection === 'portal' && (
                  <div className="mx-auto max-w-4xl space-y-5">
                    <SectionHeading
                      icon={Shield}
                      title="Portal access & permissions"
                      description="Choose the employee's system role and customize the modules they can access."
                    />

                    <Panel className="border-amber-400/20">
                      <Toggle
                        checked={formData.portalAccess.createLogin}
                        onChange={(value) =>
                          updatePortal({ createLogin: value })
                        }
                        label="Enable employee portal login"
                        description="Create a user account alongside the employee profile."
                      />
                    </Panel>

                    {formData.portalAccess.createLogin && (
                      <>
                        <Panel title="Base role" icon={Shield}>
                          {renderRoleSelector()}

                          <p className="mt-3 text-xs leading-relaxed text-slate-500">
                            Selecting a role loads its default permissions.
                            You can customize them below.
                          </p>
                        </Panel>

                        <Panel title="Login credentials" icon={Key}>
                          <Field
                            label="Official email / login ID"
                            hint="This is the email entered in Step 1."
                          >
                            <Input
                              value={formData.contactDetails.email}
                              readOnly
                              className="cursor-not-allowed text-slate-400"
                            />
                          </Field>

                          <div className="mt-4">
                            {renderPasswordField()}
                          </div>
                        </Panel>

                        <Panel
                          title={`Module permissions (${formData.portalAccess.customPermissions.length})`}
                          icon={LockKeyhole}
                        >
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updatePortal({
                                  customPermissions: ALL_PERMISSIONS.map(
                                    (permission) => permission.id
                                  ),
                                })
                              }
                              className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
                            >
                              Select all
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updatePortal({
                                  customPermissions: [
                                    ...(ROLE_PERMISSIONS[
                                      formData.portalAccess.role
                                    ] || []),
                                  ],
                                })
                              }
                              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                            >
                              Restore role defaults
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updatePortal({ customPermissions: [] })
                              }
                              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                            >
                              Clear all
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {ALL_PERMISSIONS.map((permission) => {
                              const checked =
                                formData.portalAccess.customPermissions.includes(
                                  permission.id
                                );

                              return (
                                <label
                                  key={permission.id}
                                  className={cn(
                                    'flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                                    checked
                                      ? 'border-amber-400/30 bg-amber-400/[0.06]'
                                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const current =
                                        formData.portalAccess
                                          .customPermissions;

                                      updatePortal({
                                        customPermissions: checked
                                          ? current.filter(
                                            (id) => id !== permission.id
                                          )
                                          : [...current, permission.id],
                                      });
                                    }}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
                                  />

                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={cn(
                                        'block text-xs font-semibold',
                                        checked
                                          ? 'text-amber-200'
                                          : 'text-slate-300'
                                      )}
                                    >
                                      {permission.name}
                                    </span>

                                    <span className="mt-1 block text-[10px] text-slate-500">
                                      {permission.category}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                            These permissions are sent to your existing
                            backend. Ensure the server independently
                            enforces permissions on every protected API.
                          </p>
                        </Panel>
                      </>
                    )}

                    {!formData.portalAccess.createLogin && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
                        <LockKeyhole className="mx-auto h-8 w-8 text-slate-500" />
                        <h4 className="mt-3 text-sm font-bold text-white">
                          Portal access disabled
                        </h4>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          The employee profile will be created without
                          portal login credentials.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/90 px-4 py-3.5 sm:px-7 sm:py-4">
                <button
                  type="button"
                  onClick={
                    currentStepIndex === 0 ? onClose : handlePrevious
                  }
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50 sm:px-4"
                >
                  {currentStepIndex === 0 ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </>
                  )}
                </button>

                <div className="hidden items-center gap-1.5 sm:flex">
                  {STEPS.map((step, index) => (
                    <span
                      key={step.id}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        index === currentStepIndex
                          ? 'w-5 bg-amber-400'
                          : index < currentStepIndex
                            ? 'w-1.5 bg-emerald-400'
                            : 'w-1.5 bg-slate-700'
                      )}
                    />
                  ))}
                </div>

                {currentStepIndex < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 sm:px-6"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition hover:from-amber-300 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving employee...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Complete onboarding
                      </>
                    )}
                  </button>
                )}
              </footer>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateEmployeeModal;
