import api from './client';
import type { AdminOverview, AdminUser, UserRole } from '../types';

export const getAdminOverview = async () => {
    const { data } = await api.get<AdminOverview>('/analytics/admin/overview/');
    return data;
};

// Admin User Management
export const getUsers = async () => {
    const { data } = await api.get<AdminUser[]>('/accounts/users/');
    return data;
};

export const updateUserRole = async (userId: string, role: UserRole) => {
    const { data } = await api.patch<AdminUser>(`/accounts/users/${userId}/assign_role/`, { role });
    return data;
};

export const deleteUser = async (userId: string) => {
    await api.delete(`/accounts/users/${userId}/`);
};
