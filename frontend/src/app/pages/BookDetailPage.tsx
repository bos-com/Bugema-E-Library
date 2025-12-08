import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { getBookDetail, toggleBookmark, toggleLike } from '../../lib/api/catalog';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';
import SubscriptionPaywall from '../../components/subscription/SubscriptionPaywall';
import { useAuthStore } from '../../lib/store/auth';
import { useSubscription } from '../../lib/hooks/useSubscription';
import type { BookDetail } from '../../lib/types';

const BookDetailPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallAction, setPaywallAction] = useState('');

  // Check if visitor needs subscription
  const { needsSubscription, isLoading: subscriptionLoading } = useSubscription();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBookDetail(bookId!),
    enabled: Boolean(bookId),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(Number(bookId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['book', bookId] });
      const previousBook = queryClient.getQueryData<BookDetail>(['book', bookId]);
      queryClient.setQueryData<BookDetail>(['book', bookId], (old) => {
        if (!old) return old;
        return {
          ...old,
          is_liked: !old.is_liked,
          like_count: old.is_liked ? old.like_count - 1 : old.like_count + 1
        };
      });
      return { previousBook };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBook) {
        queryClient.setQueryData(['book', bookId], context.previousBook);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['book', bookId] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(Number(bookId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['book', bookId] });
      const previousBook = queryClient.getQueryData<BookDetail>(['book', bookId]);
      queryClient.setQueryData<BookDetail>(['book', bookId], (old) => {
        if (!old) return old;
        return {
          ...old,
          is_bookmarked: !old.is_bookmarked,
          bookmark_count: old.is_bookmarked ? old.bookmark_count - 1 : old.bookmark_count + 1
        };
      });
      return { previousBook };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBook) {
        queryClient.setQueryData(['book', bookId], context.previousBook);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['book', bookId] }),
  });

  // Handler that checks subscription before allowing action
  const handleProtectedAction = (action: 'like' | 'bookmark' | 'read') => {
    if (!subscriptionLoading && needsSubscription) {
      setPaywallAction(action === 'like' ? 'like books' : action === 'bookmark' ? 'bookmark books' : 'read books');
      setShowPaywall(true);
      return true; // Action was blocked
    }
    return false; // Action allowed
  };

  const handleLike = () => {
    if (!handleProtectedAction('like')) {
      likeMutation.mutate();
    }
  };

  const handleBookmark = () => {
    if (!handleProtectedAction('bookmark')) {
      bookmarkMutation.mutate();
    }
  };

  const handleOpenReader = () => {
    if (!handleProtectedAction('read')) {
      navigate(`/reader/${book?.id}`);
    }
  };

  if (isLoading || !book) {
    return <LoadingOverlay label="Loading book details" />;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-600 dark:text-slate-400">
        ← Back to list
      </button>

      <div className="card grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-300">
            {book.author}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-white">{book.title}</h1>
          <p className="mt-4 text-slate-700 dark:text-slate-300">{book.description}</p>
          <div className="mt-6 grid gap-4 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
            <p>Language: {book.language}</p>
            <p>Year: {book.year ?? '—'}</p>
            <p>Pages: {book.pages ?? '—'}</p>
            <p>ISBN: {book.isbn}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-500">
            {Array.isArray(book.tags) && book.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 px-3 py-1 dark:border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Stats</p>
            <p className="mt-3">Views • {book.view_count}</p>
            <p>Likes • {book.like_count}</p>
            <p>Bookmarks • {book.bookmark_count}</p>

            {/* Star Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="text-lg leading-none text-yellow-400">
                ★★★★☆
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">4.0 rating</span>
            </div>
          </div>
          {user ? (
            <div className="space-y-2">
              <button className="btn-primary w-full" onClick={handleOpenReader}>
                Open reader
              </button>
              <div className="flex gap-2">
                <button
                  className={`w-1/2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${book.is_liked
                    ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'border-slate-300 text-slate-700 hover:border-red-500/50 hover:bg-red-50 dark:border-white/10 dark:text-white dark:hover:bg-red-500/5'
                    }`}
                  onClick={handleLike}
                >
                  ♥ Like
                </button>
                <button
                  className={`w-1/2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${book.is_bookmarked
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300'
                    : 'border-slate-300 text-slate-700 hover:border-brand-400/50 hover:bg-brand-50 dark:border-white/10 dark:text-white dark:hover:bg-brand-400/5'
                    }`}
                  onClick={handleBookmark}
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

      {/* Subscription Paywall Modal */}
      <SubscriptionPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        actionBlocked={paywallAction}
      />
    </div>
  );
};

export default BookDetailPage;
