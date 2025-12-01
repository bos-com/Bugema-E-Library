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
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'featured'],
    queryFn: () => getBooks({ ordering: '-view_count', page: 1 }),
  });

  return (
    <div className="space-y-16 animate-in">
      {/* Hero Section */}
      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-block">
            <span className="rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              Bugema Digital Library
            </span>
          </div>
          <h1 className="text-5xl font-bold leading-tight text-slate-900 dark:text-white md:text-6xl">
            Seamless Reading with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Experience automatic token rotation, comprehensive admin observability, and a beautifully crafted
            interface powered by a high-performance Django backend.
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
              hint="Curated subjects"
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
              hint="Popular books"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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
            <p className="mt-2 text-slate-600 dark:text-slate-400">Explore our curated collection</p>
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
            <div
              key={category.id}
              className="group card cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {category.name}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {category.description ?? 'Explore this collection of books.'}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="badge badge-blue">{category.book_count ?? 0} books</span>
                  </div>
                </div>
                <svg className="h-6 w-6 text-slate-300 transition-all group-hover:scale-110 group-hover:text-brand-500 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          )) : null}
        </div>
      </section>
    </div>
  );
};

export default HomePage;

