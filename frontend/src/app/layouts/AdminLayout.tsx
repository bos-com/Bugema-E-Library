import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../lib/store/auth';

const adminLinks = [
  { label: 'Overview', to: '/admin/overview' },
  { label: 'Books', to: '/admin/books' },
  { label: 'Categories', to: '/admin/categories' },
];

const AdminLayout = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden w-64 flex-col border-r border-white/5 bg-slate-900/60 p-6 lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-300">Admin</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Library Control</h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <nav className="mt-10 space-y-2 text-sm text-slate-400">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2 font-medium transition ${
                  isActive ? 'bg-brand-500/20 text-white' : 'hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
