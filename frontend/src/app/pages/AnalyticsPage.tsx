import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getDashboard } from '../../lib/api/reading';
import { DashboardData } from '../../lib/types';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsPage = () => {
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: () => getDashboard(),
        staleTime: 2 * 60 * 1000,
    });

    if (isLoading) {
        return <LoadingOverlay label="Loading analytics" />;
    }

    if (!data) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-center">
                <p className="text-slate-600 dark:text-slate-400">Unable to load analytics data.</p>
            </div>
        );
    }

    // Prepare data for charts
    const dailyActivity = data.stats.daily_activity || [];

    const completionData = [
        { name: 'Completed', value: data.completed?.length || 0 },
        { name: 'In Progress', value: data.in_progress?.length || 0 },
    ];

    return (
        <div className="space-y-8 animate-in">
            <div className="page-header">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
                    Analytics
                </p>
                <h1 className="page-title">Reading Habits</h1>
                <p className="page-subtitle">Visualize your reading performance over time</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Daily Reading Time Bar Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Daily Reading Time (Last 14 Days)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                />
                                <YAxis
                                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`${value} mins`, 'Reading Time']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                />
                                <Bar dataKey="minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Reading Trend Line Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reading Trend</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    fontSize={12}
                                    tick={{ fill: '#64748b' }}
                                />
                                <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Completion Status Pie Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Book Completion Status</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={completionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {completionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#3b82f6'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-violet-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Completed ({completionData[0].value})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">In Progress ({completionData[1].value})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
