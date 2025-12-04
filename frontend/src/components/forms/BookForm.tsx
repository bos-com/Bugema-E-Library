import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BookPayload } from '../../lib/api/catalog';

const schema = z.object({
  title: z.string().min(2),
  author_name: z.string().min(2),
  description: z.string().min(10),
  isbn: z.string().min(5),
  language: z.string().default('English'),
  year: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
  pages: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
  file_type: z.enum(['PDF', 'EPUB', 'VIDEO']),
  is_published: z.boolean().default(true),
  tags: z.string().optional(),
  category_names: z.string().optional(),
  cover_image: z.any().optional(),
  file: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

interface BookFormProps {
  defaultValues?: Partial<BookPayload>;
  onSubmit: (values: FormData) => Promise<void> | void;
  isLoading?: boolean;
}

const BookForm = ({ defaultValues, onSubmit, isLoading }: BookFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      author_name: defaultValues?.author_name ?? '',
      description: defaultValues?.description ?? '',
      isbn: defaultValues?.isbn ?? '',
      language: defaultValues?.language ?? 'English',
      year: defaultValues?.year,
      pages: defaultValues?.pages,
      file_type: defaultValues?.file_type ?? 'PDF',
      is_published: defaultValues?.is_published ?? true,
      tags: Array.isArray(defaultValues?.tags) ? defaultValues.tags.join(', ') : (defaultValues?.tags as unknown as string) || '',
      category_names: Array.isArray(defaultValues?.category_names) ? defaultValues.category_names.join(', ') : (defaultValues?.category_names as unknown as string) || '',
    },
  });

  const submitHandler = handleSubmit(async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (key === 'tags') {
        if (typeof value === 'string') {
          const tagsArray = value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
          formData.append('tags', JSON.stringify(tagsArray));
        }
      } else if (key === 'category_names') {
        if (typeof value === 'string') {
          value
            .split(',')
            .map((cat) => cat.trim())
            .filter(Boolean)
            .forEach((cat) => formData.append('category_names', cat));
        }
      } else if (key === 'cover_image' || key === 'file') {
        const fileList = value as FileList;
        if (fileList?.length) {
          formData.append(key, fileList[0]);
        }
      } else {
        formData.append(key, String(value));
      }
    });

    await onSubmit(formData);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Title</label>
          <input
            {...register('title')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Author</label>
          <input
            {...register('author_name')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
          {errors.author_name && <p className="text-xs text-red-400">{errors.author_name.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Description</label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">ISBN</label>
          <input
            {...register('isbn')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
          {errors.isbn && <p className="text-xs text-red-400">{errors.isbn.message}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Language</label>
          <input
            {...register('language')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Year</label>
          <input
            type="number"
            {...register('year')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Pages</label>
          <input
            type="number"
            {...register('pages')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">File Type</label>
          <select
            {...register('file_type')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          >
            <option value="PDF">PDF</option>
            <option value="EPUB">EPUB</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-400">
          <input type="checkbox" {...register('is_published')} className="h-4 w-4" />
          Published
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
            Tags (comma separated)
          </label>
          <input
            {...register('tags')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
            Categories (comma separated)
          </label>
          <input
            {...register('category_names')}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Cover Image</label>
          <input
            type="file"
            accept="image/*"
            {...register('cover_image')}
            className="mt-2 block w-full text-sm text-slate-600 dark:text-slate-200"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Book File</label>
          <input
            type="file"
            accept={watch('file_type') === 'VIDEO' ? 'video/*' : '.pdf,.epub'}
            {...register('file')}
            className="mt-2 block w-full text-sm text-slate-600 dark:text-slate-200"
          />
        </div>
      </div>

      <button type="submit" className="btn-primary text-sm" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save Book'}
      </button>
    </form>
  );
};

export default BookForm;
