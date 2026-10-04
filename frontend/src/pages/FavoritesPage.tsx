import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useFavorites } from "../contexts/FavoritesContext";
import { useLanguage } from "../i18n/LanguageContext";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { productsApi } from "../api/products";
import type { Product } from "../types";

export default function FavoritesPage() {
  const { favorites, isSyncing, isReady } = useFavorites();
  const { customerToken } = useCustomerAuth();
  const { t } = useLanguage();
  const [visibleFavorites, setVisibleFavorites] = useState<Product[]>(favorites);
  const favoriteIds = favorites.map((product) => product.id).join(",");
  useEffect(() => {
    setVisibleFavorites(favorites);
    if (!customerToken && favorites.length) {
      let cancelled = false;
      productsApi.getByIds(favorites.map((product) => product.id))
        .then((result) => { if (!cancelled) setVisibleFavorites(result.data); })
        .catch(() => { /* Keep cached items visible while offline. */ });
      return () => { cancelled = true; };
    }
    return undefined;
  // IDs are the relevant changes; card state does not need to refetch for price display.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIds, customerToken]);
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-6 flex items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-brand-600">♥ {t("Favorites")}</p><h1 className="mt-1 text-2xl font-extrabold text-stone-900">{t("Saved favorites")}</h1></div>
      {isSyncing && <span className="text-xs text-stone-500" role="status">Syncing…</span>}
    </div>
    {customerToken && !isReady ? <div role="status" className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center text-sm text-stone-500">Loading your saved favorites…</div>
      : visibleFavorites.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{visibleFavorites.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      : <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center">
        <p className="text-lg font-semibold text-stone-800">{t("No favorites saved yet.")}</p>
        <p className="mt-2 text-sm text-stone-500">{t("Save items with the heart button while shopping.")}</p>
        <Link to="/products" className="btn-primary mt-5 inline-flex">{t("Shop")}</Link>
      </div>}
  </section>;
}
