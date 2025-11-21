import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const performRefresh = async () => {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh/`,
      { refresh: refreshToken },
      { withCredentials: true }
    );

    const tokens = response.data?.tokens ?? response.data;
    if (!tokens?.access) {
      throw new Error('Missing access token');
    }

    setTokens({ accessToken: tokens.access, refreshToken: tokens.refresh });
    return tokens.access as string;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      console.error('Session cleared due to auth error:', error.response?.status, error.response?.data);
      clearSession();
    }
    throw error;
  }
};

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      refreshPromise = refreshPromise ?? performRefresh();
      try {
        const newAccess = await refreshPromise;
        if (newAccess && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);

export const refreshAccessToken = async () => {
  refreshPromise = refreshPromise ?? performRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

export default api;
