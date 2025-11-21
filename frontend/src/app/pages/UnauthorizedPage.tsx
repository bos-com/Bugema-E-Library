import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="mx-auto max-w-md text-center">
    <p className="text-sm uppercase tracking-[0.3em] text-red-300">Restricted</p>
    <h1 className="mt-4 text-3xl font-semibold text-white">Insufficient permissions</h1>
    <p className="mt-2 text-slate-400">
      You need elevated privileges to see this page. Please log in with an administrator account.
    </p>
    <div className="mt-6 flex items-center justify-center gap-3">
      <Link to="/" className="btn-primary">
        Back Home
      </Link>
      <Link to="/login" className="text-sm font-semibold text-slate-300">
        Switch account →
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
