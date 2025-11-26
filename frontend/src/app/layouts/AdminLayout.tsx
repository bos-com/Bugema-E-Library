import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../lib/store/auth';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const adminLinks = [
  { label: 'Overview', to: '/admin/overview' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Books', to: '/admin/books' },
  { label: 'Categories', to: '/admin/categories' },
];

const AdminLayout = () => {
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Desktop */}
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
        {/* Top Header - Always Visible */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-white/5 dark:bg-slate-900/60">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 lg:hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div>
              <span className="text-base font-semibold text-slate-900 dark:text-white">Admin Dashboard</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{user?.name}</p>
            </div>
          </div>
          {/* Desktop nav links in header */}
          <nav className="hidden gap-4 text-sm font-medium lg:flex">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition ${isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-slate-900/60 lg:hidden">
            <nav className="space-y-2">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-2 text-sm font-medium transition ${isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 px-6 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
