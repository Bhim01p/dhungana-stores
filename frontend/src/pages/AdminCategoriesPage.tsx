import { useEffect, useState, useCallback } from "react";
import { adminCategoriesApi } from "../api/adminCategories";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AdminImageUpload from "../components/AdminImageUpload";

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

  const orderedCategories = (() => {
    const roots = categories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name));
    const childrenByParent = new Map<string, any[]>();
    for (const category of categories.filter((item) => item.parentId)) {
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }
    const ordered = roots.flatMap((root) => [
      root,
      ...(childrenByParent.get(root.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    ]);
    const included = new Set(ordered.map((category) => category.id));
    return [...ordered, ...categories.filter((category) => !included.has(category.id)).sort((a, b) => a.name.localeCompare(b.name))];
  })();

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
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Store setup</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Categories</h1></div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary shrink-0">+ Add Category</button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
          <div className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="category-form-title" className="text-lg font-bold">{editing ? "Edit Category" : "Add New Category"}</h2>
            <button type="button" onClick={resetForm} className="rounded-lg p-2 text-2xl leading-none text-gray-500 hover:bg-gray-100" aria-label="Close category form">×</button>
          </div>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category photo URL</label>
              <input type="url" className="input" placeholder="https://example.com/category-photo.jpg" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
              {token && <AdminImageUpload token={token} assetType="category" onUploaded={imageUrl => setFormData(current => ({ ...current, imageUrl }))} />}
              <p className="mt-1 text-xs text-gray-500">A pasted link must open the image file itself. You can upload a photo above; save the form to apply it. Leave blank to show the category icon.</p>
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
        </div>
      )}

      {categories.length > 0 ? (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-stone-100">
            {orderedCategories.map((cat) => (
              <li key={cat.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50 sm:px-6">
                <div className={`flex min-w-0 items-center gap-3 ${cat.parentId ? "pl-5 sm:pl-8" : ""}`}>
                  {cat.parentId
                    ? <span aria-hidden="true" className="-ml-5 text-stone-300 sm:-ml-8">↳</span>
                    : <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">▦</span>}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900">{cat.name}</p>
                    {cat.parent && <p className="mt-0.5 truncate text-xs text-stone-500">Under {cat.parent.name}</p>}
                  </div>
                  {!cat.active && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500">Inactive</span>}
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button onClick={() => handleEdit(cat)} className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">Edit</button>
                  {cat.active
                    ? <button onClick={() => handleDeactivate(cat.id)} className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800">Deactivate</button>
                    : <button onClick={() => handleDelete(cat.id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>}
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary px-3 py-1 disabled:opacity-40">Prev</button><button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary px-3 py-1 disabled:opacity-40">Next</button></div></div>}
        </div>
      ) : <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><p className="text-gray-500">No categories yet. Add your first category above.</p></div>}
    </div>
  );
}
