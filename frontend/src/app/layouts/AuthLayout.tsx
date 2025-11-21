import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <div className="flex min-h-screen bg-slate-950">
    <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-900 p-10 text-white lg:flex">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">E-Library</p>
        <h1 className="mt-4 text-4xl font-bold">Borrow. Read. Grow.</h1>
        <p className="mt-4 max-w-sm text-white/60">
          Access the full collection, track your progress, and manage the library from a unified dashboard.
        </p>
      </div>
      <p className="text-xs text-white/60">© {new Date().getFullYear()} Bugema Digital Library</p>
    </div>
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-10">
        <Link to="/" className="text-sm font-semibold text-white">
          ← Back to Home
        </Link>
        <Outlet />
      </div>
    </div>
  </div>
);

export default AuthLayout;
