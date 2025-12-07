import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBooks, toggleBookmark, toggleLike } from '../../lib/api/catalog';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import { useAuthStore } from '../../lib/store/auth';
import { useSubscription } from '../../lib/hooks/useSubscription';
import SubscriptionPaywall from '../../components/subscription/SubscriptionPaywall';
import BookCard from '../../components/catalog/BookCard';
import type { BookSummary, PaginatedResponse } from '../../lib/types';

type ViewMode = 'grid' | 'list';

const CatalogPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategoryId = searchParams.get('categoryId');
  const initialCategoryName = searchParams.get('categoryName') ?? '';
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategoryId ? Number(initialCategoryId) : undefined,
  );
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('catalogViewMode');
    return (saved as ViewMode) || 'grid';
  });
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { needsSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallAction, setPaywallAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['books', { search, page, categoryId }],
    queryFn: () => getBooks({ page, query: search, categories__id: categoryId }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const likeMutation = useMutation({
    mutationFn: (bookId: number) => toggleLike(bookId),
    onMutate: async (bookId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['books'] });
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<PaginatedResponse<BookSummary>>(['books', { search, page, categoryId }]);
      // Optimistically update the cache
      queryClient.setQueryData<PaginatedResponse<BookSummary>>(['books', { search, page, categoryId }], (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map(book =>
            book.id === bookId
              ? { ...book, is_liked: !book.is_liked, like_count: book.is_liked ? book.like_count - 1 : book.like_count + 1 }
              : book
          )
        };
      });
      return { previousData };
    },
    onError: (_err, _bookId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['books', { search, page, categoryId }], context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server after mutation
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (bookId: number) => toggleBookmark(bookId),
    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: ['books'] });
      const previousData = queryClient.getQueryData<PaginatedResponse<BookSummary>>(['books', { search, page, categoryId }]);
      queryClient.setQueryData<PaginatedResponse<BookSummary>>(['books', { search, page, categoryId }], (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map(book =>
            book.id === bookId
              ? { ...book, is_bookmarked: !book.is_bookmarked, bookmark_count: book.is_bookmarked ? book.bookmark_count - 1 : book.bookmark_count + 1 }
              : book
          )
        };
      });
      return { previousData };
    },
    onError: (_err, _bookId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['books', { search, page, categoryId }], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const handleLike = useCallback((id: number) => {
    if (!subscriptionLoading && needsSubscription) {
      setPaywallAction('like books');
      setShowPaywall(true);
      return;
    }
    likeMutation.mutate(id);
  }, [likeMutation, needsSubscription, subscriptionLoading]);

  const handleBookmark = useCallback((id: number) => {
    if (!subscriptionLoading && needsSubscription) {
      setPaywallAction('bookmark books');
      setShowPaywall(true);
      return;
    }
    bookmarkMutation.mutate(id);
  }, [bookmarkMutation, needsSubscription, subscriptionLoading]);

  const totalPages = useMemo(() => {
    if (!data?.count) return 1;
    return Math.ceil(data.count / 20);
  }, [data]);

  useEffect(() => {
    localStorage.setItem('catalogViewMode', viewMode);
  }, [viewMode]);

  // Keep URL in sync with filters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (page !== 1) params.page = String(page);
    if (categoryId) {
      params.categoryId = String(categoryId);
      if (categoryName) params.categoryName = categoryName;
    }
    setSearchParams(params, { replace: true });
  }, [search, page, categoryId, categoryName, setSearchParams]);

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Catalog</h1>
          <p className="page-subtitle">Search, filter, and discover books instantly</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search Input */}
          <div className="relative flex-1 md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search by title, author, or tag…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="input-modern pl-11"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 rounded-xl border-2 border-slate-300 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${viewMode === 'grid'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              title="Grid view"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${viewMode === 'list'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              title="List view"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Results Info */}
      {data && (
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">{data.count.toLocaleString()}</span>
            {' '}books found
            {search && (
              <span className="ml-1">
                for <span className="font-semibold text-brand-600 dark:text-brand-400">"{search}"</span>
              </span>
            )}
          </div>
          {categoryId && (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <span>Category: {categoryName || `#${categoryId}`}</span>
              <button
                type="button"
                onClick={() => {
                  setCategoryId(undefined);
                  setCategoryName('');
                  setPage(1);
                }}
                className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] uppercase tracking-wide hover:bg-brand-200 dark:bg-brand-500/30 dark:hover:bg-brand-500/40"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingOverlay label="Loading books" />}

      {/* Books Grid/List */}
      <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
        {data?.results.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            viewMode={viewMode}
            onLike={handleLike}
            onBookmark={handleBookmark}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6 dark:border-white/10">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Page</span>
          <span className="font-semibold text-slate-900 dark:text-white">{page}</span>
          <span>of</span>
          <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700 dark:border-white/20 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700 dark:border-white/20 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subscription Paywall Modal */}
      <SubscriptionPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        actionBlocked={paywallAction}
      />
    </div>
  );
};

export default CatalogPage;

