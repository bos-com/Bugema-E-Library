import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'default';
}

const StatCard = ({ label, value, icon, hint, trend, variant = 'default' }: StatCardProps) => {
  const variantClasses = {
    blue: 'stat-card-blue',
    emerald: 'stat-card-emerald',
    violet: 'stat-card-violet',
    amber: 'stat-card-amber',
    rose: 'stat-card-rose',
    cyan: 'stat-card-cyan',
    default: 'card',
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    default: 'text-brand-600 dark:text-brand-400',
  };

  return (
    <div className={variantClasses[variant]}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
              >
                {trend.isPositive ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <div className={`rounded-xl bg-white/50 p-3 dark:bg-slate-800/50 ${iconColors[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

