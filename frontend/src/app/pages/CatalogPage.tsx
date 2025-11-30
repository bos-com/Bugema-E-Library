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
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Catalog</h1>
          <p className="text-slate-600 dark:text-slate-400">Search, filter, and open any book instantly.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Search by title, author, or tag…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 md:w-80"
          />
          <div className="flex gap-1 rounded-lg border border-slate-300 p-1 dark:border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${viewMode === 'grid'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              title="Grid view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${viewMode === 'list'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              title="List view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {isLoading && <LoadingOverlay label="Loading books" />}

      <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
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

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="space-x-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-300 px-3 py-1 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-white/10 dark:hover:bg-white/5"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-white/10 dark:hover:bg-white/5"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
