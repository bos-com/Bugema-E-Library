import { useMemo, useState, useEffect, useCallback } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBooks, toggleBookmark, toggleLike } from '../../lib/api/catalog';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import { useAuthStore } from '../../lib/store/auth';
import BookCard from '../../components/catalog/BookCard';

type ViewMode = 'grid' | 'list';

const CatalogPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('catalogViewMode');
    return (saved as ViewMode) || 'grid';
  });
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ['books', { search, page }],
    queryFn: () => getBooks({ page, query: search }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const likeMutation = useMutation({
    mutationFn: (bookId: number) => toggleLike(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (bookId: number) => toggleBookmark(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const handleLike = useCallback((id: number) => {
    likeMutation.mutate(id);
  }, [likeMutation]);

  const handleBookmark = useCallback((id: number) => {
    bookmarkMutation.mutate(id);
  }, [bookmarkMutation]);

  const totalPages = useMemo(() => {
    if (!data?.count) return 1;
    return Math.ceil(data.count / 20);
  }, [data]);

  useEffect(() => {
    localStorage.setItem('catalogViewMode', viewMode);
  }, [viewMode]);

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
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">{data.count.toLocaleString()}</span>
          {' '}books found
          {search && (
            <span className="ml-1">
              for <span className="font-semibold text-brand-600 dark:text-brand-400">"{search}"</span>
            </span>
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
    </div>
  );
};

export default CatalogPage;

