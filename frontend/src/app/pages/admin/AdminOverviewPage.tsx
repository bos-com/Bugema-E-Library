import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getAdminOverview } from '../../../lib/api/analytics';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import StatCard from '../../../components/cards/StatCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

type TimePeriod = 'today' | 'week' | 'month' | 'year';

const periodLabels: Record<TimePeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year'
};

const AdminOverviewPage = () => {
  const [searchPeriod, setSearchPeriod] = useState<TimePeriod>('month');
  const [likedPeriod, setLikedPeriod] = useState<TimePeriod>('month');
  const [readsPeriod, setReadsPeriod] = useState<TimePeriod>('month');
  const [viewedPeriod, setViewedPeriod] = useState<TimePeriod>('month');

  // Use period for filtering
  const { data, isPending, refetch } = useQuery({
    queryKey: ['admin-overview', readsPeriod, likedPeriod, searchPeriod, viewedPeriod],
    queryFn: () => getAdminOverview(readsPeriod, likedPeriod, searchPeriod, viewedPeriod),
    staleTime: 2 * 60 * 1000,
  });

  if (isPending || !data) {
    return <LoadingOverlay label="Fetching analytics" />;
  }

  const filteredReadsPerDay = data.reads_per_day || [];

  return (
    <div className="space-y-8 animate-in">
      {/* Page Header */}
      <div className="page-header">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">Admin</p>
        <h1 className="page-title">Analytics Overview</h1>
        <p className="page-subtitle">Monitor library performance and user engagement</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          variant="blue"
          label="Total Books"
          value={data.overview.total_books}
          hint="In library"
        />
        <StatCard
          variant="emerald"
          label="Active Readers"
          value={data.overview.total_users}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          hint="Registered users"
        />
        <div className="relative">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Reads</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {periodLabels[readsPeriod]}
              </span>
            </div>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {data.overview.total_reads_period || data.overview.total_reads}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Book opens ({periodLabels[readsPeriod]})
            </p>
          </div>
          <div className="absolute top-2 right-12 group">
            <svg className="h-4 w-4 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute right-0 top-6 z-10 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg">
              Each time a user opens a book to read it, it counts as 1 read.
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reads Per Day Chart */}
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reading Activity</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {readsPeriod === 'today' ? 'Hourly reads today' : `Daily reads over the last ${readsPeriod}`}
              </p>
            </div>
            <select
              value={readsPeriod}
              onChange={(e) => setReadsPeriod(e.target.value as TimePeriod)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredReadsPerDay}>
                <defs>
                  <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" hide stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#colorReads)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Liked Categories */}
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Popular Categories</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Most liked book categories</p>
            </div>
            <select
              value={likedPeriod}
              onChange={(e) => setLikedPeriod(e.target.value as TimePeriod)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.most_liked_categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="likes"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {data.most_liked_categories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peak Usage Times */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Peak Usage Times</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Book opens by hour of day (shows when users are most active)</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.reads_per_hour}>
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis stroke="#64748b" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                formatter={(value: number) => [`${value} opens`, 'Book Opens']}
              />
              <Bar dataKey="count" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists Grid - 3 columns */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Most Viewed Books */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Most Viewed Books</h3>
            <select
              value={viewedPeriod}
              onChange={(e) => setViewedPeriod(e.target.value as TimePeriod)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <ul className="space-y-3">
            {data.most_read_books?.slice(0, 6).map((book: any, index: number) => (
              <li
                key={book.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{book.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 shrink-0">
                  {book.view_count} views
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Most Liked Books */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Most Liked Books</h3>
            <select
              value={likedPeriod}
              onChange={(e) => setLikedPeriod(e.target.value as TimePeriod)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <ul className="space-y-3">
            {(data.most_liked_books?.length > 0 ? data.most_liked_books : []).slice(0, 6).map((book: any, index: number) => (
              <li
                key={book.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{book.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 shrink-0">
                  {book.like_count || 0} likes
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Search Terms */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Search Terms</h3>
            <select
              value={searchPeriod}
              onChange={(e) => setSearchPeriod(e.target.value as TimePeriod)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <ul className="space-y-3">
            {data.top_search_terms?.slice(0, 6).map((term: any, index: number) => (
              <li
                key={term.term}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">#{term.term}</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 shrink-0">
                  {term.count} searches
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
