import api from './client';
import type { DashboardData, ReadingProgress } from '../types';

export const getDashboard = async () => {
  const { data } = await api.get<DashboardData>('/reading/dashboard/');
  return data;
};

export const getProgress = async (bookId: number | string) => {
  const { data } = await api.get<ReadingProgress>(`/reading/progress/${bookId}/`);
  return data;
};

export const updateProgress = async (
  bookId: number | string,
  payload: Partial<Pick<ReadingProgress, 'last_location' | 'percent'>> & { time_spent?: number }
) => {
  const { data } = await api.patch<ReadingProgress>(`/reading/progress/${bookId}/`, payload);
  return data;
};
