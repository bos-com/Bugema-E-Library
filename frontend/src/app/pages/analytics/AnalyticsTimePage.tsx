import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getUserAnalytics } from '../../../lib/api/reading';
import { AnalyticsData } from '../../../lib/types';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';

type TimeRange = 'week' | 'month' | 'year';

// Color palette for bars
const BAR_COLORS = [
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
    '#f97316', '#f59e0b'
];

const AnalyticsTimePage = () => {
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');

    const { data, isLoading } = useQuery<AnalyticsData>({
        queryKey: ['analytics', timeRange],
        queryFn: () => getUserAnalytics(timeRange),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    if (isLoading) {
        return <LoadingOverlay label="Loading time analytics" />;
    }

    const hourlyData = data?.hourly_distribution || [];
    const dailyData = data?.daily_distribution || [];

    // Format data for Bar Chart
    const barChartData = dailyData.map((d: any, index: number) => ({
        day: timeRange === 'week' ? d.day_name : d.date.split('-')[2], // Mon or 01
        minutes: d.minutes,
        fullDay: d.full_day_name || d.date,
        color: BAR_COLORS[index % BAR_COLORS.length]
    }));

    // Calculate totals for summary cards
    const totalMinutes = dailyData.reduce((sum: number, d: any) => sum + (d.minutes || 0), 0);
    const avgDailyMinutes = dailyData.length > 0 ? Math.round(totalMinutes / dailyData.length) : 0;
    const peakHour = hourlyData.reduce((max: any, h: any) => h.minutes > (max?.minutes || 0) ? h : max, hourlyData[0]);

    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reading Time</h1>
                </div>
            </div>

            {/* How Time is Calculated Info */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">How Reading Time is Calculated</h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            When you open a book, we start a timer. When you leave or close the book, we stop the timer.
                            The difference is your reading time for that session. All sessions are added together to show your total reading time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">Total Hours</p>
                    <p className="text-3xl font-bold text-violet-900 dark:text-violet-100 mt-1">{totalHours}h</p>
                    <p className="text-sm text-violet-600 dark:text-violet-400 mt-1">This {timeRange}</p>
                </div>
                <div className="card bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Daily Average</p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{avgDailyMinutes} min</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Per day</p>
                </div>
                <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Peak Hour</p>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-1">{peakHour?.hour || 0}:00</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">Most active time</p>
                </div>
                <div className="card bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Total Minutes</p>
                    <p className="text-3xl font-bold text-rose-900 dark:text-rose-100 mt-1">{totalMinutes}</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">This {timeRange}</p>
                </div>
            </div>

            {/* Time Range Toggle */}
            <div className="flex justify-end">
                <div className="flex gap-1 rounded-xl border-2 border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${timeRange === 'week'
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                            }`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${timeRange === 'month'
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                            }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${timeRange === 'year'
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                            }`}
                    >
                        This Year
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Weekly/Monthly Reading Pattern - Colorful Bar Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {timeRange === 'week' ? 'Weekly' : 'Monthly'} Reading Pattern
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Minutes spent reading each day
                    </p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    dataKey="day"
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                />
                                <YAxis
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`${value} mins`, 'Reading Time']}
                                    labelFormatter={(label, payload) => payload[0]?.payload?.fullDay || label}
                                />
                                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                                    {barChartData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hourly Reading Activity - Area Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Daily Reading Pattern</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Minutes spent reading by hour of day (when you read most)
                    </p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    dataKey="hour"
                                    tickFormatter={(val) => `${val}:00`}
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                />
                                <YAxis
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`${value} mins`, 'Reading Time']}
                                    labelFormatter={(val) => `${val}:00 - ${Number(val) + 1}:00`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="minutes"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorMinutes)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTimePage;
