import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { createBook, deleteBook, getBooks } from '../../../lib/api/catalog';
import LoadingOverlay from '../../../components/feedback/LoadingOverlay';
import BookForm from '../../../components/forms/BookForm';

const AdminBooksPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-books', searchQuery],
    queryFn: () => getBooks({ page: 1, ordering: '-created_at', query: searchQuery }),
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createBook(formData),
    onSuccess: () => {
      toast.success('Book saved');
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: () => toast.error('Failed to save book'),
  });

  const deleteMutation = useMutation({
    mutationFn: (bookId: number) => deleteBook(bookId),
    onSuccess: () => {
      toast.success('Book deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: () => toast.error('Failed to delete book'),
  });

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manage books</h1>
          </div>

          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search books by title, author, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          {isLoading ? (
            <LoadingOverlay label="Loading books" />
          ) : (
            <div className="mt-6 space-y-4">
              {data?.results.map((book) => (
                <div key={book.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-200">{book.author}</p>
                      <h3 className="text-lg font-semibold text-white">{book.title}</h3>
                      <p className="text-xs text-slate-500">{book.is_published ? 'Published' : 'Draft'}</p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(book.id)}
                      className="text-xs text-red-400"
                      disabled={deleteMutation.isLoading}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{book.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white">Create / update</h2>
          <p className="text-xs text-slate-500">Uploads are streamed via Cloudinary-backed API.</p>
          <div className="mt-4">
            <BookForm onSubmit={(formData) => createMutation.mutate(formData)} isLoading={createMutation.isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBooksPage;
