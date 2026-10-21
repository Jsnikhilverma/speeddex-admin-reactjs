
import React, { useState, useEffect, useRef } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  X,
  AlertCircle,
  Loader2,
  Download,
  Eye,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const DOCUMENT_TEMPLATES = [
  {
    type: 'APPOINTMENT_LETTER',
    title: 'Appointment Letter',
    description:
      'Official employment appointment confirmation with terms and salary structure.',
  },
  {
    type: 'OFFER_LETTER',
    title: 'Job Offer Letter',
    description:
      'Formal job offer stating role, joining date, and annual CTC breakdown.',
  },
  {
    type: 'PROMOTION_LETTER',
    title: 'Promotion Letter',
    description:
      'Career advancement letter confirming new designation and responsibilities.',
  },
  {
    type: 'INCREMENT_LETTER',
    title: 'Salary Revision / Increment Letter',
    description:
      'Compensation enhancement letter with revised earnings and effective date.',
  },
  {
    type: 'NOTICE_PERIOD_LETTER',
    title: 'Notice Period Letter',
    description:
      'Formal notice period tracking and transition requirements.',
  },
  {
    type: 'RESIGNATION_ACCEPTANCE_LETTER',
    title: 'Resignation Acceptance Letter',
    description:
      'Official acceptance of resignation with relief date and exit clearance terms.',
  },
  {
    type: 'TERMINATION_LETTER',
    title: 'Termination Letter',
    description:
      'Confidential separation letter with settlement terms and asset return protocol.',
  },
];

const NOTICE_TEMPLATES = [
  'NOTICE_PERIOD_LETTER',
  'RESIGNATION_ACCEPTANCE_LETTER',
  'TERMINATION_LETTER',
];

const SALARY_TEMPLATES = [
  'INCREMENT_LETTER',
  'OFFER_LETTER',
];

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getDisplayText = (value, fallback = '') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (isObject(value)) {
    return getDisplayText(
      value.name ??
      value.fullName ??
      value.label ??
      value.title ??
      value.code ??
      value.value,
      fallback
    );
  }

  return fallback;
};

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  const fullName = getDisplayText(employee.fullName);

  if (fullName) return fullName;

  const name = employee.name;

  if (typeof name === 'string') {
    return name || 'Employee';
  }

  if (isObject(name)) {
    const joinedName = [
      name.firstName,
      name.middleName,
      name.lastName,
    ]
      .map((part) => getDisplayText(part))
      .filter(Boolean)
      .join(' ');

    if (joinedName) return joinedName;
  }

  return 'Employee';
};

const getErrorMessage = (err, fallback) => {
  const responseData = err?.response?.data;

  return (
    getDisplayText(responseData?.message) ||
    getDisplayText(responseData?.error) ||
    getDisplayText(err?.message) ||
    fallback
  );
};

const isValidDate = (value) => {
  if (!value || typeof value !== 'string') return false;

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
};

/**
 * Supports these API shapes:
 *
 * Axios:
 * response.data.data.preview
 *
 * Direct API response:
 * response.data.preview
 *
 * Preview object:
 * response.preview
 *
 * The returned object uses a consistent shape for the UI.
 */
const getPreviewData = (response) => {
  const root = response?.data ?? response;

  if (!isObject(root)) {
    throw new Error('The server returned an invalid document preview.');
  }

  if (root.success === false) {
    throw new Error(
      getDisplayText(root.message, 'Unable to generate document preview.')
    );
  }

  const envelope = isObject(root.data) ? root.data : root;

  const rawPreview = isObject(envelope.preview)
    ? envelope.preview
    : isObject(root.preview)
      ? root.preview
      : envelope;

  if (!isObject(rawPreview)) {
    throw new Error('The server returned an invalid document preview.');
  }

  const rawEmployee = isObject(rawPreview.employee)
    ? rawPreview.employee
    : {};

  const employeeName = getDisplayText(
    rawPreview.empName ??
    rawEmployee.name ??
    rawEmployee.fullName
  );

  const employeeCode = getDisplayText(
    rawPreview.empCode ??
    rawEmployee.employeeId ??
    rawEmployee.empCode
  );

  const designation = getDisplayText(
    rawPreview.designation ??
    rawEmployee.designation
  );

  const department = getDisplayText(
    rawPreview.department ??
    rawEmployee.department
  );

  const bodyParagraphs = Array.isArray(rawPreview.bodyParagraphs)
    ? rawPreview.bodyParagraphs
      .map((paragraph) => getDisplayText(paragraph))
      .filter(Boolean)
    : [];

  const termsList = Array.isArray(rawPreview.termsList)
    ? rawPreview.termsList
      .map((term) => getDisplayText(term))
      .filter(Boolean)
    : [];

  const company = isObject(rawPreview.company)
    ? rawPreview.company
    : {};

  return {
    ...rawPreview,

    // Normalize backend field names to the UI field names.
    employee: {
      ...rawEmployee,
      name: employeeName,
      employeeId: employeeCode,
      designation,
      department,
    },

    effectiveDateStr: getDisplayText(
      rawPreview.dateStr ?? rawPreview.effectiveDateStr
    ),

    referenceNumber: getDisplayText(
      rawPreview.refNumber ?? rawPreview.referenceNumber
    ),

    subject: getDisplayText(rawPreview.subject),

    title: getDisplayText(rawPreview.title),

    bodyParagraphs,
    termsList,
    company,
  };
};

const getPdfBlob = (response) => {
  if (typeof Blob !== 'undefined' && response instanceof Blob) {
    return response;
  }

  if (
    typeof Blob !== 'undefined' &&
    response?.data instanceof Blob
  ) {
    return response.data;
  }

  if (
    typeof Blob !== 'undefined' &&
    response?.data?.data instanceof Blob
  ) {
    return response.data.data;
  }

  const rawData = response?.data ?? response;

  if (
    typeof ArrayBuffer !== 'undefined' &&
    rawData instanceof ArrayBuffer
  ) {
    return new Blob([rawData], { type: 'application/pdf' });
  }

  if (
    typeof ArrayBuffer !== 'undefined' &&
    ArrayBuffer.isView(rawData)
  ) {
    return new Blob([rawData], { type: 'application/pdf' });
  }

  // Some API clients return a Blob as a JSON-like wrapper.
  if (typeof rawData === 'string') {
    const trimmed = rawData.trim();

    if (trimmed.startsWith('%PDF-')) {
      return new Blob([rawData], { type: 'application/pdf' });
    }
  }

  throw new Error(
    'The server did not return a PDF file. Check the generateDocument API response and responseType.'
  );
};

export const GenerateDocumentModal = ({
  isOpen,
  onClose,
  employee,
  onGenerated,
}) => {
  const { showToast } = useToast();

  const [templateType, setTemplateType] = useState('APPOINTMENT_LETTER');
  const [effectiveDate, setEffectiveDate] = useState(getLocalDate);
  const [customSubject, setCustomSubject] = useState('');
  const [customRemarks, setCustomRemarks] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newGrossSalary, setNewGrossSalary] = useState('');
  const [noticeDays, setNoticeDays] = useState('30');
  const [lastWorkingDate, setLastWorkingDate] = useState('');

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState('');

  const previewRequestId = useRef(0);
  const isMountedRef = useRef(false);

  const employeeName = getEmployeeName(employee);

  const employeeId = employee?._id;

  const payload = {
    templateType,
    effectiveDate,
    customSubject: customSubject.trim(),
    customRemarks: customRemarks.trim(),
    newDesignation: newDesignation.trim(),
    newGrossSalary:
      newGrossSalary === '' ? '' : Number(newGrossSalary),
    noticeDays: noticeDays === '' ? '' : Number(noticeDays),
    lastWorkingDate,
  };

  // Track mount/unmount and invalidate requests when the modal closes.
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      previewRequestId.current += 1;
    };
  }, []);

  // Reset the form when the modal opens for another employee.
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    setTemplateType('APPOINTMENT_LETTER');
    setEffectiveDate(getLocalDate());
    setCustomSubject('');
    setCustomRemarks('');
    setNewDesignation(
      getDisplayText(
        employee?.employmentDetails?.designation ??
        employee?.designation
      )
    );
    setNewGrossSalary('');
    setNoticeDays('30');
    setLastWorkingDate('');

    setPreviewData(null);
    setError('');
    setPreviewError('');
    setIsGenerating(false);
    setIsPreviewLoading(false);

    previewRequestId.current += 1;
  }, [isOpen, employeeId]);

  // Automatically fetch a preview after the form changes.
  useEffect(() => {
    if (!isOpen || !employeeId) return undefined;

    if (!isValidDate(effectiveDate)) {
      setPreviewData(null);
      setPreviewError('Please select a valid issue/effective date.');
      setIsPreviewLoading(false);
      return undefined;
    }

    if (
      NOTICE_TEMPLATES.includes(templateType) &&
      (noticeDays === '' ||
        !Number.isInteger(Number(noticeDays)) ||
        Number(noticeDays) < 0 ||
        Number(noticeDays) > 365)
    ) {
      setPreviewData(null);
      setPreviewError('Notice days must be a whole number between 0 and 365.');
      setIsPreviewLoading(false);
      return undefined;
    }

    if (
      SALARY_TEMPLATES.includes(templateType) &&
      newGrossSalary !== '' &&
      (!Number.isFinite(Number(newGrossSalary)) ||
        Number(newGrossSalary) <= 0)
    ) {
      setPreviewData(null);
      setPreviewError('Monthly gross salary must be greater than zero.');
      setIsPreviewLoading(false);
      return undefined;
    }

    if (lastWorkingDate && !isValidDate(lastWorkingDate)) {
      setPreviewData(null);
      setPreviewError('Please select a valid relieving date.');
      setIsPreviewLoading(false);
      return undefined;
    }

    if (lastWorkingDate && lastWorkingDate < effectiveDate) {
      setPreviewData(null);
      setPreviewError(
        'Relieving date cannot be earlier than the issue/effective date.'
      );
      setIsPreviewLoading(false);
      return undefined;
    }

    const requestId = ++previewRequestId.current;
    let cancelled = false;

    setIsPreviewLoading(true);
    setPreviewError('');
    setError('');

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await employeeApi.previewDocument(
          employeeId,
          payload
        );

        if (
          cancelled ||
          !isMountedRef.current ||
          requestId !== previewRequestId.current
        ) {
          return;
        }

        const data = getPreviewData(response);

        setPreviewData(data);
        setPreviewError('');
      } catch (err) {
        if (
          cancelled ||
          !isMountedRef.current ||
          requestId !== previewRequestId.current
        ) {
          return;
        }

        setPreviewData(null);
        setPreviewError(
          getErrorMessage(err, 'Failed to load document preview.')
        );
      } finally {
        if (
          !cancelled &&
          isMountedRef.current &&
          requestId === previewRequestId.current
        ) {
          setIsPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    employeeId,
    templateType,
    effectiveDate,
    customSubject,
    customRemarks,
    newDesignation,
    newGrossSalary,
    noticeDays,
    lastWorkingDate,
  ]);

  const handleTemplateChange = (newType) => {
    setTemplateType(newType);
    setError('');
    setPreviewError('');
  };

  const validateDocument = () => {
    if (!employeeId) {
      return 'Employee information is missing.';
    }

    if (!DOCUMENT_TEMPLATES.some((item) => item.type === templateType)) {
      return 'Please select a valid document template.';
    }

    if (!isValidDate(effectiveDate)) {
      return 'Please select a valid issue/effective date.';
    }

    if (
      templateType === 'PROMOTION_LETTER' &&
      !newDesignation.trim()
    ) {
      return 'Please enter the promoted designation.';
    }

    if (SALARY_TEMPLATES.includes(templateType)) {
      if (
        newGrossSalary === '' ||
        !Number.isFinite(Number(newGrossSalary)) ||
        Number(newGrossSalary) <= 0
      ) {
        return 'Please enter a valid monthly gross salary greater than zero.';
      }
    }

    if (NOTICE_TEMPLATES.includes(templateType)) {
      if (
        noticeDays === '' ||
        !Number.isInteger(Number(noticeDays)) ||
        Number(noticeDays) < 0 ||
        Number(noticeDays) > 365
      ) {
        return 'Notice days must be a whole number between 0 and 365.';
      }
    }

    if (lastWorkingDate && !isValidDate(lastWorkingDate)) {
      return 'Please select a valid relieving date.';
    }

    if (lastWorkingDate && lastWorkingDate < effectiveDate) {
      return 'Relieving date cannot be earlier than the issue/effective date.';
    }

    if (customSubject.trim().length > 200) {
      return 'Custom subject cannot exceed 200 characters.';
    }

    if (customRemarks.trim().length > 3000) {
      return 'Remarks cannot exceed 3000 characters.';
    }

    return '';
  };

  const handleGeneratePdf = async () => {
    if (isGenerating) return;

    const validationError = validateDocument();

    if (validationError) {
      setError(validationError);
      return;
    }

    let downloadUrl = '';

    try {
      setIsGenerating(true);
      setError('');

      const response = await employeeApi.generateDocument(
        employeeId,
        payload
      );

      const pdfBlob = getPdfBlob(response);

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('The generated PDF is empty. Please try again.');
      }

      downloadUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');

      const safeEmployeeId = String(employee?.employeeId || 'EMP')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      link.href = downloadUrl;
      link.download = `${safeEmployeeId}_${templateType}_${effectiveDate}.pdf`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        if (downloadUrl) {
          window.URL.revokeObjectURL(downloadUrl);
        }
      }, 1500);

      downloadUrl = '';

      showToast(
        `${templateType.replace(/_/g, ' ')} PDF generated successfully!`,
        'success'
      );

      if (typeof onGenerated === 'function') {
        onGenerated();
      }

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }

      const message = getErrorMessage(
        err,
        'Failed to generate the official document.'
      );

      setError(message);
      showToast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !employee) return null;

  // These fields now match the backend preview response.
  const previewName = getDisplayText(
    previewData?.employee?.name,
    employeeName
  );

  const previewEmployeeId = getDisplayText(
    previewData?.employee?.employeeId,
    getDisplayText(employee?.employeeId, 'N/A')
  );

  const previewDepartment = getDisplayText(
    previewData?.employee?.department ??
    employee?.employmentDetails?.department ??
    employee?.department,
    'N/A'
  );

  const previewDesignation = getDisplayText(
    previewData?.employee?.designation ??
    employee?.employmentDetails?.designation ??
    employee?.designation
  );

  const referenceNumber = getDisplayText(
    previewData?.referenceNumber,
    'Pending'
  );

  const previewDate = getDisplayText(
    previewData?.effectiveDateStr,
    effectiveDate
  );

  const company = previewData?.company || {};

  const companyName = getDisplayText(
    company.name,
    'Speeddex Construction Pvt. Ltd.'
  );

  const companyAddress = [
    company.addressLine1,
    company.city,
    company.state,
    company.pincode,
    company.country,
  ]
    .map((part) => getDisplayText(part))
    .filter(Boolean)
    .join(', ');

  const companyContact = [
    company.email,
    company.phone,
    company.website,
  ]
    .map((part) => getDisplayText(part))
    .filter(Boolean)
    .join(' | ');

  const templateTitle =
    DOCUMENT_TEMPLATES.find((item) => item.type === templateType)?.title ||
    'Official HR Document';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isGenerating &&
          typeof onClose === 'function'
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-document-title"
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-800">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="generate-document-title"
                className="flex flex-wrap items-center gap-2 text-base font-bold text-gray-900 sm:text-lg"
              >
                Generate Official HR Document
                <Sparkles className="h-4 w-4 text-amber-600" />
              </h2>

              <p className="mt-1 truncate font-mono text-xs text-gray-500">
                {getDisplayText(employee.employeeId, 'N/A')} — {employeeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Close document generator"
            className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12 md:overflow-hidden">
          {/* Left: Controls */}
          <div className="space-y-5 border-b border-gray-200 p-4 sm:p-6 md:col-span-5 md:overflow-y-auto md:border-b-0 md:border-r">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Select Document Template
              </label>

              <div className="space-y-1.5">
                {DOCUMENT_TEMPLATES.map((template) => {
                  const selected = templateType === template.type;

                  return (
                    <button
                      key={template.type}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleTemplateChange(template.type)}
                      className={`w-full rounded-xl border p-3 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${selected
                          ? 'border-gray-900 bg-gray-100 text-gray-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {template.title}
                      </div>

                      <div className="mt-1 text-[11px] leading-relaxed text-gray-500">
                        {template.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effective Date */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Issue / Effective Date <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />

                <input
                  type="date"
                  required
                  value={effectiveDate}
                  disabled={isGenerating}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3.5 text-xs text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Custom Subject */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Custom Subject <span className="text-gray-500">(Optional)</span>
              </label>

              <input
                type="text"
                maxLength={200}
                value={customSubject}
                disabled={isGenerating}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Use the default subject or enter your own"
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
              />

              <p className="mt-1 text-right text-[10px] text-gray-500">
                {customSubject.length}/200
              </p>
            </div>

            {/* Promotion Designation */}
            {templateType === 'PROMOTION_LETTER' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Promoted Designation <span className="text-red-600">*</span>
                </label>

                <input
                  type="text"
                  maxLength={100}
                  value={newDesignation}
                  disabled={isGenerating}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. Senior Project Manager"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />
              </div>
            )}

            {/* Salary Fields */}
            {SALARY_TEMPLATES.includes(templateType) && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {templateType === 'OFFER_LETTER'
                    ? 'Offered Monthly Gross Salary (₹)'
                    : 'Revised Monthly Gross Salary (₹)'}{' '}
                  <span className="text-red-600">*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={newGrossSalary}
                  disabled={isGenerating}
                  onChange={(e) => setNewGrossSalary(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                />

                <p className="mt-1 text-[10px] text-gray-500">
                  Enter the monthly gross amount in INR.
                </p>
              </div>
            )}

            {/* Notice / Relieving Fields */}
            {NOTICE_TEMPLATES.includes(templateType) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Notice Days
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="365"
                    step="1"
                    value={noticeDays}
                    disabled={isGenerating}
                    onChange={(e) => setNoticeDays(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Relieving Date
                  </label>

                  <input
                    type="date"
                    value={lastWorkingDate}
                    disabled={isGenerating}
                    onChange={(e) => setLastWorkingDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Special Clauses / Remarks
              </label>

              <textarea
                rows={3}
                maxLength={3000}
                value={customRemarks}
                disabled={isGenerating}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="Optional custom terms or notes to include in the letter"
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
              />

              <p className="mt-1 text-right text-[10px] text-gray-500">
                {customRemarks.length}/3000
              </p>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex min-h-0 flex-col bg-gray-50 p-4 sm:p-6 md:col-span-7 md:overflow-y-auto">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Eye className="h-3.5 w-3.5 text-gray-700" />
                Live Letter Preview
              </span>

              <span className="rounded-full border border-gray-200 bg-white px-2 py-1 font-mono text-[10px] text-gray-600">
                A4 PDF
              </span>
            </div>

            {isPreviewLoading ? (
              <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="h-7 w-7 animate-spin text-gray-700" />
                <span className="text-xs">Updating document preview...</span>
              </div>
            ) : previewError ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                <AlertCircle className="h-7 w-7 text-red-700" />

                <p
                  role="alert"
                  className="max-w-sm text-xs leading-relaxed text-red-800"
                >
                  {previewError}
                </p>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    setPreviewError('');
                    setPreviewData(null);
                    setEffectiveDate((previous) => previous);
                    previewRequestId.current += 1;
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 hover:bg-gray-100"
                >
                  Review form fields
                </button>
              </div>
            ) : previewData ? (
              <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 font-sans text-xs text-gray-900 shadow-sm sm:p-6">
                {/* Letterhead */}
                <div className="mb-5 flex flex-col justify-between gap-3 border-b border-gray-300 pb-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-gray-800">
                      <Building2 className="h-5 w-5 shrink-0" />

                      <h3 className="text-sm font-bold tracking-wide text-gray-900">
                        {companyName}
                      </h3>
                    </div>

                    <p className="text-[10px] leading-relaxed text-gray-600">
                      Official Human Resources Department
                    </p>

                    {companyAddress && (
                      <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
                        {companyAddress}
                      </p>
                    )}

                    {companyContact && (
                      <p className="mt-1 break-words text-[10px] leading-relaxed text-gray-500">
                        {companyContact}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-left font-mono text-[10px] text-gray-500 sm:text-right">
                    <div>Date: {previewDate}</div>

                    <div className="mt-1 break-all">
                      Ref: {referenceNumber}
                    </div>
                  </div>
                </div>

                {/* Document title */}
                {previewData.title && (
                  <h4 className="mb-5 text-center text-sm font-bold uppercase tracking-wide text-gray-900">
                    {getDisplayText(previewData.title, templateTitle)}
                  </h4>
                )}

                {/* Recipient */}
                <div className="mb-5 space-y-1">
                  <div className="font-semibold text-gray-800">To,</div>

                  <div className="font-bold text-gray-900">
                    {previewName}
                  </div>

                  <div className="text-gray-600">
                    Employee ID: {previewEmployeeId}
                  </div>

                  <div className="text-gray-600">
                    Department: {previewDepartment}
                  </div>

                  {previewDesignation && (
                    <div className="text-gray-600">
                      Designation: {previewDesignation}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div className="mb-5 border-l-2 border-gray-800 bg-gray-50 py-2 pl-3 pr-2 font-bold leading-relaxed text-gray-900">
                  Subject:{' '}
                  {getDisplayText(
                    previewData.subject,
                    customSubject || templateTitle
                  )}
                </div>

                {/* Body */}
                <div className="min-h-32 space-y-3 text-[11px] leading-relaxed text-gray-700">
                  {previewData.bodyParagraphs.length > 0 ? (
                    previewData.bodyParagraphs.map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 20)}`}>
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="italic text-gray-500">
                      No preview content was returned for this document.
                    </p>
                  )}

                  {/* Terms returned by the API */}
                  {previewData.termsList.length > 0 && (
                    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                      <h5 className="mb-2 font-semibold text-gray-900">
                        Terms and Conditions
                      </h5>

                      <ul className="list-disc space-y-1 pl-4">
                        {previewData.termsList.map((term, index) => (
                          <li key={`${index}-${term.slice(0, 20)}`}>
                            {term}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {customRemarks.trim() && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-1 font-semibold text-gray-900">
                        Additional Remarks
                      </div>

                      <p className="whitespace-pre-wrap break-words">
                        {customRemarks.trim()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sign-off */}
                <div className="mt-8 flex flex-col justify-between gap-6 border-t border-gray-200 pt-4 text-[10px] text-gray-600 sm:flex-row sm:items-end">
                  <div>
                    <div>For {companyName}</div>

                    <div className="mb-1 mt-8 font-semibold text-gray-900">
                      Authorized Signatory
                    </div>

                    <div>Human Resources Department</div>
                  </div>

                  <div>
                    <div className="text-gray-500">
                      Employee Acknowledgement
                    </div>

                    <div className="mb-1 mt-8 font-semibold text-gray-700">
                      Signature: ________________
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-2 text-center text-[9px] text-gray-500">
                  Preview only — verify all details before issuing the official document.
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 text-center text-xs text-gray-500">
                <FileText className="h-8 w-8 text-gray-400" />
                <p>Select a template to view the document preview.</p>
              </div>
            )}

            {/* Download Footer */}
            <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
              <div className="flex items-start gap-2 text-[11px] text-gray-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-800" />

                <span>
                  Review the employee details, dates and document terms before
                  generating the PDF.
                </span>
              </div>

              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={
                  isGenerating ||
                  isPreviewLoading ||
                  !!previewError ||
                  !previewData
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Document...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <CheckCircle2 className="h-4 w-4" />
                    Generate & Download Official PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateDocumentModal;
