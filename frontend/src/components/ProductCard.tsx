import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import ProductImage from "./ProductImage";
import FavoriteButton from "./FavoriteButton";
import { useLanguage } from "../i18n/LanguageContext";

interface Props { product: Product; }

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [added, setAdded] = useState(false);
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;
  const isOutOfStock = product.stockQuantity === 0;

  const handleQuickAdd = () => {
    if (isOutOfStock) return;
    addItem(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg">
      <div className="relative">
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        aria-label={`${t("View")} ${t(product.name)}`}
      >
        <div className="aspect-[4/3] sm:aspect-square">
          <ProductImage
            src={product.image}
            name={t(product.name)}
            categoryName={t(product.category.name)}
            categorySlug={product.category.slug}
          />
        </div>
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 shadow-sm ring-1 ring-black/5">
            {t("Popular")}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-stone-900/85 px-2.5 py-1 text-[10px] font-semibold text-white">
            {t("Currently unavailable")}
          </span>
        )}
      </Link>
      <FavoriteButton product={product} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-1.5 truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700">
          {product.category.parent ? `${t(product.category.parent.name)} · ${t(product.category.name)}` : t(product.category.name)}
        </p>
        <Link to={`/products/${product.slug}`} className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-stone-900 transition-colors group-hover:text-brand-700 sm:text-[15px]">
            {t(product.name)}
          </h3>
        </Link>
        <p className="mt-1 min-h-4 truncate text-xs text-stone-500">{product.brand || t("Everyday grocery")}</p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-stone-900 sm:text-lg">
              NPR {Number(product.price).toLocaleString("en-NP")}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-600">{t("per")} {t(product.unit)}</p>
          </div>
          {isLowStock ? (
              <span className="mb-0.5 shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800 ring-1 ring-amber-200">{t("Few left")}</span>
          ) : !isOutOfStock ? (
            <span className="mb-0.5 inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("Available")}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
            added
              ? "bg-emerald-600 text-white"
              : isOutOfStock
                ? "cursor-not-allowed bg-stone-100 text-stone-400"
                : "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800"
          }`}
        >
          <span aria-hidden="true">{added ? "✓" : "+"}</span>
          {added ? t("Added to cart") : isOutOfStock ? t("Out of stock") : t("Add to Cart")}
        </button>
      </div>
    </article>
  );
}
