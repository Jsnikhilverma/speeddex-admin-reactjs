import axiosClient from './axiosClient';

export const cmsApi = {
  // Media Upload (Image or Video)
  uploadMedia: (formData) =>
    axiosClient.post('/cms/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  uploadMultipleMedia: (formData) =>
    axiosClient.post('/cms/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // ==========================================
  // Banners
  // ==========================================
  getBanners: (params) => axiosClient.get('/cms/banners', { params }),
  getBannerById: (id) => axiosClient.get(`/cms/banners/${id}`),
  createBanner: (data) => axiosClient.post('/cms/banners', data),
  updateBanner: (id, data) => axiosClient.put(`/cms/banners/${id}`, data),
  toggleBannerStatus: (id) => axiosClient.patch(`/cms/banners/${id}/status`),
  deleteBanner: (id) => axiosClient.delete(`/cms/banners/${id}`),

  // ==========================================
  // Projects
  // ==========================================
  getProjects: (params) => axiosClient.get('/cms/projects', { params }),
  getProjectById: (id) => axiosClient.get(`/cms/projects/${id}`),
  createProject: (data) => axiosClient.post('/cms/projects', data),
  updateProject: (id, data) => axiosClient.put(`/cms/projects/${id}`, data),
  toggleProjectStatus: (id) => axiosClient.patch(`/cms/projects/${id}/status`),
  deleteProject: (id) => axiosClient.delete(`/cms/projects/${id}`),

  // ==========================================
  // Testimonials
  // ==========================================
  getTestimonials: (params) => axiosClient.get('/cms/testimonials', { params }),
  getTestimonialById: (id) => axiosClient.get(`/cms/testimonials/${id}`),
  createTestimonial: (data) => axiosClient.post('/cms/testimonials', data),
  updateTestimonial: (id, data) => axiosClient.put(`/cms/testimonials/${id}`, data),
  toggleTestimonialStatus: (id) => axiosClient.patch(`/cms/testimonials/${id}/status`),
  deleteTestimonial: (id) => axiosClient.delete(`/cms/testimonials/${id}`),
};

export default cmsApi;
