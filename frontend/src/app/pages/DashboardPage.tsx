import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../../lib/api/reading';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import StatCard from '../../components/cards/StatCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => getDashboard(period),
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });

  if (isLoading) {
    return <LoadingOverlay label="Fetching your activity" />;
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to load dashboard</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Calculate completion rate
  const totalBooks = (data.completed?.length || 0) + (data.in_progress?.length || 0);
  const completionRate = totalBooks > 0 ? Math.round(((data.completed?.length || 0) / totalBooks) * 100) : 0;

  const periodLabel = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    all: 'All Time'
  }[period] || 'This Week';

  return (
    <div className="space-y-8 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="page-header m-0">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
            Personal Dashboard
          </p>
          <h1 className="page-title">Reading Insights</h1>
          <p className="page-subtitle">Track your progress and discover your reading patterns</p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white min-w-[140px]"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Statistics Grid - 5 cards */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div onClick={() => navigate('/books/completed')} className="cursor-pointer transition-transform hover:scale-105">
          <StatCard
            variant="blue"
            label="Books Completed"
            value={data?.stats.total_books_read}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            hint={periodLabel}
          />
        </div>

        <div onClick={() => navigate('/analytics/pages')} className="cursor-pointer transition-transform hover:scale-105">
          <StatCard
            variant="emerald"
            label="Pages Read"
            value={`${data?.stats.total_pages_read || 0}`}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            hint={periodLabel}
          />
        </div>

        <div onClick={() => navigate('/analytics/time')} className="cursor-pointer transition-transform hover:scale-105">
          <StatCard
            variant="violet"
            label="Time Reading"
            value={`${((data?.stats.total_time_seconds || 0) / 3600).toFixed(1)}h`}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            hint={periodLabel}
          />
        </div>

        <div onClick={() => navigate('/analytics/streak')} className="cursor-pointer transition-transform hover:scale-105">
          <StatCard
            variant="amber"
            label="Current Streak"
            value={`${data?.stats.current_streak_days || 0}`}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            hint="Days in a row"
          />
        </div>

        <div onClick={() => navigate('/analytics/completion')} className="cursor-pointer transition-transform hover:scale-105">
          <StatCard
            variant="cyan"
            label="Completion Rate"
            value={`${completionRate}%`}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            hint="Learn more"
          />
        </div>
      </section>


      {/* Reading Progress Section */}
      <section className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {/* In Progress Books */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">In Progress</h2>
            <span className="badge badge-blue">
              {data.in_progress?.length || 0} {data.in_progress?.length === 1 ? 'book' : 'books'}
            </span>
          </div>
          {data.in_progress && data.in_progress.length > 0 ? (
            <ul className="space-y-4 max-h-80 overflow-y-auto">
              {data.in_progress.map((progress) => (
                <li
                  key={progress.id}
                  onClick={() => navigate(`/reader/${progress.book}`)}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-brand-300 hover:bg-brand-50 hover:shadow-lg dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {progress.book_title ?? progress.book}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-brand-600 dark:text-brand-400">
                          {Math.round(progress.percent)}% complete
                        </p>
                        {progress.current_page > 0 && (
                          <>
                            <span className="text-slate-400">•</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Page {progress.current_page}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No books in progress</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Start reading to see your progress here</p>
            </div>
          )}
        </div>

        {/* Liked Books */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Liked Books</h2>
            <span className="badge badge-rose">
              {data.liked_books?.length || 0} {data.liked_books?.length === 1 ? 'book' : 'books'}
            </span>
          </div>
          {data.liked_books && data.liked_books.length > 0 ? (
            <ul className="space-y-4 max-h-80 overflow-y-auto">
              {data.liked_books.map((book) => (
                <li
                  key={book.id}
                  onClick={() => navigate(`/catalog/${book.id}`)}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{book.title}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                        Liked on {new Date(book.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <svg className="h-8 w-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No liked books</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Like books to see them here</p>
            </div>
          )}
        </div>

        {/* Bookmarked Books */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bookmarked</h2>
            <span className="badge badge-violet">
              {data.bookmarked_books?.length || 0} {data.bookmarked_books?.length === 1 ? 'book' : 'books'}
            </span>
          </div>
          {data.bookmarked_books && data.bookmarked_books.length > 0 ? (
            <ul className="space-y-4 max-h-80 overflow-y-auto">
              {data.bookmarked_books.slice(0, 5).map((book) => (
                <li
                  key={book.id}
                  onClick={() => navigate(`/catalog/${book.id}`)}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-violet-300 hover:bg-violet-50 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {book.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                        Bookmarked on {new Date(book.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-violet-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No bookmarked books</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Bookmark books to see them here</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
