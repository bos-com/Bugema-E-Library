import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '@/lib/store/auth'
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types'

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.post<AuthResponse>('/auth/login/', credentials)
      return response.data
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await apiClient.post<AuthResponse>('/auth/register/', userData)
      return response.data
    },
  })
}

export const useMe = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me/')
      return response.data
    },
    retry: false,
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const { tokens } = useAuthStore.getState()
      if (tokens?.refresh) {
        await apiClient.post('/auth/logout/', { refresh_token: tokens.refresh })
      }
    },
  })
}