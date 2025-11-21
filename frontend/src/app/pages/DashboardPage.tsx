import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../lib/api/reading';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';


const DashboardPage = () => {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (isLoading) {
    return <LoadingOverlay label="Fetching your activity" />;
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center">
        <div>
          <p className="text-lg font-semibold text-white">Unable to load dashboard</p>
          <p className="text-sm text-slate-400">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <p className="text-xs uppercase tracking-[0.4em] text-brand-600 dark:text-brand-200">Personal dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Reading insights</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="card bg-blue-50 border-blue-100 dark:bg-white/5 dark:border-white/5">
          <p className="text-xs uppercase text-blue-600 dark:text-slate-500">Books Completed</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900 dark:text-white">
            {data?.stats.total_books_read}
          </p>
        </div>
        <div className="card bg-red-50 border-red-100 dark:bg-white/5 dark:border-white/5">
          <p className="text-xs uppercase text-red-600 dark:text-slate-500">Pages Read</p>
          <p className="mt-2 text-3xl font-semibold text-red-900 dark:text-white">
            {data?.stats.total_pages_read.toLocaleString()}
          </p>
        </div>
        <div className="card bg-orange-50 border-orange-100 dark:bg-white/5 dark:border-white/5">
          <p className="text-xs uppercase text-orange-600 dark:text-slate-500">Time Reading</p>
          <p className="mt-2 text-3xl font-semibold text-orange-900 dark:text-white">
            {Math.round((data?.stats.total_time_seconds || 0) / 3600)}h
          </p>
        </div>
        <div className="card bg-green-50 border-green-100 dark:bg-white/5 dark:border-white/5">
          <p className="text-xs uppercase text-green-600 dark:text-slate-500">Goal Progress</p>
          <p className="mt-2 text-3xl font-semibold text-green-900 dark:text-white">
            {Math.round(data?.stats.reading_goal_progress || 0)}%
          </p>
        </div>
        <div className="card bg-red-50 border-red-100 dark:bg-white/5 dark:border-white/5">
          <p className="text-xs uppercase text-red-600 dark:text-slate-500">Total Likes</p>
          <p className="mt-2 text-3xl font-semibold text-red-900 dark:text-white">
            {data?.stats.total_likes || 0}
          </p>
        </div>
        <div className="card bg-blue-50 border-blue-100 dark:bg-white/5 dark:border-white/5">
          <p className="text-xs uppercase text-blue-600 dark:text-slate-500">Total Bookmarks</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900 dark:text-white">
            {data?.stats.total_bookmarks || 0}
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">In progress</h2>
          {data.in_progress && data.in_progress.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {data.in_progress.map((progress) => (
                <li key={progress.id} className="rounded-xl border border-slate-200 dark:border-white/5 p-3">
                  <p className="font-semibold text-slate-900 dark:text-white">{progress.book_title ?? progress.book}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{Math.round(progress.percent)}% complete</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No books in progress yet.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Bookmarks</h2>
          {data.bookmarked_books && data.bookmarked_books.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {data.bookmarked_books.map((book) => (
                <li key={book.id} className="rounded-xl border border-slate-200 dark:border-white/5 p-3">
                  <p className="font-semibold text-slate-900 dark:text-white">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{book.location ?? 'No location saved'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No bookmarked books yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
