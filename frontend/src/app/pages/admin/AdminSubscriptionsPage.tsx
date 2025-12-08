import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DollarSign, Users, TrendingUp, Calendar, Filter } from 'lucide-react';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import api from '../../../lib/api/client';

interface AdminSubscription {
    id: number;
    user_name: string;
    user_email: string;
    plan_name: string;
    plan_duration: string;
    start_date: string;
    end_date: string;
    status: string;
    amount_paid: string;
    payment_method: string;
    is_active: boolean;
    created_at: string;
}

interface RevenueStats {
    currency: string;
    revenue_today: number;
    revenue_month: number;
    revenue_year: number;
    revenue_total: number;
    active_subscribers: number;
}

type PeriodFilter = 'all' | 'week' | 'month' | 'year';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const AdminSubscriptionsPage = () => {
    const [period, setPeriod] = useState<PeriodFilter>('all');

    // Fetch revenue stats
    const { data: revenue, isLoading: revenueLoading } = useQuery<RevenueStats>({
        queryKey: ['admin-subscription-revenue'],
        queryFn: async () => {
            const { data } = await api.get('/subscriptions/admin/revenue/');
            return data;
        },
        staleTime: 60 * 1000, // 1 minute cache
    });

    // Fetch subscription list with period filter
    const { data: subscriptions = [], isLoading: listLoading } = useQuery<AdminSubscription[]>({
        queryKey: ['admin-subscription-list', period],
        queryFn: async () => {
            const params = period !== 'all' ? `?period=${period}` : '';
            const { data } = await api.get(`/subscriptions/admin/list/${params}`);
            // Handle both array and paginated response (with results array)
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.results)) {
                return data.results;
            }
            return [];
        },
        staleTime: 30 * 1000, // 30 seconds cache
    });

    const isLoading = revenueLoading || listLoading;

    if (isLoading) {
        return <LoadingOverlay label="Loading subscriptions" />;
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">Admin</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Subscription Management</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Track revenue and manage subscriber accounts
                </p>
            </div>

            {/* Revenue Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="stat-card-emerald">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Today</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {formatCurrency(revenue?.revenue_today || 0)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/10 p-3">
                            <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="stat-card-blue">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">This Month</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {formatCurrency(revenue?.revenue_month || 0)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-500/10 p-3">
                            <Calendar className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="stat-card-violet">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-violet-600 dark:text-violet-400">This Year</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {formatCurrency(revenue?.revenue_year || 0)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-violet-500/10 p-3">
                            <TrendingUp className="h-6 w-6 text-violet-500" />
                        </div>
                    </div>
                </div>

                <div className="stat-card-amber">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">Active Subscribers</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {revenue?.active_subscribers || 0}
                            </p>
                        </div>
                        <div className="rounded-xl bg-amber-500/10 p-3">
                            <Users className="h-6 w-6 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/5">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All Subscriptions</h2>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="all">All Time</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3">Subscriber</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Duration</th>
                                <th className="px-6 py-3">Expires</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No subscriptions found
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {sub.user_name}
                                                </div>
                                                <div className="text-xs text-slate-500">{sub.user_email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium">{sub.plan_name || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sub.is_active
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {sub.is_active ? 'Active' : 'Expired'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {formatCurrency(parseFloat(sub.amount_paid))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                                                {sub.plan_duration || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sub.end_date
                                                ? new Date(sub.end_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminSubscriptionsPage;
