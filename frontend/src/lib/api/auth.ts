import api from './client';
import type { User } from '../types';

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await api.post<AuthResponse>('/auth/login/', payload);
  return data;
};

export const register = async (payload: {
  email: string;
  name: string;
  password: string;
  password_confirm: string;
}) => {
  const { data } = await api.post<AuthResponse>('/auth/register/', payload);
  return data;
};

export const fetchProfile = async () => {
  const { data } = await api.get<User>('/auth/me/');
  return data;
};

export const logout = async (refresh: string | null) => {
  if (!refresh) return;
  await api.post('/auth/logout/', { refresh_token: refresh });
};
