import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryFormProps {
  onSubmit: (values: FormValues) => Promise<void> | void;
  isLoading?: boolean;
}

const CategoryForm = ({ onSubmit, isLoading }: CategoryFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-400">Name</label>
        <input
          {...register('name')}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          placeholder="e.g. Computer Science"
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-400">Description</label>
        <textarea
          {...register('description')}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          rows={3}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
        )}
      </div>
      <button type="submit" className="btn-primary text-sm" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Add Category'}
      </button>
    </form>
  );
};

export default CategoryForm;
