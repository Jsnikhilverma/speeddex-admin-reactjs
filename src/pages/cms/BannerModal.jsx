
import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cmsApi } from '../../api/cmsApi';

const INITIAL_FORM = {
  title: '',
  subtitle: '',
  placement: 'HERO',
  mediaType: 'VIDEO',
  mediaUrl: '',
  thumbnailUrl: '',
  badge: '',
  ctaText: 'Explore Projects',
  ctaLink: '/projects',
  secondaryCtaText: 'Discuss Your Build',
  secondaryCtaLink: '/contact',
  mediaList: [],
  displayOrder: 0,
  isActive: true,
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?q=80&w=1200';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const labelClass =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800';

const sectionClass =
  'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';

export const BannerModal = ({
  isOpen,
  onClose,
  banner = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideType, setNewSlideType] = useState('IMAGE');
  const [newSlideCaption, setNewSlideCaption] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (banner) {
      setFormData({
        ...INITIAL_FORM,
        ...banner,
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        placement: banner.placement || 'HERO',
        mediaType: banner.mediaType || 'VIDEO',
        mediaUrl: banner.mediaUrl || '',
        thumbnailUrl: banner.thumbnailUrl || '',
        badge: banner.badge || '',
        ctaText: banner.ctaText || '',
        ctaLink: banner.ctaLink || '',
        secondaryCtaText: banner.secondaryCtaText || '',
        secondaryCtaLink: banner.secondaryCtaLink || '',
        mediaList: Array.isArray(banner.mediaList)
          ? banner.mediaList
          : [],
        displayOrder: banner.displayOrder ?? 0,
        isActive: banner.isActive ?? true,
      });
    } else {
      setFormData({ ...INITIAL_FORM, mediaList: [] });
    }

    setUploadError('');
    setNewSlideUrl('');
    setNewSlideType('IMAGE');
    setNewSlideCaption('');
  }, [banner, isOpen]);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.message ||
    fallback;

  const handleFileUpload = async (event, targetField = 'mediaUrl') => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again after an upload attempt.
    event.target.value = '';

    if (!file) return;

    if (targetField === 'mediaUrl') {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (
        (formData.mediaType === 'VIDEO' && !isVideo) ||
        (formData.mediaType === 'IMAGE' && !isImage)
      ) {
        setUploadError(
          `Please select a valid ${formData.mediaType.toLowerCase()} file.`
        );
        return;
      }
    }

    try {
      setIsUploading(true);
      setUploadError('');

      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const response = await cmsApi.uploadMedia(uploadForm);
      const uploadedData = response?.data?.data ?? response?.data;

      if (!uploadedData?.url) {
        throw new Error('Upload succeeded but no media URL was returned.');
      }

      setFormData((prev) => ({
        ...prev,
        [targetField]: uploadedData.url,
        ...(targetField === 'mediaUrl' && uploadedData.mediaType
          ? { mediaType: uploadedData.mediaType }
          : {}),
      }));
    } catch (error) {
      setUploadError(
        getErrorMessage(error, 'Failed to upload media file.')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMediaSlide = () => {
    const url = newSlideUrl.trim();

    if (!url) {
      setUploadError('Please enter a URL for the new slide.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      mediaList: [
        ...prev.mediaList,
        {
          mediaType: newSlideType,
          url,
          caption: newSlideCaption.trim(),
          order: prev.mediaList.length,
        },
      ],
    }));

    setNewSlideUrl('');
    setNewSlideCaption('');
    setUploadError('');
  };

  const handleRemoveMediaSlide = (index) => {
    setFormData((prev) => ({
      ...prev,
      mediaList: prev.mediaList
        .filter((_, itemIndex) => itemIndex !== index)
        .map((slide, order) => ({ ...slide, order })),
    }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (isSubmitting || isUploading) return;

    if (!formData.mediaUrl.trim()) {
      setUploadError(
        'Primary Media URL or file is required for the banner.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadError('');

      const payload = {
        ...formData,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        mediaUrl: formData.mediaUrl.trim(),
        mediaList: formData.mediaList.map((slide, order) => ({
          ...slide,
          order,
        })),
        displayOrder: Number(formData.displayOrder) || 0,
      };

      if (banner?._id) {
        await cmsApi.updateBanner(banner._id, payload);
      } else {
        await cmsApi.createBanner(payload);
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      setUploadError(
        getErrorMessage(error, 'Error saving banner.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting || isUploading) return;
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-modal-title"
        className="my-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl sm:rounded-3xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Film className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="banner-modal-title"
                className="text-base font-extrabold text-slate-950 sm:text-lg"
              >
                {banner ? 'Edit Website Banner' : 'Create New Website Banner'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Manage hero media, promotional banners and carousel slides.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting || isUploading}
            aria-label="Close banner modal"
            className="shrink-0 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-white p-4 text-slate-900 sm:p-6"
        >
          {uploadError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <p className="min-w-0 break-words">{uploadError}</p>
              <button
                type="button"
                onClick={() => setUploadError('')}
                aria-label="Dismiss error"
                className="ml-auto rounded-lg p-1 text-rose-700 hover:bg-rose-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Basic Information */}
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-extrabold text-slate-950">
                Basic Information
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Add the banner title, description and website placement.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="banner-title" className={labelClass}>
                  Banner Headline / Title
                </label>
                <input
                  id="banner-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. Next-Gen Infrastructure & Civil Engineering"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="banner-subtitle" className={labelClass}>
                  Subtitle / Narrative
                </label>
                <textarea
                  id="banner-subtitle"
                  rows={3}
                  value={formData.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  placeholder="Describe your construction services and projects..."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label htmlFor="banner-placement" className={labelClass}>
                  Placement Location
                </label>
                <select
                  id="banner-placement"
                  value={formData.placement}
                  onChange={(e) => updateField('placement', e.target.value)}
                  className={inputClass}
                >
                  <option value="HERO">Main Hero Banner</option>
                  <option value="HOME_PROMO">Homepage Promo Section</option>
                  <option value="POPUP">Notification / Modal Popup</option>
                  <option value="FOOTER_PROMO">Footer Promotional Banner</option>
                  <option value="OTHER">Other Custom Location</option>
                </select>
              </div>

              <div>
                <label htmlFor="banner-badge" className={labelClass}>
                  Badge / Tagline (Optional)
                </label>
                <input
                  id="banner-badge"
                  type="text"
                  value={formData.badge}
                  onChange={(e) => updateField('badge', e.target.value)}
                  placeholder="e.g. Trusted Construction Partner"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Primary Media */}
          <section className={sectionClass}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                  <Film className="h-4 w-4 text-blue-600" />
                  Primary Media Asset
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Select an image or video for your banner.
                </p>
              </div>

              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => updateField('mediaType', 'VIDEO')}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none ${formData.mediaType === 'VIDEO'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                    }`}
                >
                  <Film className="h-4 w-4" />
                  Video
                </button>

                <button
                  type="button"
                  onClick={() => updateField('mediaType', 'IMAGE')}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none ${formData.mediaType === 'IMAGE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                    }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Image
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="banner-media-url" className={labelClass}>
                Media URL
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="banner-media-url"
                  type="text"
                  value={formData.mediaUrl}
                  onChange={(e) => updateField('mediaUrl', e.target.value)}
                  placeholder={
                    formData.mediaType === 'VIDEO'
                      ? 'https://example.com/hero.mp4'
                      : 'https://example.com/banner.webp'
                  }
                  className={`${inputClass} min-w-0 flex-1`}
                />

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload File'}

                  <input
                    type="file"
                    accept={formData.mediaType === 'VIDEO' ? 'video/*' : 'image/*'}
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(e) => handleFileUpload(e)}
                  />
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Supported type: {formData.mediaType === 'VIDEO' ? 'video files' : 'image files'}.
                Maximum file size depends on your server upload configuration.
              </p>
            </div>

            {formData.mediaUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                  Media Preview
                </div>

                {formData.mediaType === 'VIDEO' ? (
                  <video
                    key={formData.mediaUrl}
                    src={formData.mediaUrl}
                    controls
                    playsInline
                    className="max-h-64 w-full bg-slate-950 object-contain"
                  >
                    Your browser does not support HTML5 video.
                  </video>
                ) : (
                  <img
                    src={formData.mediaUrl}
                    alt="Banner preview"
                    className="max-h-64 w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                )}
              </div>
            )}
          </section>

          {/* Carousel Slides */}
          <section className={sectionClass}>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  Multiple Media Slides
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Add optional images or videos for your carousel.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-600">
                {formData.mediaList.length} slide(s)
              </span>
            </div>

            {formData.mediaList.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {formData.mediaList.map((slide, index) => (
                  <div
                    key={`${slide.url}-${index}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {slide.mediaType === 'VIDEO' ? (
                        <Film className="h-5 w-5 text-blue-600" />
                      ) : (
                        <img
                          src={slide.url || FALLBACK_IMAGE}
                          alt={slide.caption || `Slide ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">
                        Slide #{index + 1} · {slide.mediaType}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-600">
                        {slide.caption || slide.url}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMediaSlide(index)}
                      aria-label={`Remove slide ${index + 1}`}
                      className="shrink-0 rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="slide-type" className={labelClass}>
                  Media Type
                </label>
                <select
                  id="slide-type"
                  value={newSlideType}
                  onChange={(e) => setNewSlideType(e.target.value)}
                  className={inputClass}
                >
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="slide-url" className={labelClass}>
                  Slide URL
                </label>
                <input
                  id="slide-url"
                  type="text"
                  value={newSlideUrl}
                  onChange={(e) => setNewSlideUrl(e.target.value)}
                  placeholder="Enter media URL"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="slide-caption" className={labelClass}>
                  Caption
                </label>
                <input
                  id="slide-caption"
                  type="text"
                  value={newSlideCaption}
                  onChange={(e) => setNewSlideCaption(e.target.value)}
                  placeholder="Optional caption"
                  className={inputClass}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddMediaSlide}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Slide
                </button>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section>
            <h3 className="mb-4 text-sm font-extrabold text-slate-950">
              Call-to-Action Buttons
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="cta-text" className={labelClass}>
                  Primary Button Text
                </label>
                <input
                  id="cta-text"
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => updateField('ctaText', e.target.value)}
                  placeholder="Explore Projects"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="cta-link" className={labelClass}>
                  Primary Button Link
                </label>
                <input
                  id="cta-link"
                  type="text"
                  value={formData.ctaLink}
                  onChange={(e) => updateField('ctaLink', e.target.value)}
                  placeholder="/projects"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="secondary-cta-text" className={labelClass}>
                  Secondary Button Text
                </label>
                <input
                  id="secondary-cta-text"
                  type="text"
                  value={formData.secondaryCtaText}
                  onChange={(e) => updateField('secondaryCtaText', e.target.value)}
                  placeholder="Discuss Your Build"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="secondary-cta-link" className={labelClass}>
                  Secondary Button Link
                </label>
                <input
                  id="secondary-cta-link"
                  type="text"
                  value={formData.secondaryCtaLink}
                  onChange={(e) => updateField('secondaryCtaLink', e.target.value)}
                  placeholder="/contact"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="display-order" className={labelClass}>
                Display Order
              </label>
              <input
                id="display-order"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => updateField('displayOrder', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Active on Website
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Hide or show this banner.
                </p>
              </div>

              <input
                type="checkbox"
                checked={Boolean(formData.isActive)}
                onChange={(e) => updateField('isActive', e.target.checked)}
                aria-label="Active on website"
                className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
              />
            </div>
          </section>
        </form>

        {/* Footer */}
        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting || isUploading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {banner ? 'Update Banner' : 'Publish Banner'}
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default BannerModal;
