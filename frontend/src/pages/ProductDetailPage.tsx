import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productsApi } from "../api/products";
import type { Product } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getCategoryIcon } from "../utils/categoryIcons";
import { useCart } from "../contexts/CartContext";
import ProductImage from "../components/ProductImage";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setError(null);
    productsApi.getOne(slug).then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Product not found."))
      .finally(() => setLoading(false));
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

  const handleAddToCart = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-500">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category.slug}`} className="hover:text-brand-500">{product.category.name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
          <ProductImage src={product.image} name={product.name} categoryName={product.category.name} categorySlug={product.category.slug} />
          {product.featured && (
            <div className="absolute top-4 left-4">
              <span className="badge bg-brand-500 text-white px-3 py-1 text-xs shadow">⭐ Featured</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <Link to={`/products?category=${product.category.slug}`}
            className="inline-flex items-center gap-1.5 self-start bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors">
            <span>{categoryIcon}</span><span>{product.category.parent ? `${product.category.parent.name} › ${product.category.name}` : product.category.name}</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

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
              ? <span className="badge badge-red px-3 py-1.5 text-sm">✗ Out of stock</span>
              : isLowStock
                ? <><span className="badge badge-yellow px-3 py-1.5 text-sm">⚠ Low stock</span><span className="text-sm text-gray-500">Only {product.stockQuantity} left</span></>
                : <><span className="badge badge-green px-3 py-1.5 text-sm">✓ In stock</span><span className="text-sm text-gray-500">{product.stockQuantity} available</span></>
            }
          </div>

          {product.description && (
            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
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
                Out of Stock
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

      <div className="mt-10 pt-6 border-t border-gray-100">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">← Back</button>
      </div>
    </div>
  );
}
