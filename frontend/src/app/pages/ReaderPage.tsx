import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getBookDetail, streamBookContent } from '../../lib/api/catalog';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';

const ReaderPage = () => {
  const { bookId } = useParams();

  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBookDetail(bookId!),
    enabled: Boolean(bookId),
  });

  const { data: fileUrl, isLoading, isError, error } = useQuery({
    queryKey: ['book-stream', bookId],
    queryFn: () => streamBookContent(bookId!),
    enabled: Boolean(bookId),
    staleTime: Infinity, // Keep the URL valid for the session
    retry: 2,
  });

  if (isLoading || bookLoading) {
    return <LoadingOverlay label="Preparing secure reader" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
        <div className="rounded-full bg-gradient-to-br from-rose-100 to-rose-200 p-6 dark:from-rose-500/10 dark:to-rose-600/5">
          <svg className="h-16 w-16 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Failed to Load Book</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {error instanceof Error ? error.message : 'Unable to load the book content. Please try again later.'}
          </p>
        </div>
        <Link
          to="/catalog"
          className="btn-primary"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Catalog
        </Link>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
          <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No content available</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">This book doesn't have available content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
            Reader
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{book?.title}</h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400">{book?.author}</p>
        </div>
        <Link
          to={`/catalog/${bookId}`}
          className="btn-secondary shrink-0"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Book Details
        </Link>
      </div>

      {/* Reader Container */}
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-black">
        {/* Use object URL for iframe source */}
        {/* #view=FitH forces the PDF to fit the width of the container */}
        <iframe
          title="reader"
          src={`${fileUrl}#view=FitH`}
          className="h-[88vh] w-full"
        />
      </div>
    </div>
  );
};

export default ReaderPage;

