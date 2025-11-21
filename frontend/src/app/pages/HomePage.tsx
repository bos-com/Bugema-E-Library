import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getBooks, getCategories } from '../../lib/api/catalog';
import StatCard from '../../components/cards/StatCard';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';

const HomePage = () => {
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  // Handle both array (if pagination disabled) and paginated response
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.results ?? [];
  console.log('HomePage rendering, categories:', categories, 'isArray:', Array.isArray(categories));
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'featured'],
    queryFn: () => getBooks({ ordering: '-view_count', page: 1 }),
  });

  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-300">Bugema Digital Library</p>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            Seamless reading with resilient authentication.
          </h1>
          <p className="text-lg text-slate-300">
            Enjoy automatic token rotation, admin observability, and a polished interface wired directly to the
            high-performance Django backend.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/catalog" className="btn-primary">
              Browse Library
            </Link>
            <Link to="/dashboard" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white">
              My Dashboard
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Categories" value={categories?.length ?? 0} hint="Curated subjects" />
            <StatCard label="Featured books" value={books?.results.length ?? 0} hint="Updated hourly" />
          </div>
        </div>
        <div className="card border-white/10 bg-gradient-to-br from-brand-500/10 to-slate-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">Latest arrivals</h2>
          {isLoading && <LoadingOverlay label="Loading featured books" />}
          <div className="mt-4 space-y-4">
            {books?.results?.slice(0, 4).map((book) => (
              <Link
                to={`/catalog/${book.id}`}
                key={book.id}
                className="flex items-start justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div>
                  <p className="font-semibold text-white">{book.title}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{book.author}</p>
                </div>
                <span className="text-xs text-slate-400">{book.language}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Browse by category</h2>
          <Link to="/catalog" className="text-sm text-slate-400">
            View all →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(categories) ? categories.map((category) => (
            <div key={category.id} className="card border-white/5 p-5">
              <p className="text-sm uppercase tracking-wide text-brand-200">{category.name}</p>
              <p className="mt-2 text-xs text-slate-400">{category.description ?? 'No description provided.'}</p>
              <p className="mt-4 text-xs text-slate-500">{category.book_count ?? 0} books</p>
            </div>
          )) : null}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
