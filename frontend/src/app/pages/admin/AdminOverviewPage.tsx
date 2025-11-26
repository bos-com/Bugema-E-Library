import { useQuery } from '@tanstack/react-query';
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getAdminOverview } from '../../../lib/api/analytics';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import StatCard from '../../../components/cards/StatCard';

const COLORS = ['#EF4444', '#3B82F6', '#EAB308', '#F97316', '#22C55E'];

const AdminOverviewPage = () => {
  const { data, isPending } = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview });

  if (isPending || !data) {
    return <LoadingOverlay label="Fetching analytics" />;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-brand-200">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Analytics overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Books" value={data.overview.total_books} />
        <StatCard label="Readers" value={data.overview.total_users} />
        <StatCard label="Reads (30d)" value={data.overview.total_reads} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Reads per day</h2>
            <p className="text-xs text-slate-500">Last 30 days</p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.reads_per_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#475569" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white">Most Liked Categories</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.most_liked_categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="likes"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {data.most_liked_categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  wrapperStyle={{ color: '#fff' }}
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#fff', fontSize: '14px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white">Peak Usage Times (Reads per Hour)</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.reads_per_hour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" />
              <YAxis stroke="#475569" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
              <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-white">Most read books</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {data.most_read_books.map((book) => (
              <li key={book.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0">
                <div>
                  <p className="font-semibold text-white">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                </div>
                <span className="text-xs text-slate-400">{book.view_count} views</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-white">Top search terms</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {data.top_search_terms.map((term) => (
              <li key={term.term} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0">
                <span>#{term.term}</span>
                <span className="text-xs text-slate-500">{term.count} hits</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
