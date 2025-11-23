import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../lib/store/auth';

const adminLinks = [
  { label: 'Overview', to: '/admin/overview' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Books', to: '/admin/books' },
  { label: 'Categories', to: '/admin/categories' },
];

const AdminLayout = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-slate-900/60 lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">Admin</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Library Control</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
        <nav className="mt-10 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2 font-medium transition ${isActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-slate-900/60 lg:hidden">
          <span className="font-semibold text-slate-900 dark:text-white">Admin Panel</span>
          {/* Mobile menu trigger could go here */}
        </header>

        <main className="flex-1 px-6 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
