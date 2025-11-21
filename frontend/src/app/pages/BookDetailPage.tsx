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
          </div>
          {user ? (
            <div className="space-y-2">
              <button className="btn-primary w-full" onClick={() => navigate(`/reader/${book.id}`)}>
                Open reader
              </button>
              <div className="flex gap-2">
                <button
                  className={`w-1/2 rounded-lg border px-3 py-2 text-sm font-semibold ${book.is_liked ? 'border-brand-400 text-brand-200' : 'border-white/10 text-white'
                    }`}
                  onClick={() => likeMutation.mutate()}
                >
                  ♥ Like
                </button>
                <button
                  className={`w-1/2 rounded-lg border px-3 py-2 text-sm font-semibold ${book.is_bookmarked ? 'border-brand-400 text-brand-200' : 'border-white/10 text-white'
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
