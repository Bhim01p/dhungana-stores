import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import type { Category } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getCategoryIcon } from '../utils/categoryIcons';
import { useLanguage } from '../i18n/LanguageContext';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi
      .getAll({ active: true })
      .then((res) => setCategories(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load categories.')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading categories..." />;
  if (error)   return <ErrorMessage message={error} />;

  const rootCategories = categories.filter((category) => !category.parentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-brand-500 transition-colors">{t("Home")}</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{t("Categories")}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{t("Shop by category")}</h1>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <span className="text-5xl">🛍️</span>
          <p className="text-gray-500">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
          {rootCategories.map((cat) => {
            const icon = getCategoryIcon(cat.slug, cat.name);
            return (
              <article key={cat.id} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                <Link to={`/products?category=${cat.slug}`} className="flex items-start gap-4 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl transition-colors group-hover:bg-brand-100">{icon}</div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-extrabold text-gray-900 transition-colors group-hover:text-brand-700">{t(cat.name)}</h2>
                    {cat.description && <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-600">{t(cat.description)}</p>}
                  </div>
                </Link>
                {(cat.children ?? []).length > 0 && (
                  <div className="border-t border-stone-100 px-5 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">{t("Shop in this category")}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.children!.map((child) => (
                        <Link key={child.id} to={`/products?category=${child.slug}`} className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                          {t(child.name)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
