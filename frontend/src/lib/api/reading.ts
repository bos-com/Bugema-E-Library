import api from './client';
import type { DashboardData, ReadingProgress, ReadingSession } from '../types';

export const getDashboard = async () => {
  const response = await api.get<DashboardData>('/reading/dashboard/');
  return response.data;
};

export const getUserAnalytics = async (period: 'week' | 'month' = 'week') => {
  const { data } = await api.get('/reading/analytics/', {
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
