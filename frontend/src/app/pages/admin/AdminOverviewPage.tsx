import { useQuery } from '@tanstack/react-query';
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getAdminOverview } from '../../../lib/api/analytics';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import StatCard from '../../../components/cards/StatCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

const AdminOverviewPage = () => {
  const { data, isPending } = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview });

  if (isPending || !data) {
    return <LoadingOverlay label="Fetching analytics" />;
  }

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
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
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
        <StatCard
          variant="violet"
          label="Total Reads"
          value={data.overview.total_reads}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          hint="Last 30 days"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reads Per Day Chart */}
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reading Activity</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Daily reads over the last 30 days</p>
            </div>
            <div className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              30 days
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.reads_per_day}>
                <defs>
                  <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  hide
                  stroke="#64748b"
                />
                <YAxis
                  stroke="#64748b"
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Popular Categories</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Most liked book categories</p>
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
                  {data.most_liked_categories.map((entry, index) => (
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
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peak Usage Times */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Peak Usage Times</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Reads by hour of day</p>
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
              />
              <YAxis
                stroke="#64748b"
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
              />
              <Bar dataKey="count" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Read Books */}
        <div className="card">
          <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Most Read Books</h3>
          <ul className="space-y-3">
            {data.most_read_books.map((book, index) => (
              <li
                key={book.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{book.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{book.author}</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {book.view_count} views
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Search Terms */}
        <div className="card">
          <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Top Search Terms</h3>
          <ul className="space-y-3">
            {data.top_search_terms.map((term, index) => (
              <li
                key={term.term}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">#{term.term}</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
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

