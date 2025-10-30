import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { ReadingProgress, DashboardData, ReadingStats } from '@/types'

export const useReadingProgress = (bookId: string) => {
  return useQuery({
    queryKey: ['reading', 'progress', bookId],
    queryFn: async () => {
      const response = await apiClient.get<ReadingProgress>(`/reading/progress/${bookId}/`)
      return response.data
    },
    enabled: !!bookId,
  })
}

export const useUpdateProgress = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ bookId, location, percent, timeSpent }: {
      bookId: string
      location: string
      percent: number
      timeSpent: number
    }) => {
      const response = await apiClient.patch<ReadingProgress>(`/reading/progress/${bookId}/`, {
        location,
        percent,
        time_spent: timeSpent
      })
      return response.data
    },
    onSuccess: (data) => {
      // Update progress cache
      queryClient.setQueryData(['reading', 'progress', data.book], data)
      
      // Update dashboard cache
      queryClient.invalidateQueries({ queryKey: ['reading', 'dashboard'] })
    },
  })
}

export const useDashboard = () => {
  return useQuery({
    queryKey: ['reading', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardData>('/reading/dashboard/')
      return response.data
    },
  })
}

export const useReadingStats = () => {
  return useQuery({
    queryKey: ['reading', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<ReadingStats>('/analytics/user/stats/')
      return response.data
    },
  })
}

export const useStartReadingSession = () => {
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await apiClient.post(`/reading/sessions/${bookId}/start/`)
      return response.data
    },
  })
}

export const useEndReadingSession = () => {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.post(`/reading/sessions/${sessionId}/end/`)
      return response.data
    },
  })
}