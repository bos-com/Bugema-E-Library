import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../lib/store/auth';
import { Menu, X, ChevronLeft, ChevronRight, LayoutDashboard, Users, BookOpen, FolderTree, CreditCard } from 'lucide-react';
import { useState } from 'react';
import bugemaLogo from '../../../bugema.webp';
import ThemeToggle from '../../components/ThemeToggle';

const adminLinks = [
  { label: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { label: 'Books', to: '/admin/books', icon: BookOpen },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
];

const AdminLayout = () => {
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className={`hidden flex-col border-r border-slate-200 bg-white p-4 transition-all duration-300 dark:border-white/5 dark:bg-slate-900/60 lg:flex ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Collapse button at top */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-4 flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Collapse</span>
            </div>
          )}
        </button>

        <div className={`flex ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed ? (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">Admin</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Library Control</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{user?.email}</p>
            </div>
          ) : (
            <h2 className="text-xl font-bold text-brand-500">LC</h2>
          )}
        </div>

        <nav className="mt-10 space-y-2 text-sm text-slate-600 dark:text-slate-400 flex-1">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center rounded-lg py-2 font-medium transition ${isActive
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
                } ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'}`
              }
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className="h-5 w-5" />
              {!isCollapsed && <span>{link.label}</span>}
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
            <div className="hidden lg:block">
              <NavLink
                to="/admin/overview"
                className="text-base font-semibold text-slate-900 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
              >
                Admin Dashboard
              </NavLink>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{user?.name}</p>
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white lg:hidden">Admin Dashboard</span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search books, users, categories..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
              />
            </div>
          </div>

          {/* Theme Toggle and Back to Main Site */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NavLink
              to="/"
              className="hidden md:flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Main Site
            </NavLink>
          </div>
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
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <link.icon className="h-5 w-5" />
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
