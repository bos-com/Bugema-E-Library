export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile_picture?: string | null;
  registration_number?: string | null; // For students - determines free access
  staff_id?: string | null; // For staff - determines free access
}

export interface AdminUser extends User {
  is_online?: boolean;
  user_type?: 'Student' | 'Staff' | 'Visitor';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  book_count?: number;
}

export interface BookSummary {
  id: number;
  title: string;
  author: string;
  description: string;
  isbn: string;
  language: string;
  year?: number;
  pages?: number;
  cover_image?: string | null;
  file?: string | null;
  file_type: 'PDF' | 'EPUB' | 'VIDEO';
  is_published: boolean;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  tags?: string[] | null;
  categories: Category[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
  reading_progress?: {
    percent: number;
    last_location: string;
    completed: boolean;
  } | null;
  created_at: string;
}

export interface BookDetail extends BookSummary {
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ReadingProgress {
  id: number;
  book: BookSummary['id'];
  book_title?: string;
  book_author?: string;
  book_cover?: string | null;
  percent: number;
  last_location: string;
  current_page: number;
  total_time_seconds: number;
  completed: boolean;
  updated_at: string;
}

export interface ReadingSession {
  id: string;
  book: number;
  book_title?: string;
  book_author?: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface DashboardData {
  in_progress: ReadingProgress[];
  completed: ReadingProgress[];
  liked_books: Array<{
    id: string;
    title: string;
    author: string;
    cover_image?: string | null;
    created_at: string;
  }>;
  bookmarked_books: Array<{
    id: string;
    title: string;
    author: string;
    cover_image?: string | null;
    location?: string | null;
    created_at: string;
  }>;
  stats: {
    total_books_read: number;
    total_time_seconds: number;
    total_time_this_week_seconds?: number;
    total_pages_read: number;
    current_streak_days: number;
    longest_streak_days: number;
    favorite_category?: string | null;
    reading_goal_progress: number;
    total_likes?: number;
    total_bookmarks?: number;
    average_session_seconds?: number;
    daily_activity?: Array<{ date: string; minutes: number }>;
    streak_history?: Array<{ date: string; read: boolean }>;
  };
}

export interface AnalyticsData {
  hourly_distribution: Array<{ hour: number; minutes: number }>;
  daily_distribution: Array<{
    date: string;
    day_name: string;
    full_day_name: string;
    minutes: number;
  }>;
  weekly_distribution: Array<{
    date: string;
    day_name: string;
    full_day_name: string;
    minutes: number;
  }>;
  pages_daily_activity?: Array<{ date: string; pages: number }>;
  total_pages_read?: number;
  streak_history: Array<{ date: string; read: boolean }>;
  completion_stats: {
    rate: number;
    total: number;
    completed: number;
    by_category: Array<{ name: string; value: number }>;
  };
}

export interface AdminOverview {
  overview: {
    total_books: number;
    total_categories: number;
    total_users: number;
    total_reads: number;
    total_reads_period?: number;
    active_users_7d: number;
  };
  most_read_books: Array<{
    id: string;
    title: string;
    author: string;
    view_count: number;
    like_count: number;
  }>;
  most_liked_books: Array<{
    id: string;
    title: string;
    author: string;
    like_count: number;
  }>;
  most_liked_categories: Array<{ name: string; likes: number }>;
  reads_per_day: Array<{ date: string; count: number }>;
  reads_per_hour: Array<{ hour: number; count: number }>;
  top_search_terms: Array<{ term: string; count: number }>;
}

export interface Highlight {
  id: string;
  book: number;
  page_number: number;
  text_content: string;
  color: string;
  position_data: {
    rects: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      pageIndex?: number;
    }>;
  };
  note?: string;
  created_at: string;
  updated_at: string;
}

