import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const schema = z
    .object({
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type FormValues = z.infer<typeof schema>;

const NewPasswordPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as { email?: string })?.email || '';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = handleSubmit((values) => {
        // Frontend only - simulate API call
        console.log('Resetting password for:', email, 'New password:', values.password);
        toast.success('Password reset successfully!');

        // Navigate to login page
        setTimeout(() => {
            navigate('/login');
        }, 1000);
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Set New Password</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enter your new password below.
                </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            placeholder="Enter new password"
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[18px] text-slate-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                </div>
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...register('confirmPassword')}
                            placeholder="Confirm new password"
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-[18px] text-slate-400 hover:text-white"
                        >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                </div>
                <button type="submit" className="btn-primary w-full">
                    Reset Password
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

export default NewPasswordPage;
