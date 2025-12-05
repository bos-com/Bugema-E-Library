import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createCategory, getCategories } from '../../../lib/api/catalog';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import CategoryForm from '../../../components/forms/CategoryForm';

const AdminCategoriesPage = () => {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => toast.error('Failed to create category'),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
        {isPending ? (
          <LoadingOverlay label="Loading categories" />
        ) : (
          <div className="mt-6 space-y-3">
            {(Array.isArray(data) ? data : data?.results)?.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{category.name}</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{category.description ?? 'No description provided'}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{category.book_count ?? 0} books</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white">Add category</h2>
        <p className="text-xs text-slate-500">Manage your library's course categories.</p>
        <div className="mt-4">
          <CategoryForm onSubmit={(values) => mutation.mutate(values)} isLoading={mutation.isPending} />
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
