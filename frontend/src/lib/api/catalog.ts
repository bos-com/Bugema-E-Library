import api from './client';
import type { BookDetail, BookSummary, Category, PaginatedResponse } from '../types';

export const getCategories = async () => {
  const { data } = await api.get<PaginatedResponse<Category> | Category[]>('/catalog/categories/');
  return data;
};

export const createCategory = async (payload: { name: string; description?: string }) => {
  const { data } = await api.post<Category>('/catalog/categories/', payload);
  return data;
};

export interface BookFilters {
  page?: number;
  query?: string;
  categories__id?: number;
  ordering?: string;
}

export const getBooks = async (params?: BookFilters) => {
  const { data } = await api.get<PaginatedResponse<BookSummary>>('/catalog/books/', { params });
  return data;
};

export const getBookDetail = async (bookId: string | number) => {
  const { data } = await api.get<BookDetail>(`/catalog/books/${bookId}/`);
  return data;
};

export const getBookFileUrl = async (bookId: string | number) => {
  const { data } = await api.get<{ url: string }>(`/catalog/books/${bookId}/file/`);
  return data.url;
};

export const streamBookContent = async (bookId: string | number) => {
  const { data } = await api.get<{ url: string }>(`/catalog/books/${bookId}/read/stream/`);
  return data.url;
};

export const toggleLike = async (bookId: number) => {
  const { data } = await api.post<{ liked: boolean; like_count: number }>(
    `/catalog/books/${bookId}/like/`
  );
  return data;
};

export const toggleBookmark = async (bookId: number, location?: string) => {
  const { data } = await api.post<{ bookmarked: boolean; bookmark_count: number }>(
    `/catalog/books/${bookId}/bookmark/`,
    { location }
  );
  return data;
};

export interface BookPayload {
  title: string;
  description: string;
  language: string;
  year?: number;
  isbn: string;
  pages?: number;
  file?: File | null;
  cover_image?: File | null;
  file_type: 'PDF' | 'EPUB' | 'VIDEO';
  is_published: boolean;
  tags: string[];
  author_name: string;
  category_names: string[];
}

const toFormData = (payload: Partial<BookPayload>) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'category_names' && Array.isArray(value)) {
      value.forEach((name) => form.append('category_names', name));
    } else if (key === 'tags' && Array.isArray(value)) {
      form.append('tags', JSON.stringify(value));
    } else if (value instanceof File) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  });
  return form;
};


const ensureFormData = (payload: BookPayload | FormData | Partial<BookPayload>) =>
  payload instanceof FormData ? payload : toFormData(payload);

export const createBook = async (payload: BookPayload | FormData) => {
  const { data } = await api.post<BookDetail>('/catalog/books/', ensureFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateBook = async (bookId: number, payload: Partial<BookPayload> | FormData) => {
  const { data } = await api.patch<BookDetail>(`/catalog/books/${bookId}/`, ensureFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteBook = async (bookId: number) => {
  await api.delete(`/catalog/books/${bookId}/`);
};
