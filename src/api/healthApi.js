import axiosClient from './axiosClient';

export const healthApi = {
  getHealth: () => axiosClient.get('/health'),
  ping: () => axiosClient.get('/health/ping'),
};
