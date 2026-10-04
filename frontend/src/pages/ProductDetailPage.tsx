import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productsApi } from "../api/products";
import type { Product } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getCategoryIcon } from "../utils/categoryIcons";
import { useCart } from "../contexts/CartContext";
import ProductImage from "../components/ProductImage";
import ProductCard from "../components/ProductCard";
import FavoriteButton from "../components/FavoriteButton";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setError(null);
    let cancelled = false;
    productsApi.getOne(slug).then((loadedProduct) => { if (!cancelled) { setProduct(loadedProduct); setSelectedPhoto(0); } })
      .catch((err) => setError(err instanceof Error ? err.message : "Product not found."))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingSpinner message="Loading product..." />;
  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ErrorMessage message={error ?? "Product not found."} />
        <button onClick={() => navigate(-1)} className="btn-secondary">← Go back</button>
      </div>
    );
  }

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;
  const isOutOfStock = product.stockQuantity === 0;
  const cartItem = items.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const categoryIcon = getCategoryIcon(product.category.slug, product.category.name);
  const productPhotos = (product.images?.length ? product.images : product.image ? [product.image] : []).slice(0, 8);
  const mainPhoto = productPhotos[selectedPhoto] ?? product.image;

  const handleAddToCart = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-500">{t("Home")}</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-500">{t("Products")}</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category.slug}`} className="hover:text-brand-500">{t(product.category.name)}</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-[200px]">{t(product.name)}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 shadow-sm">
            <ProductImage src={mainPhoto} name={t(product.name)} categoryName={t(product.category.name)} categorySlug={product.category.slug} />
            {product.featured && (
              <div className="absolute left-4 top-4">
                <span className="badge bg-brand-500 px-3 py-1 text-xs text-white shadow">⭐ Featured</span>
              </div>
            )}
          </div>
          {productPhotos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="Product photos">
              {productPhotos.map((photo, index) => (
                <button key={`${photo}-${index}`} type="button" onClick={() => setSelectedPhoto(index)} aria-label={`Show product photo ${index + 1}`} aria-pressed={selectedPhoto === index}
                  className={`aspect-square overflow-hidden rounded-lg border-2 bg-white ${selectedPhoto === index ? "border-brand-600" : "border-gray-200 hover:border-brand-300"}`}>
                  <ProductImage src={photo} name={`${t(product.name)} photo ${index + 1}`} categoryName={t(product.category.name)} categorySlug={product.category.slug} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <Link to={`/products?category=${product.category.slug}`}
            className="inline-flex items-center gap-1.5 self-start bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors">
            <span>{categoryIcon}</span><span>{product.category.parent ? `${t(product.category.parent.name)} › ${t(product.category.name)}` : t(product.category.name)}</span>
          </Link>

          <div className="flex items-start justify-between gap-3"><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{t(product.name)}</h1><FavoriteButton product={product} /></div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {product.brand && <span><span className="text-gray-400">Brand:</span> <span className="font-medium text-gray-700">{product.brand}</span></span>}
            {product.sku && <span><span className="text-gray-400">SKU:</span> <span className="font-mono text-gray-700">{product.sku}</span></span>}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-3xl font-extrabold text-brand-600">
              NPR {Number(product.price).toLocaleString("en-NP")}
              <span className="text-base font-medium text-gray-400 ml-1">/ {product.unit}</span>
            </p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-3">
            {isOutOfStock
              ? <span className="badge badge-red px-3 py-1.5 text-sm">✗ {t("Out of stock")}</span>
              : isLowStock
                ? <><span className="badge badge-yellow px-3 py-1.5 text-sm">⚠ {t("Low stock")}</span><span className="text-sm text-gray-500">{t("Only")} {product.stockQuantity} {t("left")}</span></>
                : <><span className="badge badge-green px-3 py-1.5 text-sm">✓ {t("In stock")}</span><span className="text-sm text-gray-500">{product.stockQuantity} {t("available")}</span></>
            }
          </div>

          {product.description && (
            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">{t("Description")}</h2>
              <p className="text-gray-700 text-sm font-medium leading-relaxed">{t(product.description)}</p>
            </div>
          )}

          {/* Add to cart section */}
          <div className="border-t border-gray-100 pt-4 mt-auto space-y-3">
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Qty:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">−</button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stockQuantity, qty + 1))}
                    disabled={qty >= product.stockQuantity}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40">+</button>
                </div>
                {cartQty > 0 && (
                  <span className="text-xs text-brand-600 font-medium">{cartQty} already in cart</span>
                )}
              </div>
            )}

            {isOutOfStock ? (
              <button disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed">
                {t("Out of stock")}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className={`w-full py-3.5 text-base rounded-xl font-semibold transition-all ${
                  added
                    ? "bg-green-500 text-white"
                    : "btn-primary"
                }`}
              >
                {added ? "✓ Added to Cart!" : `Add to Cart — NPR ${(Number(product.price) * qty).toLocaleString("en-NP")}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {isOutOfStock && product.substitutes?.length ? (
        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-stone-900">{t("Try these available alternatives")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("This item is unavailable right now. Here are similar products in stock.")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{product.substitutes.map((alternative) => <ProductCard key={alternative.id} product={alternative} />)}</div>
        </section>
      ) : null}

      <div className="mt-10 pt-6 border-t border-gray-100">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">← Back</button>
      </div>
    </div>
  );
}
