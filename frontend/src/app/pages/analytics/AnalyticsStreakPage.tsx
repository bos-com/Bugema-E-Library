import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../../../lib/api/reading';
import { DashboardData } from '../../../lib/types';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';

const AnalyticsStreakPage = () => {
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { data: dashboardData, isLoading } = useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: () => getDashboard(),
        staleTime: 2 * 60 * 1000,
    });

    // Generate calendar data for selected month
    const calendarData = useMemo(() => {
        if (!dashboardData?.stats?.streak_history) return [];

        const streakHistory = dashboardData.stats.streak_history || [];
        const readDates = new Set(
            streakHistory.filter((d: any) => d.read).map((d: any) => d.date)
        );

        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty slots for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ date: null, read: false });
        }

        // Add actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                day: d,
                read: readDates.has(dateStr)
            });
        }

        return days;
    }, [dashboardData, selectedMonth, selectedYear]);

    if (isLoading) {
        return <LoadingOverlay label="Loading streak data" />;
    }

    const currentStreak = dashboardData?.stats?.current_streak_days || 0;
    const longestStreak = dashboardData?.stats?.longest_streak_days || 0;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate year options (2025-2030)
    const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];

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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reading Streak</h1>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="card p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-white/20 p-3">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-100">Current Streak</p>
                            <h2 className="text-3xl font-bold">{currentStreak} Days</h2>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                            <svg className="h-8 w-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Longest Streak</p>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{longestStreak} Days</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="card p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reading Calendar</h3>
                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                        >
                            {months.map((month, idx) => (
                                <option key={month} value={idx}>{month}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarData.map((item, index) => (
                        <div
                            key={index}
                            className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all
                                ${!item.date
                                    ? ''
                                    : item.read
                                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                        >
                            {item.day || ''}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">Reading day</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800"></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">No reading</span>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                    <svg className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100">Keep Your Streak Going!</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                            Read at least one page every day to maintain your streak. Even a few minutes of reading counts!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsStreakPage;
