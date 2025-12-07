import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Smartphone, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSubscription, getPlans } from '../../../lib/api/subscriptions';

const MobileMoneyPaymentPage = () => {
    const { planId, provider: urlProvider } = useParams();
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [provider, setProvider] = useState<'MTN' | 'AIRTEL'>((urlProvider?.toUpperCase() as 'MTN' | 'AIRTEL') || 'MTN');
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');

    // Cache plans data
    const { data: plans } = useQuery({ 
        queryKey: ['subscription-plans'], 
        queryFn: getPlans,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });
    const plansArray = Array.isArray(plans) ? plans : [];
    const plan = plansArray.find(p => p.id === Number(planId));

    const mutation = useMutation({
        mutationFn: createSubscription,
        onSuccess: () => {
            setStep('success');
            setTimeout(() => navigate('/'), 3000);
        },
        onError: () => {
            toast.error('Payment failed. Please try again.');
            setStep('input');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setStep('processing');
        // Simulate payment processing delay
        setTimeout(() => {
            mutation.mutate({
                plan_id: Number(planId),
                payment_method: provider === 'MTN' ? 'MM' : 'AIRTEL'
            });
        }, 2000);
    };

    if (step === 'success') {
        return (
            <div className="mx-auto max-w-md py-16 text-center animate-in">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                    <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful!</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Your {plan?.name} subscription is now active. Redirecting...
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md space-y-6 py-8 animate-in">
            {/* Back link */}
            <Link
                to={`/subscription/payment/${planId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-400"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to payment options
            </Link>

            {/* Header */}
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500">
                    <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mobile Money Payment</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Pay UGX {plan ? Number(plan.price).toLocaleString() : '---'} for {plan?.name}
                </p>
            </div>

            {/* Provider Selection */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setProvider('MTN')}
                    disabled={step === 'processing'}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${provider === 'MTN'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
                            : 'border-slate-200 hover:border-slate-300 dark:border-white/10'
                        }`}
                >
                    <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">MTN</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">MTN MoMo</span>
                </button>
                <button
                    type="button"
                    onClick={() => setProvider('AIRTEL')}
                    disabled={step === 'processing'}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${provider === 'AIRTEL'
                            ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                            : 'border-slate-200 hover:border-slate-300 dark:border-white/10'
                        }`}
                >
                    <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">Airtel</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Airtel Money</span>
                </button>
            </div>

            {/* Phone Number Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Phone Number
                    </label>
                    <div className="flex">
                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400">
                            +256
                        </span>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="7XX XXX XXX"
                            disabled={step === 'processing'}
                            className="flex-1 rounded-r-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        You will receive a payment prompt on your phone
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={step === 'processing' || !phoneNumber}
                    className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {step === 'processing' ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        `Pay UGX ${plan ? Number(plan.price).toLocaleString() : '---'}`
                    )}
                </button>
            </form>

            {step === 'processing' && (
                <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-500/10">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Check your phone for the {provider} payment prompt and enter your PIN to complete payment.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MobileMoneyPaymentPage;
