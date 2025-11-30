import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BookSummary } from '../../lib/types';
import { useAuthStore } from '../../lib/store/auth';

interface BookCardProps {
    book: BookSummary;
    viewMode: 'grid' | 'list';
    onLike: (id: number) => void;
    onBookmark: (id: number) => void;
}

const BookCard = memo(({ book, viewMode, onLike, onBookmark }: BookCardProps) => {
    const user = useAuthStore((state) => state.user);

    if (viewMode === 'grid') {
        return (
            <div className="card flex flex-col gap-3 p-4">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                    {book.cover_image ? (
                        <img
                            src={book.cover_image}
                            alt={book.title}
                            className="h-full w-full object-cover transition duration-300 hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400 dark:text-slate-600">
                            No Cover
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-300">{book.author}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white line-clamp-2">{book.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{book.description}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{book.language}</span>•<span>{book.file_type}</span>
                    {book.reading_progress && (
                        <span className="ml-auto text-brand-600 dark:text-brand-200">{Math.round(book.reading_progress.percent)}%</span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                    {Array.isArray(book.tags) ? book.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-white/10">
                            #{tag}
                        </span>
                    )) : null}
                </div>
                <div className="mt-auto flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Link
                            to={`/catalog/${book.id}`}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:border-brand-500 dark:hover:bg-white/5"
                        >
                            View
                        </Link>
                        <Link
                            to={`/reader/${book.id}`}
                            className="btn-gradient-blue flex-1 px-3 py-1.5 text-center text-xs"
                        >
                            Read
                        </Link>
                    </div>
                    {user && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => onLike(book.id)}
                                className={`btn-icon ${book.is_liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                title={book.is_liked ? 'Unlike' : 'Like'}
                            >
                                <svg className="h-6 w-6" fill={book.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onBookmark(book.id)}
                                className={`btn-icon ${book.is_bookmarked ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
                                title={book.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                            >
                                <svg className="h-6 w-6" fill={book.is_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="card flex gap-4 p-4">
            <div className="h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                {book.cover_image ? (
                    <img
                        src={book.cover_image}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 dark:text-slate-600">
                        No Cover
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
                <div>
                    <p className="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-300">{book.author}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{book.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{book.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{book.language}</span>•<span>{book.file_type}</span>
                    {book.reading_progress && (
                        <span className="ml-auto text-brand-600 dark:text-brand-200">{Math.round(book.reading_progress.percent)}%</span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
                    {Array.isArray(book.tags) ? book.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-white/10">
                            #{tag}
                        </span>
                    )) : null}
                </div>
                <div className="mt-auto flex items-center gap-3">
                    <Link
                        to={`/catalog/${book.id}`}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    >
                        View Details
                    </Link>
                    <Link
                        to={`/reader/${book.id}`}
                        className="btn-gradient-blue px-4 py-2 text-sm"
                    >
                        Read Now
                    </Link>
                    {user && (
                        <div className="ml-auto flex items-center gap-3">
                            <button
                                onClick={() => onLike(book.id)}
                                className={`btn-icon ${book.is_liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                title={book.is_liked ? 'Unlike' : 'Like'}
                            >
                                <svg className="h-6 w-6" fill={book.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onBookmark(book.id)}
                                className={`btn-icon ${book.is_bookmarked ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
                                title={book.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                            >
                                <svg className="h-6 w-6" fill={book.is_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default BookCard;
