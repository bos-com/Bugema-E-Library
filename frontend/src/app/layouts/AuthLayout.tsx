import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import bugemaLogo from '../../../bugema.webp';

const AuthLayout = () => (
  <div className="flex min-h-screen bg-white text-slate-900 dark:bg-gradient-to-r dark:from-sky-700 dark:via-slate-900 dark:to-black dark:text-white">
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      {/* Top bar with theme toggle */}
      <div className="flex justify-end px-6 pt-6">
        <ThemeToggle />
      </div>

      <div className="mt-6 flex flex-1">
        {/* Left illustration panel */}
        <div className="hidden lg:flex lg:w-[55%]">
          <div className="flex w-full flex-col justify-between bg-slate-50 px-12 py-10 dark:bg-black/5">
            <div className="flex flex-1 flex-col justify-center">
              <div className="flex items-center gap-3">
                <img src={bugemaLogo} alt="Bugema University" className="h-8 w-8 rounded-full object-cover" />
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500 dark:text-white/70">
                  Bugema University E-Library
                </p>
              </div>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 dark:text-white">
                <span className="bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent dark:from-sky-300 dark:to-blue-400">
                  Study from Anywhere,
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-500">
                  Access the Library Online
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-slate-600 dark:text-white/70">
                Find course texts, recommended readings, and research materials prepared for Bugema University
                students and staff &mdash; Excellence in Service.
              </p>

              {/* Student reading + simple bookshelf illustration */}
              <div className="mt-10 flex items-center gap-8">
                {/* Student icon */}
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-sky-600/10 shadow-lg shadow-black/20 dark:bg-black/20 dark:shadow-black/40">
                  <svg
                    viewBox="0 0 80 80"
                    aria-hidden="true"
                    className="h-24 w-24 text-sky-700 dark:text-white"
                  >
                    {/* Head */}
                    <circle cx="40" cy="20" r="9" className="fill-current" />
                    {/* Book */}
                    <path
                      d="M20 34c6 0 11 2 20 6 9-4 14-6 20-6v22c-6 0-11 2-20 6-9-4-14-6-20-6V34z"
                      className="fill-current"
                    />
                    {/* Hands */}
                    <circle cx="24" cy="44" r="4" className="fill-current" />
                    <circle cx="56" cy="44" r="4" className="fill-current" />
                  </svg>
                </div>

                {/* Bookshelf */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="h-16 w-6 rounded-md bg-amber-300/90" />
                    <span className="h-20 w-6 rounded-md bg-emerald-300/90" />
                    <span className="h-14 w-8 rounded-md bg-sky-300/90" />
                    <span className="h-16 w-5 rounded-md bg-rose-300/90" />
                    <span className="h-16 w-7 rounded-md bg-indigo-300/90" />
                  </div>
                  <div className="flex gap-2">
                    <span className="h-14 w-5 rounded-md bg-emerald-200/80" />
                    <span className="h-20 w-7 rounded-md bg-sky-200/80" />
                    <span className="h-16 w-6 rounded-md bg-violet-200/80" />
                    <span className="h-20 w-5 rounded-md bg-amber-200/80" />
                    <span className="h-16 w-8 rounded-md bg-rose-200/80" />
                  </div>
                  <div className="h-1.5 w-40 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
            <p className="mt-10 text-xs text-slate-500 dark:text-white/60">
              © {new Date().getFullYear()} Bugema University E-Library &mdash; Excellence in Service
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 lg:w-[45%] flex-col items-center justify-center bg-white px-8 py-10 lg:px-16 dark:bg-transparent">
          <div className="w-full max-w-md space-y-10">
            <Link to="/" className="text-sm font-semibold text-slate-900 dark:text-white">
              ← Back to Home
            </Link>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
