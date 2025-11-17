import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthTokens, LoginRequest, RegisterRequest, AuthResponse } from '@/types'
import { apiClient } from '@/lib/api/client'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setTokens: (tokens: AuthTokens | null) => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login/', credentials)
          const { user, tokens } = response.data
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post<AuthResponse>('/auth/register/', userData)
          const { user, tokens } = response.data
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      checkAuth: async () => {
        const { tokens } = get()
        if (!tokens?.access) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await apiClient.get<User>('/auth/me/')
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      },

      setTokens: (tokens: AuthTokens | null) => {
        set({ tokens })
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user
        })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
