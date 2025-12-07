import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../../lib/api/reading';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';

import { DashboardData } from '../../lib/types';

const CompletedBooksPage = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: () => getDashboard(),
        staleTime: 2 * 60 * 1000,
    });

    if (isLoading) {
        return <LoadingOverlay label="Loading completed books" />;
    }

    const completedBooks = data?.completed || [];

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <svg className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
                        Library
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Completed Books</h1>
                </div>
            </div>

            {completedBooks.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {completedBooks.map((book) => (
                        <div
                            key={book.id}
                            onClick={() => navigate(`/books/${book.book}`)}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-white/5 dark:bg-slate-800"
                        >
                            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 mb-4">
                                {book.book_cover ? (
                                    <img
                                        src={book.book_cover}
                                        alt={book.book_title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <svg className="h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{book.book_title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Finished on {new Date(book.updated_at).toLocaleDateString()}</p>

                            <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-medium">Completed</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800 mb-4">
                        <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No completed books yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Keep reading to build your collection!</p>
                </div>
            )}
        </div>
    );
};

export default CompletedBooksPage;
