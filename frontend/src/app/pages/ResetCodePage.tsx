import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const schema = z.object({
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

type FormValues = z.infer<typeof schema>;

const ResetCodePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as { email?: string })?.email || 'your email';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = handleSubmit((values) => {
        // Frontend only - simulate API call
        console.log('Verifying code:', values.code);
        toast.success('Code verified successfully');

        // Navigate to new password page
        setTimeout(() => {
            navigate('/new-password', { state: { email, code: values.code } });
        }, 500);
    });

    const handleResendCode = () => {
        toast.success('New code sent to your email');
        console.log('Resending code to:', email);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Enter Verification Code</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    We sent a 6-digit code to <span className="font-semibold">{email}</span>
                </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        {...register('code')}
                        placeholder="000000"
                        maxLength={6}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-2xl font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
                    />
                    {errors.code && <p className="text-xs text-red-400">{errors.code.message}</p>}
                </div>
                <button type="submit" className="btn-primary w-full">
                    Verify Code
                </button>
            </form>
            <div className="space-y-2 text-center text-sm">
                <button
                    type="button"
                    onClick={handleResendCode}
                    className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                >
                    Resend Code
                </button>
                <p className="text-slate-600 dark:text-slate-400">
                    or{' '}
                    <Link
                        to="/login"
                        className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetCodePage;
