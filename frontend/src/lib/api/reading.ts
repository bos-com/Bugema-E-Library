import api from './client';
import type { DashboardData, ReadingProgress, ReadingSession, AnalyticsData } from '../types';

export const getDashboard = async (period: string = 'week') => {
  const response = await api.get<DashboardData>('/reading/dashboard/', {
    params: { period }
  });
  return response.data;
};

export const getUserAnalytics = async (period: 'week' | 'month' | 'year' = 'week') => {
  const { data } = await api.get<AnalyticsData>('/reading/analytics/', {
    params: { period }
  });
  return data;
};

export const getProgress = async (bookId: number | string) => {
  const { data } = await api.get<ReadingProgress>(`/reading/progress/${bookId}/`);
  return data;
};


export const updateProgress = async (
  bookId: number | string,
  payload: Partial<Pick<ReadingProgress, 'last_location' | 'percent' | 'current_page'>> & { time_spent?: number }
) => {
  const { data } = await api.patch<ReadingProgress>(`/reading/progress/${bookId}/`, payload);
  return data;
};

export const getOrCreateSession = async (bookId: number | string) => {
  const { data } = await api.get<ReadingSession>(`/reading/sessions/${bookId}/active/`);
  return data;
};

export const updateSessionProgress = async (
  sessionId: string,
  payload: { current_page?: number; percent?: number; location?: string }
) => {
  const { data } = await api.patch<ReadingSession>(`/reading/sessions/${sessionId}/update/`, payload);
  return data;
};

export const endSession = async (sessionId: string) => {
  const { data } = await api.post<ReadingSession>(`/reading/sessions/${sessionId}/end/`);
  return data;
};
