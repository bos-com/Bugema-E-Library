import { Link } from 'react-router-dom';
import { BookOpen, Clock, ShieldCheck } from 'lucide-react';

const VisitorAccessPage = () => {
    return (
        <div className="mx-auto max-w-lg space-y-8 py-8">
            <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <BookOpen size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Visitor Access</h1>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                    Not a current student or staff member? No problem. Subscribe to access our complete digital library.
                </p>
            </div>

            <div className="space-y-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/50">
                <h3 className="font-semibold text-slate-900 dark:text-white">Why subscribe?</h3>
                <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <BookOpen className="shrink-0 text-brand-500" size={20} />
                        <span>Unlimited access to thousands of books and resources</span>
                    </li>
                    <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="shrink-0 text-brand-500" size={20} />
                        <span>Flexible plans: Hourly, Daily, Weekly, Monthly, Yearly</span>
                    </li>
                    <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <ShieldCheck className="shrink-0 text-brand-500" size={20} />
                        <span>Secure payment and instant access</span>
                    </li>
                </ul>
            </div>

            <div className="space-y-4">
                <Link
                    to="/visitor-register"
                    className="btn-primary flex w-full items-center justify-center py-3 text-base"
                >
                    Create Account & Subscribe
                </Link>
                <Link
                    to="/login"
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                    Already have an account? Sign In
                </Link>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-500">
                Payments by Mobile Money, Visa, PayPal
            </p>
        </div>
    );
};

export default VisitorAccessPage;
