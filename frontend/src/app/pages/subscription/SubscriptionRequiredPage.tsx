import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Clock, Calendar, Star, Crown, Check, ChevronRight } from 'lucide-react';

interface SubscriptionRequiredPageProps {
    actionBlocked?: string;
    bookTitle?: string;
}

// Payment method logos as SVG components
const MobileMoneyLogo = () => (
    <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-white font-bold text-xs">MTN</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white font-bold text-[8px]">Airtel</span>
        </div>
    </div>
);

const VisaLogo = () => (
    <div className="flex items-center gap-2">
        <svg className="h-8 w-16" viewBox="0 0 80 26" fill="none">
            <rect width="80" height="26" rx="4" fill="#1A1F71" />
            <text x="10" y="18" fill="white" fontWeight="bold" fontSize="14" fontFamily="Arial">VISA</text>
        </svg>
    </div>
);

const PayPalLogo = () => (
    <div className="flex items-center">
        <svg className="h-8 w-20" viewBox="0 0 100 26" fill="none">
            <rect width="100" height="26" rx="4" fill="#003087" />
            <text x="8" y="18" fill="#009CDE" fontWeight="bold" fontSize="12" fontFamily="Arial">Pay</text>
            <text x="35" y="18" fill="#012169" fontWeight="bold" fontSize="12" fontFamily="Arial">Pal</text>
        </svg>
    </div>
);

const SubscriptionRequiredPage = ({ actionBlocked = 'access this content', bookTitle }: SubscriptionRequiredPageProps) => {
    const navigate = useNavigate();

    const plans = [
        { id: 1, name: 'Hourly', duration: 'HOURLY', price: 2000, icon: Clock, color: 'slate' },
        { id: 2, name: 'Weekly', duration: 'WEEKLY', price: 15000, icon: Calendar, color: 'blue' },
        { id: 3, name: 'Monthly', duration: 'MONTHLY', price: 40000, icon: Star, color: 'amber', popular: true },
        { id: 4, name: 'Yearly', duration: 'YEARLY', price: 300000, icon: Crown, color: 'purple' },
    ];

    const features = [
        'Unlimited access to all books',
        'Read anywhere, anytime',
        'Download for offline reading',
        'Highlights and notes',
        'Reading analytics & progress tracking',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 py-6 px-4">
                <div className="mx-auto max-w-6xl flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-white">
                        <BookOpen className="h-8 w-8" />
                        <span className="text-xl font-bold">Bugema E-Library</span>
                    </Link>
                    <Link to="/catalog" className="text-sm text-white/80 hover:text-white">
                        ← Back to Catalog
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Side - Subscription Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Subscribe to Continue
                            </h1>
                            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                                Get unlimited access to our entire digital library
                            </p>
                            {bookTitle && (
                                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-500/10 dark:border-amber-500/30">
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        <span className="font-semibold">Subscription required</span> to {actionBlocked}
                                        {bookTitle && <span className="font-medium"> "{bookTitle}"</span>}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <div className="rounded-xl bg-white border border-slate-200 p-6 dark:bg-slate-800 dark:border-white/10">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">What you'll get:</h3>
                            <ul className="space-y-3">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Payment Methods */}
                        <div className="rounded-xl bg-white border border-slate-200 p-6 dark:bg-slate-800 dark:border-white/10">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Accepted Payment Methods:</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                    <MobileMoneyLogo />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Mobile Money</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                    <VisaLogo />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Visa / MasterCard</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                    <PayPalLogo />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">PayPal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Plans */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Choose Your Plan</h2>

                        <div className="space-y-3">
                            {plans.map((plan) => {
                                const Icon = plan.icon;
                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() => navigate(`/subscription/payment/${plan.id}`)}
                                        className={`relative w-full flex items-center gap-4 rounded-xl border-2 p-4 transition-all hover:scale-[1.01] hover:shadow-lg ${plan.popular
                                                ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10'
                                                : 'border-slate-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-slate-800'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                                MOST POPULAR
                                            </div>
                                        )}

                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${plan.popular ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                            }`}>
                                            <Icon className="h-6 w-6" />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <p className={`font-semibold ${plan.popular ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                {plan.name} Pass
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Access for {plan.duration === 'HOURLY' ? '1 hour' : plan.duration === 'WEEKLY' ? '7 days' : plan.duration === 'MONTHLY' ? '30 days' : '1 year'}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${plan.popular ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                UGX {plan.price.toLocaleString()}
                                            </p>
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-slate-400" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Trust badges */}
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-emerald-500" /> Instant Access
                                </span>
                                <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-emerald-500" /> Secure Payment
                                </span>
                                <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-emerald-500" /> Cancel Anytime
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionRequiredPage;
