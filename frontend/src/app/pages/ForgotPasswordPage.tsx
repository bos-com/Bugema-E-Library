import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { requestPasswordReset } from '../../lib/api/auth';

const schema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

const ForgotPasswordPage = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = handleSubmit(async (values) => {
        setIsLoading(true);
        try {
            await requestPasswordReset(values.email);
            setIsSubmitted(true);
            toast.success('Check your email for the reset code');

            // Navigate to reset code page after 2 seconds
            setTimeout(() => {
                navigate('/reset-code', { state: { email: values.email } });
            }, 2000);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to send reset code. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    });

    if (isSubmitted) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Check your email</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        We've sent a verification code to <span className="font-semibold">{getValues('email')}</span>
                    </p>
                </div>
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Please check your email and enter the 6-digit code to reset your password.
                        <span className="text-amber-600 dark:text-amber-400 font-medium"> The code expires in 2 minutes.</span>
                    </p>
                </div>
                <Link
                    to="/login"
                    className="block text-center text-sm font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                >
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Forgot Password?</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enter your email address and we'll send you a code to reset your password.
                </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Email
                    </label>
                    <input
                        type="email"
                        {...register('email')}
                        placeholder="your.email@bugema.ac.ug"
                        disabled={isLoading}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
                    />
                    {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                </div>
                <button type="submit" className="btn-primary w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
            </form>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Remember your password?{' '}
                <Link
                    to="/login"
                    className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
};

export default ForgotPasswordPage;
