import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { register as registerUser } from '../../lib/api/auth';
import { useAuthStore } from '../../lib/store/auth';

const schema = z
  .object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    password_confirm: z.string().min(8),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: 'Passwords must match',
    path: ['password_confirm'],
  });

type FormValues = z.infer<typeof schema>;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setSession({ user: data.user, accessToken: data.tokens.access, refreshToken: data.tokens.refresh });
      toast.success('Account created');
      navigate('/');
    },
    onError: () => toast.error('Registration failed'),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-slate-400">Get instant access to the entire library.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-500">Full name</label>
          <input
            {...register('name')}
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs text-slate-500">Email</label>
          <input
            type="email"
            {...register('email')}
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                disabled={mutation.isPending}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
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
            <label className="text-xs text-slate-500">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('password_confirm')}
                disabled={mutation.isPending}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[18px] text-slate-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="text-xs text-red-400">{errors.password_confirm.message}</p>
            )}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
