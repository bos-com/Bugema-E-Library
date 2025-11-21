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
    queryFn: async () => {
      const blob = await streamBookContent(bookId!);
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(bookId),
    staleTime: Infinity, // Keep the URL valid for the session
    retry: 2,
  });

  if (isLoading || bookLoading) {
    return <LoadingOverlay label="Preparing secure reader" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-500/10">
          <svg className="h-12 w-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Failed to Load Book</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {error instanceof Error ? error.message : 'Unable to load the book content. Please try again later.'}
          </p>
        </div>
        <Link
          to="/catalog"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">No content available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-brand-600 dark:text-brand-200">Reader</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{book?.title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{book?.author}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black">
        {/* Use object URL for iframe source */}
        <iframe title="reader" src={fileUrl} className="h-[80vh] w-full" />
      </div>
    </div>
  );
};

export default ReaderPage;
