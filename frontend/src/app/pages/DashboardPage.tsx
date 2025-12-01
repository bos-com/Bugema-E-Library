import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../lib/api/reading';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import StatCard from '../../components/cards/StatCard';


const DashboardPage = () => {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

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

  return (
    <div className="space-y-8 animate-in">
      {/* Page Header */}
      <div className="page-header">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
          Personal Dashboard
        </p>
        <h1 className="page-title">Reading Insights</h1>
        <p className="page-subtitle">Track your progress and discover your reading patterns</p>
      </div>

      {/* Statistics Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          variant="blue"
          label="Books Completed"
          value={data?.stats.total_books_read}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          hint="Total finished"
        />
        <StatCard
          variant="emerald"
          label="Pages Read"
          value={data?.stats.total_pages_read.toLocaleString()}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          hint="All time"
        />
        <StatCard
          variant="violet"
          label="Time Reading"
          value={`${Math.round((data?.stats.total_time_seconds || 0) / 3600)}h`}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          hint="Hours spent"
        />
        <StatCard
          variant="amber"
          label="Goal Progress"
          value={`${Math.round(data?.stats.reading_goal_progress || 0)}%`}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          hint="This month"
        />
        <StatCard
          variant="rose"
          label="Total Likes"
          value={data?.stats.total_likes || 0}
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          }
          hint="Favorites"
        />
        <StatCard
          variant="cyan"
          label="Bookmarks"
          value={data?.stats.total_bookmarks || 0}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
          hint="Saved items"
        />
      </section>

      {/* Reading Progress Section */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">In Progress</h2>
            <span className="badge badge-blue">
              {data.in_progress?.length || 0} {data.in_progress?.length === 1 ? 'book' : 'books'}
            </span>
          </div>
          {data.in_progress && data.in_progress.length > 0 ? (
            <ul className="space-y-4">
              {data.in_progress.map((progress) => (
                <li
                  key={progress.id}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-brand-300 hover:bg-brand-50 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {progress.book_title ?? progress.book}
                      </p>
                      <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                        {Math.round(progress.percent)}% complete
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bookmarked</h2>
            <span className="badge badge-emerald">
              {data.bookmarked_books?.length || 0} {data.bookmarked_books?.length === 1 ? 'book' : 'books'}
            </span>
          </div>
          {data.bookmarked_books && data.bookmarked_books.length > 0 ? (
            <ul className="space-y-4">
              {data.bookmarked_books.map((book) => (
                <li
                  key={book.id}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{book.title}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                      {book.location && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                          📍 {book.location}
                        </p>
                      )}
                    </div>
                    <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
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
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No bookmarks yet</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Bookmark books to find them easily later</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

