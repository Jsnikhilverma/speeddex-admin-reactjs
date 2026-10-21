
import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Maximize2,
  Film,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cmsApi } from '../../api/cmsApi';

const CATEGORIES = [
  { value: 'COMMERCIAL', label: 'Commercial High-Rise' },
  { value: 'RESIDENTIAL', label: 'Luxury Residential' },
  { value: 'INDUSTRIAL', label: 'Industrial & Warehouses' },
  { value: 'CIVIL', label: 'Civil Infrastructure' },
  { value: 'INFRASTRUCTURE', label: 'Heavy Infrastructure' },
  { value: 'OTHER', label: 'Specialized Construction' },
];

const STATUS_OPTIONS = [
  {
    value: 'UPCOMING',
    label: 'Upcoming / In Pipeline',
    desc: 'Planning, design, or pre-groundbreaking',
  },
  {
    value: 'ONGOING',
    label: 'Ongoing / Active Site',
    desc: 'Under active structural or MEP execution',
  },
  {
    value: 'COMPLETED',
    label: 'Completed / Delivered',
    desc: 'Successfully handed over to client',
  },
];

const DEFAULT_PROJECT_IMAGE =
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?q=80&w=2070&auto=format&fit=crop';

const EMPTY_FORM = {
  title: '',
  status: 'COMPLETED',
  category: 'COMMERCIAL',
  categoryLabel: 'Commercial High-Rise',
  location: 'Indore, MP',
  area: '',
  value: '',
  timeline: '',
  description: '',
  clientName: '',
  featuredImage: DEFAULT_PROJECT_IMAGE,
  mediaType: 'IMAGE',
  videoUrl: '',
  gallery: [],
  features: [],
  isFeatured: true,
  displayOrder: 0,
  isActive: true,
};

const normalizeCategory = (cat) => {
  if (!cat) return 'COMMERCIAL';

  const value = String(cat)
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  const validCategories = CATEGORIES.map((item) => item.value);

  if (validCategories.includes(value)) return value;
  if (value.includes('COMMERCIAL')) return 'COMMERCIAL';
  if (value.includes('CIVIL')) return 'CIVIL';
  if (value.includes('INDUST') || value.includes('WAREHOUSE')) {
    return 'INDUSTRIAL';
  }
  if (value.includes('RESIDEN') || value.includes('VILLA')) {
    return 'RESIDENTIAL';
  }
  if (value.includes('INFRA')) return 'INFRASTRUCTURE';

  return 'COMMERCIAL';
};

const normalizeStatus = (status) => {
  if (!status) return 'COMPLETED';

  const value = String(status).toUpperCase();

  if (['PLANNED', 'UPCOMING'].includes(value)) return 'UPCOMING';
  if (['IN_PROGRESS', 'ONGOING'].includes(value)) return 'ONGOING';

  return 'COMPLETED';
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-black placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-slate-800';

const sectionClass =
  'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';

export const ProjectModal = ({
  isOpen,
  onClose,
  project = null,
  onSuccess,
  showToast,
}) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (project) {
      const safeCategory = normalizeCategory(
        project.category || project.projectType
      );
      const categoryObj = CATEGORIES.find(
        (item) => item.value === safeCategory
      );

      const projectLocation = project.location;

      setFormData({
        ...EMPTY_FORM,
        title: project.title || project.name || '',
        status: normalizeStatus(project.status),
        category: safeCategory,
        categoryLabel:
          project.categoryLabel ||
          categoryObj?.label ||
          'Commercial High-Rise',
        location: projectLocation?.city
          ? `${projectLocation.city}, ${projectLocation.state || 'MP'}`
          : typeof projectLocation === 'string'
            ? projectLocation
            : 'Indore, MP',
        area: project.area || '',
        value:
          project.value ||
          project.budgetText ||
          (project.budget ? `₹${project.budget}` : ''),
        timeline: project.timeline || project.timelineText || '',
        description:
          project.description ||
          project.shortDescription ||
          project.detailedDescription ||
          '',
        clientName: project.clientName || project.client?.name || '',
        featuredImage:
          project.featuredImage ||
          project.thumbnailImage?.url ||
          project.coverImage?.url ||
          DEFAULT_PROJECT_IMAGE,
        mediaType: project.mediaType || 'IMAGE',
        videoUrl: project.videoUrl || '',
        gallery: Array.isArray(project.gallery) ? project.gallery : [],
        features: Array.isArray(project.features) ? project.features : [],
        isFeatured:
          project.isFeatured !== undefined ? project.isFeatured : true,
        displayOrder: project.displayOrder ?? 0,
        isActive:
          project.isActive !== undefined ? project.isActive : true,
      });
    } else {
      setFormData({ ...EMPTY_FORM });
    }

    setUploadError('');
    setNewFeatureText('');
    setIsSubmitting(false);
  }, [project, isOpen]);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFileUpload = async (event, targetField = 'featuredImage') => {
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
        throw new Error('Upload completed, but no file URL was returned.');
      }

      updateField(targetField, uploadedData.url);
      showToast?.('Image uploaded successfully.', 'success');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload image. Please try again.';

      setUploadError(message);
      showToast?.(message, 'error');
    } finally {
      setIsUploading(false);

      // Allows uploading the same file again.
      if (event.target) event.target.value = '';
    }
  };

  const handleAddFeature = () => {
    const feature = newFeatureText.trim();

    if (!feature) return;

    setFormData((previous) => ({
      ...previous,
      features: [...previous.features, feature],
    }));

    setNewFeatureText('');
  };

  const handleRemoveFeature = (index) => {
    setFormData((previous) => ({
      ...previous,
      features: previous.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    if (isSubmitting || isUploading) return;

    setUploadError('');

    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      const message = 'Project title is required.';
      setUploadError(message);
      showToast?.(message, 'error');
      return;
    }

    const payload = {
      ...formData,
      title: trimmedTitle,
      category: normalizeCategory(formData.category),
      status: normalizeStatus(formData.status),
      featuredImage:
        formData.featuredImage?.trim() || DEFAULT_PROJECT_IMAGE,
      features: formData.features.filter(
        (feature) => typeof feature === 'string' && feature.trim()
      ),
      gallery: formData.gallery,
    };

    try {
      setIsSubmitting(true);

      if (project?._id) {
        await cmsApi.updateProject(project._id, payload);
      } else {
        await cmsApi.createProject(payload);
      }

      showToast?.(
        project?._id
          ? 'Project updated successfully.'
          : 'Project published successfully.',
        'success'
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save project:', error);

      const message =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.errors?.[0]?.message ||
        error?.message ||
        'Failed to save project. Please check the fields and try again.';

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
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="relative my-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-black shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-black sm:text-lg">
                {project ? 'Edit Portfolio Project' : 'Add Showcase Project'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Manage upcoming, ongoing and completed construction projects.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close project form"
            className="shrink-0 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-black disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="project-modal-form"
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

          {/* Status */}
          <section className="space-y-3">
            <label className={labelClass}>Project Execution Status *</label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STATUS_OPTIONS.map((status) => {
                const selected = formData.status === status.value;

                const selectedStyle = {
                  UPCOMING: 'border-blue-500 bg-blue-50 ring-2 ring-blue-100',
                  ONGOING: 'border-amber-500 bg-amber-50 ring-2 ring-amber-100',
                  COMPLETED:
                    'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100',
                };

                const iconStyle = {
                  UPCOMING: 'text-blue-700',
                  ONGOING: 'text-amber-700',
                  COMPLETED: 'text-emerald-700',
                };

                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => updateField('status', status.value)}
                    aria-pressed={selected}
                    className={`rounded-xl border p-4 text-left transition ${selected
                      ? selectedStyle[status.value]
                      : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${selected
                          ? iconStyle[status.value]
                          : 'text-slate-600'
                          }`}
                      >
                        {status.value}
                      </span>

                      {selected ? (
                        <CheckCircle2
                          className={`h-4 w-4 ${iconStyle[status.value]}`}
                        />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-slate-300" />
                      )}
                    </div>

                    <p className="text-sm font-bold text-black">
                      {status.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {status.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Basic Information */}
          <section className={sectionClass}>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-black">
                Basic Project Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="project-title" className={labelClass}>
                  Project Title / Landmark Name *
                </label>
                <input
                  id="project-title"
                  type="text"
                  required
                  maxLength={200}
                  value={formData.title}
                  onChange={(event) =>
                    updateField('title', event.target.value)
                  }
                  placeholder="e.g. Apex Innovation Hub & Financial Tower"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="project-category" className={labelClass}>
                  Category Type
                </label>
                <select
                  id="project-category"
                  value={formData.category}
                  onChange={(event) => {
                    const selected = CATEGORIES.find(
                      (item) => item.value === event.target.value
                    );

                    setFormData((previous) => ({
                      ...previous,
                      category: event.target.value,
                      categoryLabel: selected?.label || event.target.value,
                    }));
                  }}
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="project-location" className={labelClass}>
                  Location (City / Region)
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="project-location"
                    type="text"
                    value={formData.location}
                    onChange={(event) =>
                      updateField('location', event.target.value)
                    }
                    placeholder="e.g. Super Corridor, Indore"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Specifications */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="project-area" className={labelClass}>
                Built-up Area
              </label>
              <div className="relative">
                <Maximize2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="project-area"
                  type="text"
                  value={formData.area}
                  onChange={(event) =>
                    updateField('area', event.target.value)
                  }
                  placeholder="1,450,000 Sq. Ft."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-value" className={labelClass}>
                Project Value / Budget
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="project-value"
                  type="text"
                  value={formData.value}
                  onChange={(event) =>
                    updateField('value', event.target.value)
                  }
                  placeholder="₹120 Cr"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-timeline" className={labelClass}>
                Timeline / Delivery
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="project-timeline"
                  type="text"
                  value={formData.timeline}
                  onChange={(event) =>
                    updateField('timeline', event.target.value)
                  }
                  placeholder="Expected Q4 2027"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="space-y-1.5">
            <label htmlFor="project-description" className={labelClass}>
              Project Overview / Summary
            </label>
            <textarea
              id="project-description"
              rows={4}
              value={formData.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              placeholder="Describe the project, construction techniques, scale and key details..."
              className={`${inputClass} resize-y`}
            />
          </section>

          {/* Featured Image and Video */}
          <section className={sectionClass}>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-black">
                Featured Cover Photo
              </h3>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(event) =>
                  updateField('featuredImage', event.target.value)
                }
                placeholder="https://example.com/project-cover.jpg"
                aria-label="Featured cover image URL"
                className={`${inputClass} min-w-0 flex-1`}
              />

              <label
                className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 ${isUploading ? 'pointer-events-none opacity-60' : ''
                  }`}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload Cover'}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading || isSubmitting}
                  onChange={(event) =>
                    handleFileUpload(event, 'featuredImage')
                  }
                />
              </label>
            </div>

            {formData.featuredImage && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={formData.featuredImage}
                  alt="Project cover preview"
                  loading="lazy"
                  className="max-h-64 w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_PROJECT_IMAGE;
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5 border-t border-slate-200 pt-4">
              <label htmlFor="project-video" className={labelClass}>
                <span className="inline-flex items-center gap-2">
                  <Film className="h-4 w-4 text-blue-700" />
                  Optional Video Walkthrough URL
                </span>
              </label>
              <input
                id="project-video"
                type="text"
                value={formData.videoUrl}
                onChange={(event) =>
                  updateField('videoUrl', event.target.value)
                }
                placeholder="/assets/project.mp4 or a YouTube embed URL"
                className={inputClass}
              />
            </div>
          </section>

          {/* Features */}
          <section className={sectionClass}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-black">
                Engineering Highlights & Features
              </h3>
            </div>

            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <span className="break-words">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      aria-label={`Remove ${feature}`}
                      className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newFeatureText}
                maxLength={150}
                onChange={(event) => setNewFeatureText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="e.g. Seismic-Resilient Steel Structures"
                aria-label="New engineering feature"
                className={`${inputClass} flex-1`}
              />

              <button
                type="button"
                onClick={handleAddFeature}
                disabled={!newFeatureText.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add Feature
              </button>
            </div>
          </section>

          {/* Visibility */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-black">
                  Active on Website
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Show in the public portfolio
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(event) =>
                  updateField('isActive', event.target.checked)
                }
                aria-label="Active on website"
                className="h-5 w-5 shrink-0 cursor-pointer accent-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-black">
                  Featured on Homepage
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Highlight in the top showcase
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(event) =>
                  updateField('isFeatured', event.target.checked)
                }
                aria-label="Featured on homepage"
                className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
              />
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-black">*</span> Required fields
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
              form="project-modal-form"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {project ? 'Update Project' : 'Publish Project'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
