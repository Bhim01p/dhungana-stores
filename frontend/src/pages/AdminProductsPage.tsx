import { useEffect, useState, useCallback } from "react";
import { adminProductsApi } from "../api/adminProducts";
import { adminCategoriesApi } from "../api/adminCategories";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Unit } from "../types";
import type { Product } from "../types";
import ProductImage from "../components/ProductImage";
import AdminImageUpload from "../components/AdminImageUpload";
import { useDebounce } from "../hooks/useDebounce";

const LIMIT = 10;

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("active");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [missingImageOnly, setMissingImageOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const [formData, setFormData] = useState({
    name: "", description: "", categoryId: "", brand: "", sku: "",
    price: "", unit: "kg" as Unit, stockQuantity: 0, lowStockThreshold: 10, supplierName: "", expiresAt: "",
    images: [] as string[], active: true, featured: false,
  });

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await adminProductsApi.getAll(token, {
        page, limit: LIMIT,
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        active: activeFilter === "all" ? undefined : activeFilter === "active",
        lowStock: lowStockOnly || undefined,
        missingImage: missingImageOnly || undefined,
      });
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [token, page, debouncedSearch, categoryId, activeFilter, lowStockOnly, missingImageOnly]);

  // Load categories once for the dropdown
  useEffect(() => {
    if (!token) return;
    adminCategoriesApi.getAll(token, { active: true, limit: 100 })
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, [token]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  const resetForm = () => {
    setFormData({
      name: "", description: "", categoryId: categories[0]?.id ?? "", brand: "", sku: "",
      price: "", unit: "kg", stockQuantity: 0, lowStockThreshold: 10, supplierName: "", expiresAt: "",
      images: [], active: true, featured: false,
    });
    setEditing(null); setShowForm(false);
  };

  const handleEdit = (product: any) => {
    setEditing(product);
    setFormData({
      name: product.name, description: product.description ?? "",
      categoryId: product.categoryId, brand: product.brand ?? "",
      sku: product.sku ?? "", price: product.price, unit: product.unit,
      stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold,
      supplierName: product.supplierName ?? "", expiresAt: product.expiresAt ? new Date(product.expiresAt).toISOString().slice(0, 10) : "",
      images: (Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : []).slice(0, 8),
      active: product.active, featured: product.featured,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!formData.categoryId) { setError("Please select a category."); return; }
    setError(null);
    try {
      if (editing) {
        const { stockQuantity: _inventoryHandledSeparately, ...productFields } = formData;
        await adminProductsApi.update(token, editing.id, productFields);
      } else {
        await adminProductsApi.create(token, {
          ...formData,
          price: formData.price,
          stockQuantity: Number(formData.stockQuantity),
          lowStockThreshold: Number(formData.lowStockThreshold),
        });
      }
      resetForm(); await fetchProducts();
    } catch (err: any) { setError(err.message); }
  };

  const handleToggleActive = async (product: Product) => {
    if (!token) return;
    const action = product.active ? "Deactivate" : "Activate";
    if (!confirm(`${action} ${product.name}?`)) return;
    try {
      if (product.active) await adminProductsApi.update(token, product.id, { active: false });
      else await adminProductsApi.update(token, product.id, { active: true });
      await fetchProducts();
    }
    catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (product: Product) => {
    if (!token || product.active) return;
    if (!confirm(`Permanently delete “${product.name}”? This cannot be undone. Past order bills keep the saved item name and price.`)) return;
    try {
      await adminProductsApi.delete(token, product.id);
      await fetchProducts();
    } catch (err: any) { setError(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-0.5">Manage products, pricing, and availability.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          + Add Product
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search products
          <input className="input mt-1.5 normal-case font-normal tracking-normal" placeholder="Name, brand, description, or SKU" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category
          <select className="select mt-1.5 normal-case font-normal tracking-normal" value={categoryId} onChange={event => { setCategoryId(event.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} › ${category.name}` : category.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Visibility
          <select className="select mt-1.5 normal-case font-normal tracking-normal" value={activeFilter} onChange={event => { setActiveFilter(event.target.value as typeof activeFilter); setPage(1); }}>
            <option value="active">Active products</option><option value="inactive">Archived products</option><option value="all">All products</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 self-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={lowStockOnly} onChange={event => { setLowStockOnly(event.target.checked); setPage(1); }} />Low stock only
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={missingImageOnly} onChange={event => { setMissingImageOnly(event.target.checked); setPage(1); }} />Missing photo
          </label>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
          <div className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="product-form-title" className="text-lg font-bold">{editing ? "Edit Product" : "Add New Product"}</h2>
            <button type="button" onClick={resetForm} className="rounded-lg p-2 text-2xl leading-none text-gray-500 hover:bg-gray-100" aria-label="Close product form">×</button>
          </div>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required className="input" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input" rows={3} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            {/* Category DROPDOWN — not raw ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              {categories.length === 0 ? (
                <p className="text-sm text-red-500">No categories found. Add a category first.</p>
              ) : (
                <select required className="select" value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                  <option value="">— Select category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.parent ? `${cat.parent.name} › ${cat.name}` : cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input className="input" value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input className="input" placeholder="Leave blank to auto-skip"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR) *</label>
              <input required type="number" step="0.01" min="0" className="input"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select className="select" value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}>
                {["kg","gram","litre","ml","packet","box","piece","dozen"].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input type="number" min="0" className="input" value={formData.stockQuantity} disabled={!!editing}
                onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} />
              {editing && <p className="mt-1 text-xs text-gray-500">Use Inventory to receive stock or record a correction, so the change is logged safely.</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input type="number" min="0" className="input" value={formData.lowStockThreshold}
                onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (optional)</label>
              <input className="input" maxLength={120} value={formData.supplierName} onChange={e => setFormData({ ...formData, supplierName: e.target.value })} placeholder="Supplier or wholesaler" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date (optional)</label>
              <input type="date" className="input" value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">Product photos</label>
                <span className="text-xs font-semibold text-gray-500">{formData.images.filter(url => url.trim()).length} / 8</span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-gray-500">The first photo is the main product image. Add direct image links or upload photos from your device.</p>
              <div className="space-y-3">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl border border-gray-200 p-2.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <ProductImage src={imageUrl || null} name={formData.name || "Product preview"} categoryName={categories.find(cat => cat.id === formData.categoryId)?.name} categorySlug={categories.find(cat => cat.id === formData.categoryId)?.slug} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {index === 0 && <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-brand-700">Main photo</span>}
                      <input type="url" className="input" placeholder="Paste a direct image URL" value={imageUrl}
                        onChange={event => setFormData(current => ({ ...current, images: current.images.map((url, i) => i === index ? event.target.value : url) }))} />
                    </div>
                    <button type="button" onClick={() => setFormData(current => ({ ...current, images: current.images.filter((_, i) => i !== index) }))} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" aria-label={`Remove photo ${index + 1}`}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {token && formData.images.length < 8 && <AdminImageUpload token={token} assetType="product" multiple maxFiles={8 - formData.images.length} onUploaded={image => setFormData(current => current.images.length < 8 ? { ...current, images: [...current.images, image] } : current)} />}
                {formData.images.length < 8 && <button type="button" onClick={() => setFormData(current => ({ ...current, images: [...current.images, ""] }))} className="btn-secondary">+ Add image link</button>}
              </div>
              <p className="mt-2 text-xs text-gray-500">Up to 8 photos. JPG, PNG, WebP, AVIF, and HEIC uploads up to 5 MB each.</p>
            </div>

            <div className="md:col-span-2 flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })} />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Compact list; full product information stays in the edit form. */}
      {products.length > 0 ? (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {products.map((p) => (
            <article key={p.id} className="grid grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition-colors hover:bg-gray-50 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-6">
              <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50"><ProductImage src={p.image} name={p.name} categoryName={p.category?.name} categorySlug={p.category?.slug} /></div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{p.name}</p>
                  <p className="truncate text-xs text-gray-500">{p.category?.name ?? "Uncategorized"}{!p.active && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">Archived</span>}</p>
                </div>
              </div>
              <div className="text-sm sm:text-right">
                <p className="font-semibold text-brand-600">NPR {Number(p.price).toLocaleString("en-NP")}</p>
                <p className={`text-xs font-medium ${p.stockQuantity === 0 ? "text-red-600" : p.stockQuantity <= p.lowStockThreshold ? "text-yellow-700" : "text-gray-500"}`}>
                  {p.stockQuantity === 0 ? "Out of stock" : `${p.stockQuantity} in stock`}
                </p>
              </div>
              <div className="col-span-2 flex flex-wrap justify-end gap-x-4 gap-y-2 text-sm sm:col-span-1">
                <button onClick={() => handleEdit(p)} className="font-medium text-blue-600 hover:text-blue-800">Edit</button>
                <button onClick={() => handleToggleActive(p)} className={p.active ? "font-medium text-red-600 hover:text-red-800" : "font-medium text-green-700 hover:text-green-900"}>{p.active ? "Deactivate" : "Activate"}</button>
                {!p.active && <button onClick={() => void handleDelete(p)} className="font-semibold text-red-700 hover:text-red-900">Delete</button>}
              </div>
            </article>
          ))}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page-1))} disabled={page<=1} className="btn-secondary px-3 py-1 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page>=totalPages} className="btn-secondary px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No products yet. Add your first product above.</p>
        </div>
      )}
    </div>
  );
}
