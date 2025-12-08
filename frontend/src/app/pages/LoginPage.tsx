import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../../lib/api/auth';
import { useAuthStore } from '../../lib/store/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession({
        user: data.user,
        accessToken: data.tokens.access,
        refreshToken: data.tokens.refresh,
      });
      toast.success('Welcome back!');
      const redirect = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(redirect, { replace: true });
    },
    onError: () => toast.error('Invalid credentials'),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Sign in</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Welcome back! Please enter your details.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Email
          </label>
          <input
            type="text"
            {...register('email')}
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
            placeholder="user@gmail.com"
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              disabled={mutation.isPending}
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
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2 text-slate-500 dark:bg-slate-950">Or</span>
        </div>
      </div>

      <div className="text-center">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">External Users / Visitors</p>
        <Link
          to="/visitor-access"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          Visitor Access
        </Link>
      </div>

      <div className="flex flex-col gap-2 text-center text-sm text-slate-600 dark:text-slate-400">
        <p>
          No account?{' '}
          <Link
            to="/register"
            className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Register (Students/Staff)
          </Link>
        </p>
        <p>
          <Link
            to="/forgot-password"
            className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
