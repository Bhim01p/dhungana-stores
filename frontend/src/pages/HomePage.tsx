import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productsApi } from "../api/products";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ActiveOrdersBanner from "../components/ActiveOrdersBanner";
import { useLanguage } from "../i18n/LanguageContext";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";

export default function HomePage() {
  const { t } = useLanguage();
  const { customer } = useCustomerAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await productsApi.getAll({ active: true, limit: 12 });
        setProducts(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading store..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-10 pb-12 sm:space-y-12">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-xl">
            <p className="text-brand-200 text-sm font-semibold uppercase tracking-widest mb-3">
              {t("Your neighbourhood kirana store")}
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Bishnu &amp; Dhungana<br />
              <span className="text-brand-200">Stores</span>
            </h1>
            <p className="text-brand-100 text-lg mb-8 leading-relaxed">
              {t("Everyday groceries and household essentials for your home.")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow"
              >
                🛍️ {t("Shop Now")}
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                📦 {t("Track Orders")}
              </Link>
              {!customer && <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                👤 {t("Login")}
              </Link>}
            </div>
          </div>
        </div>
      </section>

      <ActiveOrdersBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ── Products grid ── */}
        {products.length > 0 && (
          <section className="rounded-[1.75rem] border border-stone-200/70 bg-stone-50/70 p-4 sm:p-6 lg:p-8">
            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">{t("From our shelves")}</p>
                <h2 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">{t("Everyday groceries")}</h2>
                <p className="mt-1 text-sm font-medium text-stone-600">{t("Browse the products available in our store.")}</p>
              </div>
              <Link
                to="/products"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 sm:px-4 sm:text-sm"
              >
                {t("View all")} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {products.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <span className="text-6xl">🏪</span>
            <p className="text-gray-600 text-lg font-semibold">{t("No products available right now")}</p>
            <p className="text-gray-500 text-sm">{t("Please check back soon.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
