import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';

const SimpleAuthLayout = () => (
    <div className="flex min-h-screen bg-white text-slate-900 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col">
            {/* Top bar with theme toggle */}
            <div className="flex justify-end px-6 pt-6">
                <ThemeToggle />
            </div>

            {/* Centered content */}
            <div className="flex flex-1 items-center justify-center px-6 py-10">
                <div className="w-full max-w-md space-y-10">
                    <Link to="/" className="text-sm font-semibold text-slate-900 dark:text-white">
                        ← Back to Home
                    </Link>
                    <Outlet />
                </div>
            </div>
        </div>
    </div>
);

export default SimpleAuthLayout;
