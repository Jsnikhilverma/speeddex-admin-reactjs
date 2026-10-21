import axios from 'axios';

// Base API URL configured via Vite environment variable with fallback
export const API_BASE_URL = (import.meta.env.BASE_URL || '/api/v1').replace(/\/+$/, '');

// Create base Axios instance targeting configured baseURL
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT Access Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('speeddex_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with automatic token rotation refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry login endpoint itself
      if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error.response?.data || error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('speeddex_refresh_token');

      if (!storedRefreshToken) {
        localStorage.removeItem('speeddex_access_token');
        localStorage.removeItem('speeddex_refresh_token');
        localStorage.removeItem('speeddex_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(error.response?.data || error);
      }

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: storedRefreshToken,
        });

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('speeddex_access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('speeddex_refresh_token', newRefreshToken);
          }

          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('speeddex_access_token');
        localStorage.removeItem('speeddex_refresh_token');
        localStorage.removeItem('speeddex_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
