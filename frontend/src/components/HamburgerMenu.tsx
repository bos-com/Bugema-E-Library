import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Home, BookOpen, LayoutDashboard, Shield } from 'lucide-react';
import { useAuthStore } from '../lib/store/auth';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const navItems = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Catalog', to: '/catalog', icon: BookOpen },
    { label: user?.role === 'ADMIN' ? 'Dashboard' : 'My Dashboard', to: user?.role === 'ADMIN' ? '/admin' : '/dashboard', icon: user?.role === 'ADMIN' ? Shield : LayoutDashboard, protected: true },
  ];

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        aria-label="Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
          <nav className="p-2">
            {navItems.map((item) => {
              if (item.protected && !user) return null;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
