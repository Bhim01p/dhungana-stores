import { useEffect, useState, useCallback } from "react";
import { adminProductsApi } from "../api/adminProducts";
import { adminCategoriesApi } from "../api/adminCategories";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Unit } from "../types";
import type { Product } from "../types";
import ProductImage from "../components/ProductImage";
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
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const [formData, setFormData] = useState({
    name: "", description: "", categoryId: "", brand: "", sku: "",
    price: "", unit: "kg" as Unit, stockQuantity: 0, lowStockThreshold: 10,
    image: "", active: true, featured: false,
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
      setTotalCount(res.meta.total);
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
      price: "", unit: "kg", stockQuantity: 0, lowStockThreshold: 10,
      image: "", active: true, featured: false,
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
      image: product.image ?? "", active: product.active, featured: product.featured,
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
        await adminProductsApi.update(token, editing.id, formData);
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
      if (product.active) await adminProductsApi.delete(token, product.id);
      else await adminProductsApi.update(token, product.id, { active: true });
      await fetchProducts();
    }
    catch (err: any) { setError(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Inventory</p>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-0.5">{totalCount} matching products</p>
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
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">{editing ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
              <input type="number" min="0" className="input" value={formData.stockQuantity}
                onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input type="number" min="0" className="input" value={formData.lowStockThreshold}
                onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product photo link</label>
              <input type="url" className="input" placeholder="Paste a public image URL"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })} />
              <div className="mt-3 flex items-center gap-3">
                <div className="h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                  <ProductImage src={formData.image || null} name={formData.name || "Product preview"} categoryName={categories.find(cat => cat.id === formData.categoryId)?.name} categorySlug={categories.find(cat => cat.id === formData.categoryId)?.slug} />
                </div>
                <p className="max-w-md text-xs leading-relaxed text-gray-500">Use a public, direct image link. If you leave this empty, the store uses a matching category illustration.</p>
              </div>
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
      )}

      {/* Table */}
      {products.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase font-medium text-xs">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-center">Stock</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100"><ProductImage src={p.image} name={p.name} categoryName={p.category?.name} categorySlug={p.category?.slug} /></div>
                        <div className="min-w-0"><p className="truncate font-semibold text-gray-900">{p.name}</p><p className="truncate text-xs text-gray-500">{p.sku || p.brand || "No SKU or brand"}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{p.category?.name ?? "—"}</td>
                    <td className="px-6 py-3 text-right font-semibold text-brand-600">
                      NPR {Number(p.price).toLocaleString("en-NP")}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-xs font-bold ${
                        p.stockQuantity === 0 ? "text-red-600" :
                        p.stockQuantity <= p.lowStockThreshold ? "text-yellow-600" : "text-green-600"
                      }`}>{p.stockQuantity}</span>
                    </td>
                    <td className="px-6 py-3 text-center">{p.active ? <span className="badge badge-green">Active</span> : <span className="badge bg-gray-100 text-gray-600">Archived</span>}</td>
                    <td className="px-6 py-3 text-right space-x-3">
                      <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">Edit</button>
                      <button onClick={() => handleToggleActive(p)} className={p.active ? "text-red-500 hover:text-red-700 text-sm font-medium" : "text-green-700 hover:text-green-900 text-sm font-medium"}>{p.active ? "Deactivate" : "Activate"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
