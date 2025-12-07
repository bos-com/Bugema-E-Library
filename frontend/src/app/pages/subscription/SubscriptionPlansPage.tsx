import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Smartphone, CreditCard, Wallet, Crown, Clock, Star, BookOpen } from 'lucide-react';
import { getPlans, SubscriptionPlan } from '../../../lib/api/subscriptions';

const SubscriptionPlansPage = () => {
    const navigate = useNavigate();
    const { data: plans, isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: getPlans,
    });

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin text-brand-500" size={32} />
            </div>
        );
    }

    // Fallback if no plans (should seed from backend)
    const displayPlans = plans && plans.length > 0 ? plans : [
        { id: 1, name: 'Hourly Pass', duration: 'HOURLY', price: '2000', description: 'Quick access for reading a chapter.', features: ['1 Hour Access', 'All Books', 'Basic Support'] },
        { id: 2, name: 'Daily Pass', duration: 'DAILY', price: '5000', description: 'Full day of unlimited reading.', features: ['24 Hours Access', 'All Books', 'Download for Offline'] },
        { id: 3, name: 'Weekly', duration: 'WEEKLY', price: '15000', description: 'Best for short term research.', features: ['7 Days Access', 'All Books', 'Highlights & Notes'] },
        { id: 4, name: 'Monthly', duration: 'MONTHLY', price: '40000', description: 'Most popular choice.', features: ['30 Days Access', 'All Books', 'Offline Mode', 'Reading Analytics'], popular: true },
        { id: 5, name: 'Yearly', duration: 'YEARLY', price: '300000', description: 'Best value for dedicated readers.', features: ['365 Days Access', 'All Books', 'Priority Support', 'Early Access to New Books'] },
    ] as (SubscriptionPlan & { popular?: boolean })[];

    const getPlanIcon = (duration: string) => {
        switch (duration) {
            case 'HOURLY': return <Clock className="h-6 w-6" />;
            case 'DAILY': return <BookOpen className="h-6 w-6" />;
            case 'WEEKLY': return <Star className="h-6 w-6" />;
            case 'MONTHLY': return <Crown className="h-6 w-6" />;
            case 'YEARLY': return <Crown className="h-6 w-6" />;
            default: return <BookOpen className="h-6 w-6" />;
        }
    };

    const getPlanGradient = (index: number) => {
        const gradients = [
            'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900',
            'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
            'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
            'from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20',
            'from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20',
        ];
        return gradients[index % gradients.length];
    };

    const getPlanAccentColor = (index: number) => {
        const colors = [
            'text-slate-600 dark:text-slate-400',
            'text-blue-600 dark:text-blue-400',
            'text-emerald-600 dark:text-emerald-400',
            'text-amber-600 dark:text-amber-400',
            'text-purple-600 dark:text-purple-400',
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Bugema University E-Library
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                    Choose Your Reading Plan
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                    Subscribe to access our complete digital library with thousands of books,
                    research papers, and academic resources.
                </p>
            </div>

            {/* Plans Grid - Responsive */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {displayPlans.map((plan, index) => {
                    const isPopular = (plan as any).popular || plan.duration === 'MONTHLY';

                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-2xl border p-5 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 ${isPopular
                                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/10 dark:border-amber-500/50 scale-[1.02]'
                                    : `border-slate-200 bg-gradient-to-br ${getPlanGradient(index)} dark:border-white/10`
                                }`}
                        >
                            {/* Popular Badge */}
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                                        <Star className="h-3 w-3 fill-current" />
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Plan Icon & Name */}
                            <div className="mb-3 mt-2">
                                <div className={`mb-2 inline-flex rounded-xl p-2 ${isPopular ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : `bg-white/50 dark:bg-white/5 ${getPlanAccentColor(index)}`}`}>
                                    {getPlanIcon(plan.duration)}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">UGX</span>
                                    <span className={`text-2xl font-bold ${isPopular ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                        {Number(plan.price).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="mb-5 flex-1 space-y-2">
                                {plan.features?.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-amber-500' : 'text-brand-500'}`} />
                                        <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Select Button */}
                            <button
                                onClick={() => navigate(`/subscription/payment/${plan.id}`)}
                                className={`mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isPopular
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 focus:ring-amber-500 shadow-lg shadow-amber-500/30'
                                        : 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500'
                                    }`}
                            >
                                Select Plan
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Payment Methods Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-800/50">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Secure Payment Options</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred payment method</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Mobile Money */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">MTN Mobile Money</span>
                    </div>

                    {/* Airtel Money */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Airtel Money</span>
                    </div>

                    {/* Visa/Mastercard */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Visa / Mastercard</span>
                    </div>

                    {/* PayPal */}
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/20">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">PayPal</span>
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="text-center space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-emerald-500" />
                        Instant Access
                    </span>
                    <span className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-emerald-500" />
                        Secure Payment
                    </span>
                    <span className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-emerald-500" />
                        Cancel Anytime
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlansPage;
