import api from './client';
import type { AdminOverview } from '../types';

export const getAdminOverview = async (
  readsPeriod: string = 'month',
  likedPeriod: string = 'month',
  searchPeriod: string = 'month',
  viewedPeriod: string = 'month'
) => {
  const { data } = await api.get<AdminOverview>('/analytics/admin/overview/', {
    params: {
      reads_period: readsPeriod,
      liked_period: likedPeriod,
      search_period: searchPeriod,
      viewed_period: viewedPeriod
    }
  });
  return data;
};
