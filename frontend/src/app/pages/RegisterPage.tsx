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
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(8, 'Password must be at least 8 characters'),
    registration_number: z.string().optional(),
    staff_id: z.string().optional(),
    account_type: z.enum(['STUDENT', 'STAFF']),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: 'Passwords must match',
    path: ['password_confirm'],
  })
  .refine(
    (values) => {
      if (values.account_type === 'STUDENT' && !values.registration_number) return false;
      if (values.account_type === 'STAFF' && !values.staff_id) return false;
      return true;
    },
    {
      message: 'ID Number is required',
      path: ['registration_number'], // Highlight this field generally
    }
  );

type FormValues = z.infer<typeof schema>;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Default to STUDENT
  const [accountType, setAccountType] = useState<'STUDENT' | 'STAFF'>('STUDENT');

  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      account_type: 'STUDENT'
    }
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Registration failed';
      toast.error(msg);
    },
  });

  const onSubmit = handleSubmit((values) => {
    // Clear the unused ID field to be clean
    if (values.account_type === 'STUDENT') values.staff_id = '';
    if (values.account_type === 'STAFF') values.registration_number = '';
    mutation.mutate(values);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Join Bugema E-Library as Student or Staff.</p>
      </div>

      {/* Account Type Toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        <button
          type="button"
          onClick={() => {
            setAccountType('STUDENT');
            setValue('account_type', 'STUDENT');
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${accountType === 'STUDENT'
            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => {
            setAccountType('STAFF');
            setValue('account_type', 'STAFF');
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${accountType === 'STAFF'
            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
        >
          Staff Member
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full name</label>
          <input
            {...register('name')}
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
            placeholder="John Doe"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        {/* Dynamic ID Field */}
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {accountType === 'STUDENT' ? 'Registration Number' : 'Staff ID Number'}
          </label>
          <input
            {...register(accountType === 'STUDENT' ? 'registration_number' : 'staff_id')}
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
            placeholder={accountType === 'STUDENT' ? '22/BSE/BU/R/0000' : 'STF/BU/000'}
          />
          {/* Show error for either field if it exists */}
          {(errors.registration_number || errors.staff_id) && (
            <p className="text-xs text-red-400">
              {errors.registration_number?.message || errors.staff_id?.message || "ID Number is required"}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email</label>
          <input
            type="email"
            {...register('email')}
            disabled={mutation.isPending}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-50"
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
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
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('password_confirm')}
                disabled={mutation.isPending}
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
            {errors.password_confirm && (
              <p className="text-xs text-red-400">{errors.password_confirm.message}</p>
            )}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <div className="flex flex-col gap-2 text-center text-sm text-slate-600 dark:text-slate-400">
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Sign in
          </Link>
        </p>
        <p>
          Are you a Visitor?{' '}
          <Link
            to="/visitor-access"
            className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Go to Visitor Access
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
