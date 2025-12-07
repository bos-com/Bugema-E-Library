import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Clock, Calendar, Star, Crown, Check, ChevronRight, CreditCard, Smartphone, Wallet, ArrowRight } from 'lucide-react';

interface SubscriptionPaywallProps {
    isOpen: boolean;
    onClose: () => void;
    actionBlocked?: string;
}

// Payment method logos
const MobileMoneyLogo = () => (
    <div className="flex items-center gap-1">
        <div className="h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-white font-bold text-[8px]">MTN</span>
        </div>
        <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white font-bold text-[6px]">Airtel</span>
        </div>
    </div>
);

const VisaLogo = () => (
    <div className="flex items-center justify-center rounded bg-[#1A1F71] px-2 py-1">
        <span className="text-white font-bold text-xs">VISA</span>
    </div>
);

const PayPalLogo = () => (
    <div className="flex items-center justify-center rounded bg-[#003087] px-2 py-1">
        <span className="text-[#009CDE] font-bold text-xs">Pay</span>
        <span className="text-white font-bold text-xs">Pal</span>
    </div>
);

const SubscriptionPaywall = ({ isOpen, onClose, actionBlocked = 'access this feature' }: SubscriptionPaywallProps) => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'MTN' | 'Airtel'>('MTN');

    if (!isOpen) return null;

    const plans = [
        { id: 1, name: 'Hourly', price: 2000, icon: Clock },
        { id: 2, name: 'Weekly', price: 15000, icon: Calendar },
        { id: 3, name: 'Monthly', price: 40000, icon: Star, popular: true },
        { id: 4, name: 'Yearly', price: 300000, icon: Crown },
    ];

    const paymentMethods = [
        {
            id: 'mobile-money',
            name: 'Mobile Money',
            subtitle: 'MTN MoMo or Airtel Money',
            icon: Smartphone,
            color: 'text-yellow-600',
            bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10',
            border: 'border-yellow-200 dark:border-yellow-500/30',
        },
        {
            id: 'card',
            name: 'Card Payment',
            subtitle: 'Visa or MasterCard',
            icon: CreditCard,
            color: 'text-blue-600',
            bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10',
            border: 'border-blue-200 dark:border-blue-500/30',
        },
        {
            id: 'paypal',
            name: 'PayPal',
            subtitle: 'Pay with PayPal account',
            icon: Wallet,
            color: 'text-sky-600',
            bg: 'bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-500/10 dark:to-cyan-500/10',
            border: 'border-sky-200 dark:border-sky-500/30',
        },
    ];

    const handleSelectPlan = (planId: number) => {
        setSelectedPlan(planId);
    };

    const handleSelectPaymentMethod = (methodId: string) => {
        setSelectedPaymentMethod(methodId);
    };

    const handleProceedPayment = () => {
        if (!selectedPlan || !selectedPaymentMethod) return;
        onClose();
        const methodPath = selectedPaymentMethod === 'mobile-money' 
            ? `${selectedPaymentMethod}/${mobileMoneyProvider.toLowerCase()}`
            : selectedPaymentMethod;
        navigate(`/subscription/payment/${selectedPlan}/${methodPath}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl animate-in rounded-2xl bg-white shadow-2xl dark:bg-slate-900 my-4">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-6 text-center text-white rounded-t-2xl">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                        <BookOpen className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold">Subscribe to Continue</h2>
                    <p className="mt-1 text-brand-100">
                        <span className="font-medium">Subscription required</span> to {actionBlocked}
                    </p>
                </div>

                {/* Content - Horizontal Layout */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Left - Features & Payment Methods */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">What you'll get:</h3>
                            <ul className="space-y-2">
                                {[
                                    'Unlimited access to all books',
                                    'Read anywhere, anytime',
                                    'Highlights and notes',
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Payment Methods */}
                        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Payment Methods:</h3>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
                                    <MobileMoneyLogo />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Mobile Money</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
                                    <VisaLogo />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Card</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
                                    <PayPalLogo />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Plans and Payment Methods */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Choose a Plan:</h3>
                            <div className="space-y-2">
                                {plans.map((plan) => {
                                    const Icon = plan.icon;
                                    const isSelected = selectedPlan === plan.id;
                                    return (
                                        <button
                                            key={plan.id}
                                            onClick={() => handleSelectPlan(plan.id)}
                                            className={`relative w-full flex items-center gap-3 rounded-xl border-2 p-3 transition-all hover:scale-[1.01] ${isSelected
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20'
                                                    : plan.popular
                                                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                                                    : 'border-slate-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-slate-800'
                                                }`}
                                        >
                                            {plan.popular && (
                                                <div className="absolute -top-2 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
                                                    POPULAR
                                                </div>
                                            )}
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-600' : plan.popular ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                                                }`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-400' : plan.popular ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                    {plan.name}
                                                </p>
                                            </div>
                                            <p className={`font-bold ${isSelected ? 'text-blue-600' : plan.popular ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                                                UGX {plan.price.toLocaleString()}
                                            </p>
                                            {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Methods - Show only when plan is selected */}
                        {selectedPlan && (
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Select Payment Method:</h3>
                                <div className="space-y-2">
                                    {paymentMethods.map((method) => {
                                        const Icon = method.icon;
                                        const isSelected = selectedPaymentMethod === method.id;
                                        return (
                                            <div key={method.id}>
                                                <button
                                                    onClick={() => handleSelectPaymentMethod(method.id)}
                                                    className={`w-full flex items-center gap-4 rounded-xl border-2 p-3 transition-all hover:scale-[1.01] ${isSelected
                                                            ? `${method.border} ${method.bg} border-blue-500`
                                                            : `${method.border} ${method.bg}`
                                                        }`}
                                                >
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800 ${method.color}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-semibold text-slate-900 dark:text-white">{method.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{method.subtitle}</p>
                                                    </div>
                                                    {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                                                </button>
                                                {/* Mobile Money Provider Dropdown */}
                                                {isSelected && method.id === 'mobile-money' && (
                                                    <div className="mt-2 ml-14">
                                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                            Select Provider:
                                                        </label>
                                                        <select
                                                            value={mobileMoneyProvider}
                                                            onChange={(e) => setMobileMoneyProvider(e.target.value as 'MTN' | 'Airtel')}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                                                        >
                                                            <option value="MTN">MTN Mobile Money</option>
                                                            <option value="Airtel">Airtel Money</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Proceed Button */}
                        {selectedPlan && selectedPaymentMethod && (
                            <button
                                onClick={handleProceedPayment}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white font-semibold transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                Proceed to Payment
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-white/10 px-6 py-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Secure payment • Instant access • Cancel anytime
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPaywall;
