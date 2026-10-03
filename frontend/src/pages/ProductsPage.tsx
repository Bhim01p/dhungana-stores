import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import type { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useDebounce } from '../hooks/useDebounce';
import { getCategoryIcon } from '../utils/categoryIcons';

const LIMIT = 12;

type SortKey = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

function CategoryThumbnail({ category, compact = false }: { category: Category; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [category.imageUrl]);
  const size = compact ? "h-8 w-8" : "h-10 w-10";
  return (
    <span className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-xl`} aria-hidden="true">
      {category.imageUrl && !failed
        ? <img src={category.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : getCategoryIcon(category.slug, category.name)}
    </span>
  );
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
  return [...products].sort((a, b) => {
    switch (sort) {
      case 'name_asc':  return a.name.localeCompare(b.name);
      case 'name_desc': return b.name.localeCompare(a.name);
      case 'price_asc': return Number(a.price) - Number(b.price);
      case 'price_desc':return Number(b.price) - Number(a.price);
      default:          return 0;
    }
  });
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state
  const categorySlug = searchParams.get('category') ?? undefined;
  const featured     = searchParams.get('featured') === 'true' ? true : undefined;
  const urlSearch    = searchParams.get('search') ?? '';
  const page         = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  // Local state
  const [searchInput, setSearchInput]   = useState(urlSearch);
  const [sort, setSort]                 = useState<SortKey>('name_asc');
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Debounce the text input before firing API
  const debouncedSearch = useDebounce(searchInput, 400);

  // When debounced value changes, reset to page 1 and push to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      next.set('search', debouncedSearch);
    } else {
      next.delete('search');
    }
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Sync input box if URL changes externally (e.g. Navbar search)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        productsApi.getAll({
          active: true,
          categorySlug,
          featured,
          search: debouncedSearch || undefined,
          page,
          limit: LIMIT,
        }),
        categoriesApi.getAll({ active: true }),
      ]);
      setProducts(prodsRes.data);
      setTotal(prodsRes.meta.total);
      setTotalPages(prodsRes.meta.totalPages);
      setCategories(catsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [categorySlug, featured, debouncedSearch, page]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  // ── URL helpers ───────────────────────────────────────
  function setCategory(slug: string | undefined) {
    const next = new URLSearchParams(searchParams);
    slug ? next.set('category', slug) : next.delete('category');
    next.delete('page');
    setSearchParams(next);
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(searchParams);
    p > 1 ? next.set('page', String(p)) : next.delete('page');
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Sort is client-side (avoids extra API call)
  const displayProducts = sortProducts(products, sort);
  const selectedCategory = categories.find((category) => category.slug === categorySlug);
  const selectedRoot = selectedCategory?.parentId
    ? categories.find((category) => category.id === selectedCategory.parentId)
    : selectedCategory;
  const rootCategories = categories.filter((category) => !category.parentId);
  // ── Pagination helpers ────────────────────────────────
  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    if (page > 3) pages.push('…');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

        {/* ── Sidebar ───────────────────────────────── */}
        <aside className="w-full shrink-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:h-fit lg:w-60">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Shop by category</h2>
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            <button
              onClick={() => setCategory(undefined)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-semibold transition-colors lg:w-full lg:rounded-xl ${
                !categorySlug ? 'border-brand-100 bg-brand-50 text-brand-700' : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xl" aria-hidden="true">🧺</span>
              <span>All Products</span>
            </button>

            {rootCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-semibold transition-colors lg:w-full lg:rounded-xl ${
                  selectedRoot?.id === cat.id
                    ? 'border-brand-100 bg-brand-50 text-brand-700'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <CategoryThumbnail category={cat} />
                <span className="truncate flex-1">{cat.name}</span>
              </button>
            ))}
          </nav>
          {(selectedRoot?.children?.length ?? 0) > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{selectedRoot?.name}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                <button
                  onClick={() => setCategory(selectedRoot?.slug)}
                  className={`shrink-0 rounded-full px-3 py-2 text-left text-xs font-semibold transition-colors lg:w-full lg:rounded-lg ${categorySlug === selectedRoot?.slug ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
                >All {selectedRoot?.name}</button>
                {selectedRoot?.children?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setCategory(child.slug)}
                    className={`shrink-0 rounded-full px-3 py-2 text-left text-xs font-semibold transition-colors lg:w-full lg:rounded-lg ${categorySlug === child.slug ? 'bg-brand-50 text-brand-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
                  ><span className="flex items-center gap-2"><CategoryThumbnail category={child} compact /><span>{child.name}</span></span></button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ─────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                {categorySlug
                  ? categories.find((c) => c.slug === categorySlug)?.name ?? 'Products'
                  : featured
                    ? 'Featured Products'
                    : 'All Products'}
              </h1>
              {!loading && (
                <p className="mt-1 text-sm text-stone-500">
                  {total} {total === 1 ? 'item' : 'items'} found
                  {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
                </p>
              )}
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
              {/* Search input */}
              <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  aria-label="Search products"
                />
              </div>

              {/* Sort dropdown */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-[7.5rem] shrink-0 cursor-pointer rounded-xl border border-stone-200 bg-white px-2.5 py-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 sm:w-auto sm:text-sm"
                aria-label="Sort products"
              >
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="price_asc">Price Low–High</option>
                <option value="price_desc">Price High–Low</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {(categorySlug || featured || debouncedSearch) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categorySlug && (
                <button
                  onClick={() => setCategory(undefined)}
                  className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                >
                  {getCategoryIcon(categorySlug)} {categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug}
                  <span className="text-brand-400 font-bold ml-0.5">×</span>
                </button>
              )}
              {featured && (
                <button
                  onClick={() => { const n = new URLSearchParams(searchParams); n.delete('featured'); setSearchParams(n); }}
                  className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-yellow-100 transition-colors"
                >
                  ⭐ Featured <span className="font-bold ml-0.5">×</span>
                </button>
              )}
              {debouncedSearch && (
                <button
                  onClick={() => setSearchInput('')}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  🔍 "{debouncedSearch}" <span className="font-bold ml-0.5">×</span>
                </button>
              )}
            </div>
          )}

          {/* Product grid */}
          {loading ? (
            <LoadingSpinner message="Loading products..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <span className="text-5xl">🔍</span>
              <p className="text-gray-500 font-medium">No products found.</p>
              {(categorySlug || debouncedSearch) && (
                <button
                  onClick={() => { setSearchInput(''); setCategory(undefined); }}
                  className="btn-secondary text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                ‹ Prev
              </button>

              {pageNumbers().map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                      page === p
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    aria-label={`Page ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
