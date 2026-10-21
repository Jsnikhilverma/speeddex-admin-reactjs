
import React, { useEffect, useRef, useState } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  FileUp,
  X,
  AlertCircle,
  Loader2,
  Check,
  Paperclip,
  FileText,
  Trash2,
} from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'doc',
  'docx',
];

const DOCUMENT_TYPES = [
  { value: 'APPOINTMENT_LETTER', label: 'Appointment Letter' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'RESUME', label: 'Resume / CV' },
  { value: 'ID_PROOF_AADHAAR', label: 'Aadhaar Card' },
  { value: 'ID_PROOF_PAN', label: 'PAN Card' },
  { value: 'ID_PROOF_PASSPORT', label: 'Passport' },
  { value: 'ID_PROOF_VOTER_ID', label: 'Voter ID' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'EDUCATION_CERTIFICATE', label: 'Educational Certificate' },
  { value: 'EXPERIENCE_LETTER', label: 'Experience Letter' },
  { value: 'SALARY_SLIP_PREVIOUS', label: 'Previous Salary Slip' },
  { value: 'POLICE_VERIFICATION', label: 'Police Verification' },
  { value: 'MEDICAL_FITNESS', label: 'Medical Fitness Report' },
  { value: 'OTHER', label: 'Other Official Document' },
];

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  if (employee.fullName?.trim()) {
    return employee.fullName.trim();
  }

  const firstName = employee.name?.firstName || '';
  const lastName = employee.name?.lastName || '';
  const name = `${firstName} ${lastName}`.trim();

  return name || employee.employeeId || 'Employee';
};

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Failed to upload document. Please try again.'
  );
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '';

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const validateFile = (selectedFile) => {
  if (!selectedFile) {
    return 'Please select a file to upload.';
  }

  const extension = selectedFile.name
    .split('.')
    .pop()
    ?.toLowerCase();

  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Unsupported file type. Please select a PDF, image, DOC or DOCX file.';
  }

  if (selectedFile.size === 0) {
    return 'The selected file is empty. Please choose another file.';
  }

  if (selectedFile.size > MAX_FILE_SIZE) {
    return 'File size must not exceed 10 MB.';
  }

  return '';
};

export const UploadDocumentModal = ({
  isOpen,
  onClose,
  employee,
  onUploaded,
}) => {
  const { showToast } = useToast();

  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('APPOINTMENT_LETTER');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDocumentType('APPOINTMENT_LETTER');
    setDescription('');
    setFile(null);
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, employee?._id]);

  if (!isOpen || !employee) return null;

  const handleClose = () => {
    if (submittingRef.current) return;

    resetForm();
    onClose?.();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    setError('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      event.target.value = '';
      setError(validationError);
      return;
    }

    setFile(selectedFile);

    // Use the file name as a helpful default title.
    setTitle((currentTitle) => {
      if (currentTitle.trim()) return currentTitle;

      const nameWithoutExtension = selectedFile.name.replace(/\.[^.]+$/, '');
      return nameWithoutExtension.slice(0, 150);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    setError('');

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!employee?._id) {
      setError('Employee information is missing. Please reopen the modal.');
      return;
    }

    if (!cleanTitle) {
      setError('Document title is required.');
      return;
    }

    if (cleanTitle.length > 150) {
      setError('Document title cannot exceed 150 characters.');
      return;
    }

    if (cleanDescription.length > 1000) {
      setError('Description cannot exceed 1000 characters.');
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append('title', cleanTitle);
      formData.append('documentType', documentType);
      formData.append('description', cleanDescription);
      formData.append('file', file);

      await employeeApi.uploadDocument(employee._id, formData);

      showToast('Document uploaded successfully.', 'success');

      resetForm();
      onUploaded?.();
      onClose?.();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50';

  const labelClass =
    'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-document-title"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/50 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <FileUp className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="upload-document-title"
                className="font-['Outfit'] text-lg font-bold text-white"
              >
                Upload Document
              </h2>

              <p className="truncate font-mono text-xs text-slate-400">
                {employee.employeeId || 'No Employee ID'} ·{' '}
                {getEmployeeName(employee)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close upload document modal"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto p-4 sm:p-6"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Document title */}
          <div>
            <label htmlFor="upload-document-name" className={labelClass}>
              Document Title <span className="text-amber-400">*</span>
            </label>

            <input
              id="upload-document-name"
              type="text"
              required
              maxLength={150}
              autoComplete="off"
              placeholder="e.g. Appointment Letter, Degree Certificate"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              disabled={isSubmitting}
            />

            <p className="mt-1 text-right text-[10px] text-slate-500">
              {title.length}/150
            </p>
          </div>

          {/* Document category */}
          <div>
            <label htmlFor="upload-document-type" className={labelClass}>
              Document Category <span className="text-amber-400">*</span>
            </label>

            <select
              id="upload-document-type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className={inputClass}
              required
              disabled={isSubmitting}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* File selection */}
          <div>
            <label htmlFor="upload-document-file" className={labelClass}>
              File Attachment <span className="text-amber-400">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              id="upload-document-file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />

            <label
              htmlFor="upload-document-file"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-800 bg-slate-950/40 hover:border-amber-500/50'
                } ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            >
              {file ? (
                <>
                  <FileText className="mb-2 h-6 w-6 text-emerald-400" />

                  <span className="max-w-full break-all text-xs font-semibold text-white">
                    {file.name}
                  </span>

                  <span className="mt-1 text-[10px] text-slate-400">
                    {formatFileSize(file.size)}
                  </span>

                  <span className="mt-2 text-[10px] text-emerald-400">
                    File selected successfully
                  </span>
                </>
              ) : (
                <>
                  <Paperclip className="mb-2 h-6 w-6 text-amber-400" />

                  <span className="text-xs font-semibold text-white">
                    Choose a file or click to browse
                  </span>

                  <span className="mt-1 text-[10px] text-slate-500">
                    PDF, JPG, PNG, WEBP, DOC or DOCX
                  </span>

                  <span className="mt-1 text-[10px] text-slate-500">
                    Maximum file size: 10 MB
                  </span>
                </>
              )}
            </label>

            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError('');

                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={isSubmitting}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-rose-400 transition-colors hover:text-rose-300 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove selected file
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="upload-document-description" className={labelClass}>
              Description / Notes (Optional)
            </label>

            <textarea
              id="upload-document-description"
              rows={3}
              maxLength={1000}
              placeholder="e.g. Countersigned copy received on joining"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClass} resize-y`}
              disabled={isSubmitting}
            />

            <p className="mt-1 text-right text-[10px] text-slate-500">
              {description.length}/1000
            </p>
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 text-xs text-slate-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
            <span>
              Only upload documents you are authorized to store. File type,
              size, and access permissions must also be validated by the
              backend.
            </span>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 font-['Outfit'] text-xs font-bold text-slate-950 shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
