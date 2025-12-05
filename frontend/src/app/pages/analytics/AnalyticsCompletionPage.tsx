import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getUserAnalytics } from '../../../lib/api/reading';
import { AnalyticsData } from '../../../lib/types';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const AnalyticsCompletionPage = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery<AnalyticsData>({
        queryKey: ['analytics'],
        queryFn: () => getUserAnalytics(),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return <LoadingOverlay label="Loading completion stats" />;
    }

    const stats = data?.completion_stats || { rate: 0, total: 0, completed: 0, by_category: [] };
    const categoryData = stats.by_category || [];

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
                        Analytics
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Completion Rate</h1>
                </div>
            </div>

            {/* Main Stat Card */}
            <div className="card p-8 text-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-none">
                <h2 className="text-5xl font-bold mb-2">{stats.rate}%</h2>
                <p className="text-cyan-100 text-lg">Books Completed</p>
                <div className="mt-6 flex justify-center gap-8">
                    <div>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                        <p className="text-sm text-cyan-100">Finished</p>
                    </div>
                    <div className="h-12 w-px bg-white/20"></div>
                    <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-cyan-100">Total Started</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Explanation Card */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">What is Completion Rate?</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Your completion rate measures the percentage of books you've finished out of all the books you've started reading.
                    </p>
                    <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-emerald-100 p-1 dark:bg-emerald-900/30">
                                <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-medium text-slate-900 dark:text-white">High Rate (&gt;80%):</span> You're a focused reader who finishes what they start.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-amber-100 p-1 dark:bg-amber-900/30">
                                <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-medium text-slate-900 dark:text-white">Low Rate (&lt;30%):</span> You enjoy exploring many books before committing to one.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Completed by Category</h3>
                    {categoryData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-center">
                            <p className="text-slate-500 dark:text-slate-400">No category data available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCompletionPage;
