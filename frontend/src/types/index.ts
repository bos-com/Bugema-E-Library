export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  cover_image?: string
  book_count: number
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  description: string
  categories: Category[]
  tags: string[]
  language: string
  year: number
  isbn?: string
  pages: number
  cover_image?: string
  file: string
  file_type: 'PDF' | 'EPUB'
  is_published: boolean
  view_count: number
  like_count: number
  bookmark_count: number
  created_at: string
  is_liked?: boolean
  is_bookmarked?: boolean
  reading_progress?: ReadingProgress
}

export interface ReadingProgress {
  id: string
  book: string
  book_title: string
  book_author: string
  book_cover?: string
  last_location: string
  percent: number
  total_time_seconds: number
  last_opened_at: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface BookLike {
  id: string
  book: string
  created_at: string
}

export interface Bookmark {
  id: string
  book: string
  location: string
  created_at: string
}

export interface ReadingSession {
  id: string
  book: string
  book_title: string
  book_author: string
  started_at: string
  ended_at?: string
  duration_seconds: number
  created_at: string
}

export interface ReadingStats {
  total_books_read: number
  total_time_seconds: number
  total_pages_read: number
  current_streak_days: number
  longest_streak_days: number
  favorite_category?: string
  /**
   * List of favourite categories with counts, used on the dashboard.
   */
  favorite_categories?: Array<{
    name: string
    count: number
  }>
  reading_goal_progress: number
  books_read_this_year?: number
  books_read_this_month?: number
  total_time_this_month_seconds?: number
}

export interface DashboardData {
  in_progress: ReadingProgress[]
  completed: ReadingProgress[]
  liked_books: Book[]
  bookmarked_books: Book[]
  stats: ReadingStats
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  password_confirm: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

export interface SearchFilters {
  query?: string
  category?: string
  tags?: string
  year_from?: number
  year_to?: number
  language?: string
  file_type?: 'PDF' | 'EPUB'
  ordering?: string
  page?: number
  limit?: number
}

export interface SearchSuggestion {
  type: 'title' | 'author' | 'tag'
  text: string
  book_id?: string
}

export interface AdminAnalytics {
  overview: {
    total_books: number
    total_categories: number
    total_users: number
    total_reads: number
    active_users_7d: number
  }
  most_read_books: Array<{
    id: string
    title: string
    author: string
    view_count: number
    like_count: number
  }>
  most_liked_categories: Array<{
    name: string
    likes: number
  }>
  reads_per_day: Array<{
    date: string
    count: number
  }>
  top_search_terms: Array<{
    term: string
    count: number
  }>
}
