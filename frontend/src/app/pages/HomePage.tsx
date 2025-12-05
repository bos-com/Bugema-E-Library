import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getBooks, getCategories } from '../../lib/api/catalog';
import StatCard from '../../components/cards/StatCard';
import LoadingOverlay from '../../components/feedback/LoadingOverlay';

const HomePage = () => {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
  // Handle both array (if pagination disabled) and paginated response
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.results ?? [];
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'featured'],
    queryFn: () => getBooks({ ordering: '-view_count', page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-16 animate-in">
      {/* Hero Section */}
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-white/70">

          </p>
          <h1 className="text-5xl font-bold leading-tight text-slate-900 dark:text-white md:text-6xl">
            Your Gateway to{' '}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
              Bugema University&apos;s Digital Library
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-600 dark:text-white/70">
            Access course books, research materials, and recommended readings from Bugema University in one
            convenient online library. Designed to support students, staff, and researchers on and off campus,
            in the spirit of Bugema University &ndash; Excellence in Service.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/catalog" className="btn-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Library
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              My Dashboard
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <StatCard
              variant="blue"
              label="Categories"
              value={categories?.length ?? 0}
              hint="Curated academic courses"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
            <StatCard
              variant="emerald"
              label="Featured"
              value={books?.results.length ?? 0}
              hint="Most accessed titles"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Latest Arrivals Card */}
        <div className="card-gradient">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Latest Arrivals</h2>
            <span className="badge badge-violet">New</span>
          </div>
          {isLoading && <LoadingOverlay label="Loading featured books" />}
          <div className="space-y-3">
            {books?.results?.slice(0, 4).map((book) => (
              <Link
                to={`/catalog/${book.id}`}
                key={book.id}
                className="group flex items-start justify-between rounded-xl border border-slate-200 bg-white/60 p-4 transition-all duration-300 hover:border-brand-400 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-slate-800/60 dark:hover:bg-slate-800"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {book.title}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    {book.author}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{book.language}</span>
                  <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Browse by Category</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Explore Bugema University courses and collections
            </p>
          </div>
          <Link
            to="/catalog"
            className="group flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            View all
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(categories) ? categories.map((category) => (
            <Link
              key={category.id}
              to={`/catalog?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`}
              className="group card block hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {category.name}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {category.description ?? 'Browse books and resources available in this Bugema University course area.'}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="badge badge-blue">{category.book_count ?? 0} books</span>
                    <span className="text-xs font-semibold text-brand-600 group-hover:underline dark:text-brand-400">
                      View books
                    </span>
                  </div>
                </div>
                <svg className="h-6 w-6 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-brand-500 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )) : null}
        </div>
      </section>
    </div>
  );
};

export default HomePage;

