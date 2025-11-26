import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getBookDetail, toggleBookmark, toggleLike } from '../../lib/api/catalog';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import { useAuthStore } from '../../lib/store/auth';

const BookDetailPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBookDetail(bookId!),
    enabled: Boolean(bookId),
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(Number(bookId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book', bookId] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(Number(bookId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book', bookId] }),
  });

  if (isLoading || !book) {
    return <LoadingOverlay label="Loading book details" />;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400">
        ← Back to list
      </button>

      <div className="card grid gap-8 border-white/10 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-300">{book.author}</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{book.title}</h1>
          <p className="mt-4 text-slate-300">{book.description}</p>
          <div className="mt-6 grid gap-4 text-sm text-slate-400 sm:grid-cols-2">
            <p>Language: {book.language}</p>
            <p>Year: {book.year ?? '—'}</p>
            <p>Pages: {book.pages ?? '—'}</p>
            <p>ISBN: {book.isbn}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
            {Array.isArray(book.tags) && book.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase text-slate-500">Stats</p>
            <p className="mt-3">Views • {book.view_count}</p>
            <p>Likes • {book.like_count}</p>
            <p>Bookmarks • {book.bookmark_count}</p>

            {/* Star Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-600 text-slate-600'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-slate-400">4.0</span>
            </div>
          </div>
          {user ? (
            <div className="space-y-2">
              <button className="btn-primary w-full" onClick={() => navigate(`/reader/${book.id}`)}>
                Open reader
              </button>
              <div className="flex gap-2">
                <button
                  className={`w-1/2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${book.is_liked
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-white/10 text-white hover:border-red-500/50 hover:bg-red-500/5'
                    }`}
                  onClick={() => likeMutation.mutate()}
                >
                  ♥ Like
                </button>
                <button
                  className={`w-1/2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${book.is_bookmarked
                      ? 'border-brand-400 bg-brand-400/10 text-brand-300'
                      : 'border-white/10 text-white hover:border-brand-400/50 hover:bg-brand-400/5'
                    }`}
                  onClick={() => bookmarkMutation.mutate()}
                >
                  ⌁ Bookmark
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Log in to like, bookmark, and open the reader.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
