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
  registration_number?: string;
  staff_id?: string;
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

// Password Reset API functions

export interface PasswordResetResponse {
  message: string;
  email?: string;
  expires_in_seconds?: number;
  error?: string;
}

export interface VerifyCodeResponse {
  message: string;
  valid: boolean;
  error?: string;
}

export const requestPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  const { data } = await api.post<PasswordResetResponse>('/auth/password-reset/request/', { email });
  return data;
};

export const verifyResetCode = async (email: string, code: string): Promise<VerifyCodeResponse> => {
  const { data } = await api.post<VerifyCodeResponse>('/auth/password-reset/verify/', { email, code });
  return data;
};

export const completePasswordReset = async (
  email: string,
  code: string,
  password: string
): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/password-reset/complete/', {
    email,
    code,
    password,
  });
  return data;
};

export const resendResetCode = async (email: string): Promise<PasswordResetResponse> => {
  const { data } = await api.post<PasswordResetResponse>('/auth/password-reset/resend/', { email });
  return data;
};

