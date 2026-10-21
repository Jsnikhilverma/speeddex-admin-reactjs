
import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  MessageSquareQuote,
  Star,
  AlertCircle,
  Loader2,
  User,
  Building,
} from 'lucide-react';
import { cmsApi } from '../../api/cmsApi';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop';

const EMPTY_FORM = {
  name: '',
  role: '',
  company: '',
  project: '',
  avatar: DEFAULT_AVATAR,
  quote: '',
  rating: 5,
  isFeatured: true,
  displayOrder: 0,
  isActive: true,
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-black placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-slate-800';

export const TestimonialModal = ({
  isOpen,
  onClose,
  testimonial = null,
  onSuccess,
  showToast,
}) => {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (testimonial) {
      setFormData({
        ...EMPTY_FORM,
        name: testimonial.name || testimonial.clientName || '',
        role: testimonial.role || testimonial.clientRole || '',
        company:
          testimonial.company || testimonial.clientCompany || '',
        project:
          testimonial.project || testimonial.relatedProject || '',
        avatar:
          testimonial.avatar ||
          testimonial.avatarImage?.url ||
          DEFAULT_AVATAR,
        quote: testimonial.quote || '',
        rating: Math.min(
          5,
          Math.max(1, Number(testimonial.rating) || 5)
        ),
        isFeatured:
          testimonial.isFeatured !== undefined
            ? testimonial.isFeatured
            : true,
        displayOrder: testimonial.displayOrder ?? 0,
        isActive:
          testimonial.isActive !== undefined
            ? testimonial.isActive
            : true,
      });
    } else {
      setFormData({ ...EMPTY_FORM });
    }

    setUploadError('');
    setIsSubmitting(false);
  }, [testimonial, isOpen]);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError('');

      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const response = await cmsApi.uploadMedia(uploadForm);
      const uploadedData = response?.data?.data || response?.data;

      if (!uploadedData?.url) {
        throw new Error(
          'Image uploaded, but the server did not return a file URL.'
        );
      }

      updateField('avatar', uploadedData.url);
      showToast?.('Avatar uploaded successfully.', 'success');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload avatar image. Please try again.';

      setUploadError(message);
      showToast?.(message, 'error');
    } finally {
      setIsUploading(false);

      // Allows selecting the same file again.
      if (event.target) event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    if (isSubmitting || isUploading) return;

    setUploadError('');

    const name = formData.name.trim();
    const role = formData.role.trim();
    const quote = formData.quote.trim();

    if (!name) {
      setUploadError('Client name is required.');
      return;
    }

    if (!role) {
      setUploadError('Role/designation is required.');
      return;
    }

    if (!quote) {
      setUploadError('Testimonial quote is required.');
      return;
    }

    const payload = {
      ...formData,
      name,
      role,
      company: formData.company.trim(),
      project: formData.project.trim(),
      quote,
      rating: Number(formData.rating),
      avatar: formData.avatar.trim(),
    };

    try {
      setIsSubmitting(true);

      if (testimonial?._id) {
        await cmsApi.updateTestimonial(testimonial._id, payload);
      } else {
        await cmsApi.createTestimonial(payload);
      }

      showToast?.(
        testimonial?._id
          ? 'Testimonial updated successfully.'
          : 'Testimonial published successfully.',
        'success'
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save testimonial:', error);

      const message =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.errors?.[0]?.message ||
        error?.message ||
        'Failed to save testimonial. Please try again.';

      setUploadError(message);
      showToast?.(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting &&
          !isUploading
        ) {
          onClose();
        }
      }}
    >
      <div className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-black shadow-2xl sm:rounded-3xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <MessageSquareQuote className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-black sm:text-lg">
                {testimonial
                  ? 'Edit Client Testimonial'
                  : 'Add Client Testimonial'}
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Manage client reviews and testimonials displayed on your website.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close testimonial form"
            className="shrink-0 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-black disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="testimonial-modal-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-white p-5 sm:p-6"
        >
          {uploadError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <span className="break-words">{uploadError}</span>
            </div>
          )}

          {/* Star Rating */}
          <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <label className={labelClass}>Client Star Rating *</label>
              <p className="mt-1 text-xs text-slate-600">
                Select a rating between one and five stars.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => updateField('rating', starValue)}
                  aria-label={`Give ${starValue} star${starValue > 1 ? 's' : ''}`}
                  aria-pressed={formData.rating === starValue}
                  className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <Star
                    className={`h-7 w-7 ${starValue <= formData.rating
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                      }`}
                  />
                </button>
              ))}

              <span className="ml-2 text-sm font-bold text-amber-900">
                {formData.rating} / 5 Stars
              </span>
            </div>
          </section>

          {/* Client Details */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-black">
              Client Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="testimonial-name" className={labelClass}>
                  Client Name *
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />

                  <input
                    id="testimonial-name"
                    type="text"
                    required
                    maxLength={150}
                    value={formData.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="e.g. Robert Vance"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="testimonial-role" className={labelClass}>
                  Role / Designation *
                </label>

                <input
                  id="testimonial-role"
                  type="text"
                  required
                  maxLength={150}
                  value={formData.role}
                  onChange={(event) =>
                    updateField('role', event.target.value)
                  }
                  placeholder="e.g. Managing Director"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="testimonial-company" className={labelClass}>
                  Company / Organization
                </label>

                <div className="relative">
                  <Building className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />

                  <input
                    id="testimonial-company"
                    type="text"
                    maxLength={200}
                    value={formData.company}
                    onChange={(event) =>
                      updateField('company', event.target.value)
                    }
                    placeholder="e.g. Vance Global Development"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="testimonial-project" className={labelClass}>
                  Project / Endorsement
                </label>

                <input
                  id="testimonial-project"
                  type="text"
                  maxLength={200}
                  value={formData.project}
                  onChange={(event) =>
                    updateField('project', event.target.value)
                  }
                  placeholder="e.g. Commercial Tower Project"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Avatar */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div>
              <h3 className="text-sm font-bold text-black">
                Client Profile Photo
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Upload a photo or paste an image URL.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <img
                src={formData.avatar || DEFAULT_AVATAR}
                alt="Client avatar preview"
                className="h-20 w-20 shrink-0 rounded-full border-2 border-amber-400 bg-slate-100 object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_AVATAR;
                }}
              />

              <div className="w-full min-w-0 flex-1 space-y-3">
                <label
                  htmlFor="testimonial-avatar"
                  className={labelClass}
                >
                  Avatar Image URL
                </label>

                <input
                  id="testimonial-avatar"
                  type="text"
                  value={formData.avatar}
                  onChange={(event) =>
                    updateField('avatar', event.target.value)
                  }
                  placeholder="https://example.com/avatar.jpg"
                  className={inputClass}
                />

                <label
                  className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100 ${isUploading || isSubmitting
                      ? 'pointer-events-none opacity-50'
                      : ''
                    }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Avatar
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading || isSubmitting}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Quote */}
          <section className="space-y-2">
            <label htmlFor="testimonial-quote" className={labelClass}>
              Client Quote / Feedback *
            </label>

            <textarea
              id="testimonial-quote"
              required
              rows={5}
              maxLength={3000}
              value={formData.quote}
              onChange={(event) =>
                updateField('quote', event.target.value)
              }
              placeholder="Enter the client's feedback about the project, quality, communication and delivery..."
              className={`${inputClass} resize-y`}
            />

            <p className="text-right text-xs text-slate-500">
              {formData.quote.length} / 3000 characters
            </p>
          </section>

          {/* Visibility */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-black">
                  Active on Website
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Display this testimonial in the public reviews section.
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(event) =>
                  updateField('isActive', event.target.checked)
                }
                aria-label="Active on website"
                className="h-5 w-5 shrink-0 cursor-pointer accent-amber-600"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-black">
                  Featured Testimonial
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Mark this review as a featured testimonial.
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(event) =>
                  updateField('isFeatured', event.target.checked)
                }
                aria-label="Featured testimonial"
                className="h-5 w-5 shrink-0 cursor-pointer accent-amber-600"
              />
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-600">
            <span className="font-bold text-black">*</span> Required fields
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="testimonial-modal-form"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : testimonial ? (
                'Update Testimonial'
              ) : (
                'Publish Testimonial'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialModal;
