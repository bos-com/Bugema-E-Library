import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../lib/store/auth';
import ThemeToggle from '../../components/ThemeToggle';
import ProfileDropdown from '../../components/ProfileDropdown';
import HamburgerMenu from '../../components/HamburgerMenu';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Catalog', to: '/catalog' },
  { label: 'Dashboard', to: '/dashboard', protected: true },
];

const MainLayout = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/5 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-slate-900 dark:text-white">
            E-Library 2.0
          </Link>

          <nav className="hidden gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            {navItems.map((item) => {
              if (item.protected && !user) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `transition hover:text-slate-900 dark:hover:text-white ${isActive ? 'text-slate-900 dark:text-white' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'text-slate-900 dark:text-white' : '')}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            {user ? (
              <>
                <HamburgerMenu />
                <ProfileDropdown />
              </>
            ) : (
              <div className="space-x-3">
                <Link to="/login" className="text-sm font-medium text-slate-900 dark:text-white">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500 dark:border-white/5 dark:bg-slate-950/80">
        Built for Bugema University · Seamless reading without token headaches
      </footer>
    </div>
  );
};

export default MainLayout;
