import api from './client';
import type { AdminOverview } from '../types';

export const getAdminOverview = async () => {
  const { data } = await api.get<AdminOverview>('/analytics/admin/overview/');
  return data;
};
