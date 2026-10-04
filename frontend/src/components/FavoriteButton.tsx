import type { Product } from "../types";
import { useFavorites } from "../contexts/FavoritesContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function FavoriteButton({ product, className = "" }: { product: Product; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const saved = isFavorite(product.id);
  return <button type="button" onClick={() => toggleFavorite(product)} aria-pressed={saved}
    aria-label={`${t(saved ? "Remove from favorites" : "Save to favorites")}: ${t(product.name)}`}
    title={saved ? t("Remove from favorites") : t("Save to favorites")}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-xl shadow-sm transition hover:scale-105 hover:border-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${className}`}>
    <span className={saved ? "text-rose-600" : "text-stone-500"} aria-hidden="true">{saved ? "♥" : "♡"}</span>
  </button>;
}
