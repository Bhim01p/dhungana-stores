import { useEffect, useState, useCallback } from "react";
import { adminCategoriesApi } from "../api/adminCategories";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", imageUrl: "", active: true, parentId: "" });

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminCategoriesApi.getAll(token, { page, limit: 50 });
      setCategories(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [token, page]);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  const resetForm = () => { setFormData({ name: "", description: "", imageUrl: "", active: true, parentId: "" }); setEditing(null); setShowForm(false); };
  const handleEdit = (cat: any) => { setEditing(cat); setFormData({ name: cat.name, description: cat.description ?? "", imageUrl: cat.imageUrl ?? "", active: cat.active, parentId: cat.parentId ?? "" }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const categoryData = { ...formData, parentId: formData.parentId || null };
      if (editing) await adminCategoriesApi.update(token, editing.id, categoryData);
      else await adminCategoriesApi.create(token, categoryData);
      resetForm(); await fetchCategories();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((item) => item.id === id);
    if (!token || !category) return;
    if (category.active) {
      setError(`Deactivate “${category.name}” before deleting it.`);
      return;
    }
    if ((category._count?.children ?? 0) > 0) {
      setError(`“${category.name}” still has ${category._count.children} subcategor${category._count.children === 1 ? "y" : "ies"}. Move or delete them first.`);
      return;
    }
    if ((category._count?.products ?? 0) > 0) {
      setError(`“${category.name}” still has ${category._count.products} product${category._count.products === 1 ? "" : "s"}. Move or delete those products before deleting this category.`);
      return;
    }
    if (!confirm(`Permanently delete “${category.name}”? This cannot be undone.`)) return;
    try { await adminCategoriesApi.delete(token, id); await fetchCategories(); }
    catch (err: any) { setError(err.message); }
  };

  const handleDeactivate = async (id: string) => {
    const category = categories.find((item) => item.id === id);
    if (!token || !category) return;
    if ((category?._count?.children ?? 0) > 0) {
      setError("Deactivate or delete its subcategories before deactivating the parent category.");
      return;
    }
    if (!confirm("Deactivate this category? It will no longer be shown to customers.")) return;
    try {
      await adminCategoriesApi.update(token, id, { active: false });
      await fetchCategories();
    } catch (err: any) { setError(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Categories</h1><p className="text-gray-500 mt-0.5">{categories.filter((cat) => !cat.parentId).length} main categories · {categories.filter((cat) => cat.parentId).length} subcategories</p><p className="mt-1 text-xs text-gray-400">Deactivate a category first. Move or delete its products and subcategories before permanently deleting it.</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ Add Category</button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">{editing ? "Edit Category" : "Add New Category"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category photo URL</label>
              <input type="url" className="input" placeholder="https://example.com/category-photo.jpg" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
              <p className="mt-1 text-xs text-gray-500">Use a public direct image link. Leave blank to show the category icon.</p>
              {formData.imageUrl && <img key={formData.imageUrl} src={formData.imageUrl} alt="Category preview" className="mt-3 h-20 w-20 rounded-xl border border-gray-200 bg-gray-50 object-cover" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent category</label>
              <select className="select" value={formData.parentId} onChange={e => setFormData({ ...formData, parentId: e.target.value })}>
                <option value="">None — top-level category</option>
                {categories.filter((cat) => cat.active && !cat.parentId && cat.id !== editing?.id).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Choose a main category to make this a subcategory.</p>
            </div>
            <div className="flex items-center gap-2"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} /><span className="text-sm text-gray-700">Active</span></label></div>
            <div className="flex gap-3"><button type="submit" className="btn-primary">{editing ? "Update" : "Create"}</button><button type="button" onClick={resetForm} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}

      {categories.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase font-medium"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Description</th><th className="px-6 py-3 text-center">Products</th><th className="px-6 py-3 text-center">Active</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">
                      {cat.parent && <span className="mr-1 text-gray-400">↳</span>}
                      {cat.name}
                      {cat.parent && <span className="ml-2 text-xs font-normal text-gray-400">under {cat.parent.name}</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{cat.description ?? "-"}</td>
                    <td className="px-6 py-3 text-center">
                      <span>{(cat._count?.products ?? 0) + (cat.children ?? []).reduce((sum: number, child: any) => sum + (child._count?.products ?? 0), 0)} products</span>
                      {(cat._count?.children ?? 0) > 0 && <span className="ml-1 block text-xs text-gray-400">{cat._count?.children} subcategories</span>}
                    </td>
                    <td className="px-6 py-3 text-center"><span className={`text-xs font-semibold ${cat.active ? "text-green-600" : "text-gray-400"}`}>{cat.active ? "Yes" : "No"}</span></td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit(cat)} className="text-blue-500 hover:text-blue-700">Edit</button>
                      {cat.active ? <button onClick={() => handleDeactivate(cat.id)} className="text-amber-600 hover:text-amber-800">Deactivate</button> : <button onClick={() => handleDelete(cat.id)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary px-3 py-1 disabled:opacity-40">Prev</button><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary px-3 py-1 disabled:opacity-40">Next</button></div></div>}
        </div>
      ) : <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><p className="text-gray-500">No categories yet. Add your first category above.</p></div>}
    </div>
  );
}
