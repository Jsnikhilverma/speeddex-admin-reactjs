
import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Film,
  Building2,
  MessageSquareQuote,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Layers,
  Sparkles,
  MapPin,
  Maximize2,
  Calendar,
  DollarSign,
  Star,
  Clock,
  HardHat,
} from 'lucide-react';

import { cmsApi } from '../../api/cmsApi';
import { useToast } from '../../context/ToastContext';
import { BannerModal } from './BannerModal';
import { ProjectModal } from './ProjectModal';
import { TestimonialModal } from './TestimonialModal';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?q=80&w=1200';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300';

const PAGE =
  'min-h-screen space-y-6 bg-white text-slate-900';

const CARD =
  'rounded-2xl border border-slate-200 bg-white shadow-sm';

const INPUT =
  'rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const SMALL_BUTTON =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60';

const formatLocation = (loc) => {
  if (!loc) return 'Indore, MP';
  if (typeof loc === 'string') return loc;

  if (typeof loc === 'object') {
    if (loc.city && loc.state) return `${loc.city}, ${loc.state}`;
    if (loc.city) return loc.city;
    if (loc.address) return loc.address;
  }

  return 'Indore, MP';
};

const unwrapList = (response, key) => {
  const root = response?.data ?? response;
  const data = root?.data ?? root;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];

  return [];
};

const safeText = (value) =>
  typeof value === 'string' ? value.toLowerCase() : '';

export const CmsPage = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('banners');

  const [banners, setBanners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');
  const [bannerPlacementFilter, setBannerPlacementFilter] = useState('ALL');

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  const [busyItems, setBusyItems] = useState({});

  const fetchAllData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    setErrorMessage('');

    try {
      const [bannersRes, projectsRes, testimonialsRes] =
        await Promise.allSettled([
          cmsApi.getBanners({ limit: 100 }),
          cmsApi.getProjects({ limit: 100 }),
          cmsApi.getTestimonials({ limit: 100 }),
        ]);

      let failed = false;

      if (bannersRes.status === 'fulfilled') {
        setBanners(unwrapList(bannersRes.value, 'banners'));
      } else {
        failed = true;
      }

      if (projectsRes.status === 'fulfilled') {
        setProjects(unwrapList(projectsRes.value, 'projects'));
      } else {
        failed = true;
      }

      if (testimonialsRes.status === 'fulfilled') {
        setTestimonials(
          unwrapList(testimonialsRes.value, 'testimonials')
        );
      } else {
        failed = true;
      }

      if (failed) {
        setErrorMessage(
          'Some CMS content could not be loaded. Please refresh and try again.'
        );
        showToast('Some CMS content could not be loaded', 'error');
      }
    } catch (error) {
      setErrorMessage('Unable to load CMS content. Please try again.');
      showToast('Failed to load CMS content from server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const runAction = async (key, action, successMessage, errorMessage) => {
    if (busyItems[key]) return;

    setBusyItems((prev) => ({ ...prev, [key]: true }));

    try {
      await action();
      showToast(successMessage, 'success');
      await fetchAllData(false);
    } catch (error) {
      showToast(errorMessage, 'error');
    } finally {
      setBusyItems((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleBanner = (id) =>
    runAction(
      `banner-${id}`,
      () => cmsApi.toggleBannerStatus(id),
      'Banner visibility updated',
      'Error updating banner status'
    );

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    await runAction(
      `banner-${id}`,
      () => cmsApi.deleteBanner(id),
      'Banner deleted successfully',
      'Failed to delete banner'
    );
  };

  const handleToggleProject = (id) =>
    runAction(
      `project-${id}`,
      () => cmsApi.toggleProjectStatus(id),
      'Project visibility updated',
      'Error updating project status'
    );

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    await runAction(
      `project-${id}`,
      () => cmsApi.deleteProject(id),
      'Project deleted successfully',
      'Failed to delete project'
    );
  };

  const handleToggleTestimonial = (id) =>
    runAction(
      `testimonial-${id}`,
      () => cmsApi.toggleTestimonialStatus(id),
      'Testimonial visibility updated',
      'Error updating testimonial status'
    );

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    await runAction(
      `testimonial-${id}`,
      () => cmsApi.deleteTestimonial(id),
      'Testimonial deleted successfully',
      'Failed to delete testimonial'
    );
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredBanners = banners.filter((banner) => {
    if (
      bannerPlacementFilter !== 'ALL' &&
      banner.placement !== bannerPlacementFilter
    ) {
      return false;
    }

    if (!query) return true;

    return [
      banner.title,
      banner.subtitle,
      banner.placement,
      banner.badge,
    ].some((value) => safeText(value).includes(query));
  });

  const filteredProjects = projects.filter((project) => {
    if (
      projectStatusFilter !== 'ALL' &&
      String(project.status || '').toUpperCase() !== projectStatusFilter
    ) {
      return false;
    }

    if (!query) return true;

    return [
      project.title,
      project.category,
      project.categoryLabel,
      formatLocation(project.location),
      project.description,
    ].some((value) => safeText(value).includes(query));
  });

  const filteredTestimonials = testimonials.filter((testimonial) => {
    if (!query) return true;

    return [
      testimonial.name,
      testimonial.role,
      testimonial.company,
      testimonial.project,
      testimonial.quote,
    ].some((value) => safeText(value).includes(query));
  });

  const activeBannersCount = banners.filter((item) => item.isActive).length;
  const videoBannersCount = banners.filter(
    (item) => item.mediaType === 'VIDEO'
  ).length;

  const completedProjectsCount = projects.filter(
    (item) => item.status === 'COMPLETED'
  ).length;

  const ongoingProjectsCount = projects.filter(
    (item) => item.status === 'ONGOING'
  ).length;

  const upcomingProjectsCount = projects.filter(
    (item) => item.status === 'UPCOMING'
  ).length;

  const openBannerModal = (banner = null) => {
    setEditingBanner(banner);
    setIsBannerModalOpen(true);
  };

  const openProjectModal = (project = null) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const openTestimonialModal = (testimonial = null) => {
    setEditingTestimonial(testimonial);
    setIsTestimonialModalOpen(true);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const metricCard = (label, value, description, icon, accent) => {
    const Icon = icon;

    return (
      <div className={`${CARD} flex items-center justify-between gap-3 p-5`}>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    );
  };

  const tabButton = (tab, label, count, icon, activeColor) => {
    const Icon = icon;
    const selected = activeTab === tab;

    return (
      <button
        key={tab}
        type="button"
        onClick={() => changeTab(tab)}
        aria-pressed={selected}
        className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition ${selected
          ? `bg-white text-${activeColor}-700 shadow-sm ring-1 ring-slate-200`
          : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
          }`}
      >
        <Icon className="h-4 w-4" />
        {label} ({count})
      </button>
    );
  };

  const emptyState = (icon, title, description, actionLabel, onAction) => {
    const Icon = icon;

    return (
      <div className={`${CARD} px-5 py-16 text-center`}>
        <Icon className="mx-auto mb-3 h-12 w-12 text-slate-400" />
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <p className="mx-auto mt-2 mb-5 max-w-sm text-sm leading-relaxed text-slate-600">
          {description}
        </p>
        <button
          type="button"
          onClick={onAction}
          className={`${SMALL_BUTTON} bg-blue-600 px-5 py-3 text-white hover:bg-blue-700`}
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    );
  };

  return (
    <div className={PAGE}>
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
              <Globe className="h-4 w-4" />
              Super Admin CMS
            </span>
            <span className="text-xs font-medium text-slate-500">
              Public Website Control
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Website Content &amp; Showcase Hub
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Manage website banners, construction projects and client testimonials
            from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchAllData()}
            disabled={isLoading}
            className={`${SMALL_BUTTON} border border-slate-300 bg-white px-4 py-3 text-slate-800 hover:bg-slate-50`}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          {activeTab === 'banners' && (
            <button
              type="button"
              onClick={() => openBannerModal()}
              className={`${SMALL_BUTTON} bg-blue-600 px-4 py-3 text-white hover:bg-blue-700`}
            >
              <Plus className="h-4 w-4" />
              Add Hero / Banner
            </button>
          )}

          {activeTab === 'projects' && (
            <button
              type="button"
              onClick={() => openProjectModal()}
              className={`${SMALL_BUTTON} bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700`}
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          )}

          {activeTab === 'testimonials' && (
            <button
              type="button"
              onClick={() => openTestimonialModal()}
              className={`${SMALL_BUTTON} bg-amber-400 px-4 py-3 text-slate-950 hover:bg-amber-500`}
            >
              <Plus className="h-4 w-4" />
              Add Testimonial
            </button>
          )}
        </div>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCard(
          'Website Banners',
          banners.length,
          `${activeBannersCount} active · ${videoBannersCount} videos`,
          Film,
          'bg-blue-50 text-blue-700'
        )}

        {metricCard(
          'Upcoming Projects',
          upcomingProjectsCount,
          'In planning',
          Clock,
          'bg-indigo-50 text-indigo-700'
        )}

        {metricCard(
          'Ongoing Sites',
          ongoingProjectsCount,
          'Active construction projects',
          HardHat,
          'bg-amber-50 text-amber-700'
        )}

        {metricCard(
          'Completed & Reviews',
          `${completedProjectsCount} / ${testimonials.length}`,
          'Completed projects / testimonials',
          CheckCircle2,
          'bg-emerald-50 text-emerald-700'
        )}
      </section>

      {/* Tabs and Filters */}
      <section className="space-y-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-slate-100 p-1.5">
            {tabButton('banners', 'Hero & Banners', banners.length, Film, 'blue')}
            {tabButton('projects', 'Projects Portfolio', projects.length, Building2, 'emerald')}
            {tabButton(
              'testimonials',
              'Testimonials',
              testimonials.length,
              MessageSquareQuote,
              'amber'
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {activeTab === 'projects' && (
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setProjectStatusFilter(status)}
                    className={`rounded-lg px-2.5 py-2 text-xs font-bold transition ${projectStatusFilter === status
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-white hover:text-slate-950'
                      }`}
                  >
                    {status === 'ALL'
                      ? 'All'
                      : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'banners' && (
              <select
                aria-label="Filter banner placement"
                value={bannerPlacementFilter}
                onChange={(event) => setBannerPlacementFilter(event.target.value)}
                className={`${INPUT} min-w-40`}
              >
                <option value="ALL">All Placements</option>
                <option value="HERO">Hero Banners</option>
                <option value="HOME_PROMO">Promo Banners</option>
                <option value="POPUP">Popups</option>
              </select>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                aria-label="Search CMS content"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search items..."
                className={`${INPUT} w-full pl-9 sm:w-56`}
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => fetchAllData()}
              className="font-bold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}
      </section>

      {isLoading && (
        <div className={`${CARD} flex items-center justify-center gap-3 p-12 text-sm font-semibold text-slate-600`}>
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          Loading website content...
        </div>
      )}

      {/* Banners */}
      {!isLoading && activeTab === 'banners' && (
        filteredBanners.length === 0 ? (
          emptyState(
            Film,
            'No Banners Found',
            'Add your first hero video, image banner or promotional banner.',
            'Create Banner',
            () => openBannerModal()
          )
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredBanners.map((banner) => (
              <article
                key={banner._id}
                className={`${CARD} group flex min-w-0 flex-col overflow-hidden transition hover:shadow-lg`}
              >
                <div className="relative flex h-56 items-center justify-center overflow-hidden bg-slate-100">
                  {banner.mediaType === 'VIDEO' && banner.mediaUrl ? (
                    <video
                      src={banner.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={banner.mediaUrl || FALLBACK_IMAGE}
                      alt={banner.title || 'Website banner'}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  )}

                  {/* <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-[11px] font-bold text-white">
                      {banner.mediaType === 'VIDEO' ? (
                        <Film className="h-3.5 w-3.5 text-blue-300" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-emerald-300" />
                      )}
                      {banner.mediaType === 'VIDEO' ? 'VIDEO BANNER' : 'IMAGE BANNER'}
                    </span>

                    <span className="rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white">
                      {banner.placement || 'UNSPECIFIED'}
                    </span>
                  </div> */}

                  <button
                    type="button"
                    disabled={!!busyItems[`banner-${banner._id}`]}
                    onClick={() => handleToggleBanner(banner._id)}
                    className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60 ${banner.isActive ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                  >
                    {busyItems[`banner-${banner._id}`]
                      ? 'Updating...'
                      : banner.isActive ? 'Active' : 'Inactive'}
                  </button>

                  {banner.mediaList?.length > 0 && (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-[11px] font-bold text-white">
                      <Layers className="h-3.5 w-3.5" />
                      {banner.mediaList.length} slides
                    </span>
                  )}
                </div>

                <div className="flex-1 p-5">
                  {banner.badge && (
                    <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-700">
                      {banner.badge}
                    </p>
                  )}

                  <h3 className="break-words text-base font-bold text-slate-950">
                    {banner.title || 'Untitled Banner'}
                  </h3>

                  {banner.subtitle && (
                    <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-slate-600">
                      {banner.subtitle}
                    </p>
                  )}

                  {(banner.ctaText || banner.ctaLink) && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
                      {banner.ctaText && (
                        <span className="font-bold">{banner.ctaText}</span>
                      )}
                      {banner.ctaLink && (
                        <p className="mt-1 break-all text-xs text-blue-800">
                          {banner.ctaLink}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="text-xs font-medium text-slate-500">
                    Display order: {banner.displayOrder ?? 0}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openBannerModal(banner)}
                      className={`${SMALL_BUTTON} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!!busyItems[`banner-${banner._id}`]}
                      onClick={() => handleDeleteBanner(banner._id)}
                      aria-label="Delete banner"
                      className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </section>
        )
      )}

      {/* Projects */}
      {!isLoading && activeTab === 'projects' && (
        filteredProjects.length === 0 ? (
          emptyState(
            Building2,
            'No Projects Found',
            'Add upcoming, ongoing or completed construction projects.',
            'Add Project',
            () => openProjectModal()
          )
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProjects.map((project) => {
              const status = String(project.status || 'COMPLETED').toUpperCase();

              const statusClass =
                status === 'UPCOMING'
                  ? 'bg-blue-600 text-white'
                  : status === 'ONGOING'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 text-white';

              return (
                <article
                  key={project._id}
                  className={`${CARD} flex min-w-0 flex-col overflow-hidden transition hover:shadow-lg`}
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={project.featuredImage || FALLBACK_IMAGE}
                      alt={project.title || 'Construction project'}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase ${statusClass}`}>
                      {status === 'ONGOING'
                        ? 'Ongoing Site'
                        : status === 'UPCOMING'
                          ? 'Upcoming'
                          : 'Completed'}
                    </span>

                    <button
                      type="button"
                      disabled={!!busyItems[`project-${project._id}`]}
                      onClick={() => handleToggleProject(project._id)}
                      className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60 ${project.isActive ? 'bg-emerald-700' : 'bg-rose-600'
                        }`}
                    >
                      {busyItems[`project-${project._id}`]
                        ? 'Updating...'
                        : project.isActive ? 'Active' : 'Hidden'}
                    </button>

                    {project.isFeatured && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase text-amber-800 shadow">
                        <Sparkles className="h-3.5 w-3.5" />
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                      {project.categoryLabel || project.category || 'Construction'}
                    </p>

                    <h3 className="break-words text-base font-bold text-slate-950">
                      {project.title || 'Untitled Project'}
                    </h3>

                    {project.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-700 sm:grid-cols-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="truncate">{formatLocation(project.location)}</span>
                      </div>

                      {project.area && (
                        <div className="flex min-w-0 items-center gap-2">
                          <Maximize2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="truncate">{project.area}</span>
                        </div>
                      )}

                      {project.value && (
                        <div className="flex min-w-0 items-center gap-2">
                          <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="truncate">{project.value}</span>
                        </div>
                      )}

                      {project.timeline && (
                        <div className="flex min-w-0 items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="truncate">{project.timeline}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <span className="min-w-0 truncate font-mono text-[11px] text-slate-500">
                      /{project.slug || 'view'}
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openProjectModal(project)}
                        className={`${SMALL_BUTTON} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={!!busyItems[`project-${project._id}`]}
                        onClick={() => handleDeleteProject(project._id)}
                        aria-label="Delete project"
                        className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      )}

      {/* Testimonials */}
      {!isLoading && activeTab === 'testimonials' && (
        filteredTestimonials.length === 0 ? (
          emptyState(
            MessageSquareQuote,
            'No Testimonials Found',
            'Add client feedback and testimonials to your website.',
            'Add Testimonial',
            () => openTestimonialModal()
          )
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredTestimonials.map((testimonial) => {
              const rating = Math.min(
                5,
                Math.max(0, Number(testimonial.rating) || 5)
              );

              return (
                <article
                  key={testimonial._id}
                  className={`${CARD} flex min-w-0 flex-col p-5 transition hover:shadow-lg`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-1 text-amber-500"
                      aria-label={`${rating} out of 5 stars`}
                    >
                      {Array.from({ length: rating }, (_, index) => (
                        <Star
                          key={index}
                          className="h-4 w-4 fill-current"
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!!busyItems[`testimonial-${testimonial._id}`]}
                      onClick={() => handleToggleTestimonial(testimonial._id)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold disabled:opacity-60 ${testimonial.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                      {busyItems[`testimonial-${testimonial._id}`]
                        ? 'Updating...'
                        : testimonial.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <p className="mb-6 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                    “{testimonial.quote || 'No testimonial text provided.'}”
                  </p>

                  <footer className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={testimonial.avatar || FALLBACK_AVATAR}
                        alt={testimonial.name || 'Client'}
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-full border-2 border-amber-400 object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_AVATAR;
                        }}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {testimonial.name || 'Unnamed Client'}
                        </p>
                        <p className="truncate text-xs text-slate-600">
                          {testimonial.role || testimonial.company || 'Client'}
                        </p>
                        {testimonial.project && (
                          <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            {testimonial.project}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openTestimonialModal(testimonial)}
                        aria-label="Edit testimonial"
                        className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={!!busyItems[`testimonial-${testimonial._id}`]}
                        onClick={() => handleDeleteTestimonial(testimonial._id)}
                        aria-label="Delete testimonial"
                        className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )
      )}

      {/* Banner Modal */}
      <BannerModal
        isOpen={isBannerModalOpen}
        onClose={() => {
          setIsBannerModalOpen(false);
          setEditingBanner(null);
        }}
        banner={editingBanner}
        onSuccess={() => {
          showToast(
            editingBanner
              ? 'Banner updated successfully'
              : 'New banner published successfully',
            'success'
          );
          fetchAllData(false);
        }}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        showToast={showToast}
        onSuccess={() => {
          showToast(
            editingProject
              ? 'Project updated successfully'
              : 'New showcase project published successfully',
            'success'
          );
          fetchAllData(false);
        }}
      />

      {/* Testimonial Modal */}
      <TestimonialModal
        isOpen={isTestimonialModalOpen}
        onClose={() => {
          setIsTestimonialModalOpen(false);
          setEditingTestimonial(null);
        }}
        testimonial={editingTestimonial}
        onSuccess={() => {
          showToast(
            editingTestimonial
              ? 'Testimonial updated successfully'
              : 'New testimonial published successfully',
            'success'
          );
          fetchAllData(false);
        }}
      />
    </div>
  );
};

export default CmsPage;
