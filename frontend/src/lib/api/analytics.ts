import api from './client';
import type { AdminOverview } from '../types';

export const getAdminOverview = async (period: string = 'month') => {
  const { data } = await api.get<AdminOverview>('/analytics/admin/overview/', {
    params: { period }
  });
  return data;
};
