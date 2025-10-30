import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { Book, Category, SearchFilters, SearchSuggestion, PaginatedResponse } from '@/types'

export const useCategories = () => {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/catalog/categories/')
      return response.data
    },
  })
}

export const useBooks = (filters: SearchFilters = {}) => {
  return useQuery({
    queryKey: ['catalog', 'books', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
      
      const response = await apiClient.get<PaginatedResponse<Book>>(`/catalog/books/?${params}`)
      return response.data
    },
  })
}

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['catalog', 'books', id],
    queryFn: async () => {
      const response = await apiClient.get<Book>(`/catalog/books/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['catalog', 'search-suggestions', query],
    queryFn: async () => {
      const response = await apiClient.get<{ suggestions: SearchSuggestion[] }>(`/catalog/search/suggestions/?query=${encodeURIComponent(query)}`)
      return response.data.suggestions
    },
    enabled: query.length >= 2,
  })
}

export const useToggleLike = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await apiClient.post<{ liked: boolean; like_count: number }>(`/catalog/books/${bookId}/like/`)
      return { bookId, ...response.data }
    },
    onSuccess: ({ bookId, liked, like_count }) => {
      // Update book detail cache
      queryClient.setQueryData(['catalog', 'books', bookId], (old: Book | undefined) => {
        if (old) {
          return { ...old, is_liked: liked, like_count }
        }
        return old
      })
      
      // Update books list cache
      queryClient.setQueriesData({ queryKey: ['catalog', 'books'] }, (old: any) => {
        if (old?.results) {
          return {
            ...old,
            results: old.results.map((book: Book) =>
              book.id === bookId ? { ...book, is_liked: liked, like_count } : book
            )
          }
        }
        return old
      })
    },
  })
}

export const useToggleBookmark = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ bookId, location }: { bookId: string; location: string }) => {
      const response = await apiClient.post<{ bookmarked: boolean; bookmark_count: number }>(`/catalog/books/${bookId}/bookmark/`, { location })
      return { bookId, ...response.data }
    },
    onSuccess: ({ bookId, bookmarked, bookmark_count }) => {
      // Update book detail cache
      queryClient.setQueryData(['catalog', 'books', bookId], (old: Book | undefined) => {
        if (old) {
          return { ...old, is_bookmarked: bookmarked, bookmark_count }
        }
        return old
      })
      
      // Update books list cache
      queryClient.setQueriesData({ queryKey: ['catalog', 'books'] }, (old: any) => {
        if (old?.results) {
          return {
            ...old,
            results: old.results.map((book: Book) =>
              book.id === bookId ? { ...book, is_bookmarked: bookmarked, bookmark_count } : book
            )
          }
        }
        return old
      })
    },
  })
}

export const useReadToken = () => {
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await apiClient.get<{ token: string }>(`/catalog/books/${bookId}/read/token/`)
      return response.data.token
    },
  })
}