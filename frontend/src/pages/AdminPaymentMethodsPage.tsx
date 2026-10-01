import { useEffect, useState, useCallback } from "react";
import { adminPaymentMethodsApi } from "../api/adminPaymentMethods";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import type { PaymentMethod } from "../types";

export default function AdminPaymentMethodsPage() {
  const { token } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: "", qrImageUrl: "", accountInfo: "", active: true, sortOrder: 0,
  });

  const fetchMethods = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      setMethods(await adminPaymentMethodsApi.getAll(token));
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void fetchMethods(); }, [fetchMethods]);

  const resetForm = () => {
    setFormData({ name: "", qrImageUrl: "", accountInfo: "", active: true, sortOrder: 0 });
    setEditing(null); setShowForm(false);
  };

  const handleEdit = (m: PaymentMethod) => {
    setEditing(m);
    setFormData({
      name: m.name, qrImageUrl: m.qrImageUrl,
      accountInfo: m.accountInfo ?? "", active: m.active, sortOrder: m.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (editing) {
        await adminPaymentMethodsApi.update(token, editing.id, {
          ...formData, accountInfo: formData.accountInfo || undefined,
        });
      } else {
        await adminPaymentMethodsApi.create(token, {
          ...formData, accountInfo: formData.accountInfo || undefined,
        });
      }
      resetForm(); await fetchMethods();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this payment method?")) return;
    try { await adminPaymentMethodsApi.delete(token, id); await fetchMethods(); }
    catch (err: any) { setError(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading payment methods..." />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500 mt-0.5">Manage QR codes shown to customers at checkout</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          + Add Method
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">{editing ? "Edit Payment Method" : "Add Payment Method"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required className="input" placeholder="e.g. eSewa, Khalti, Bank Transfer"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account / Phone</label>
              <input className="input" placeholder="9800000000"
                value={formData.accountInfo} onChange={e => setFormData({ ...formData, accountInfo: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Image URL *</label>
              <input required className="input" placeholder="https://example.com/your-qr-code.png"
                value={formData.qrImageUrl} onChange={e => setFormData({ ...formData, qrImageUrl: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">
                Upload your QR image to Google Drive, Imgur or any image host and paste the direct URL here
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" min="0" className="input" value={formData.sortOrder}
                onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                <span className="text-sm text-gray-700">Active (shown to customers)</span>
              </label>
            </div>

            {/* QR Preview */}
            {formData.qrImageUrl && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">QR Preview:</p>
                <img src={formData.qrImageUrl} alt="QR Preview"
                  className="w-32 h-32 object-contain border border-gray-200 rounded-lg bg-gray-50 p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Cards */}
      {methods.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-4xl">💳</span>
          <p className="text-gray-500 mt-3 font-medium">No payment methods yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first payment method to allow customers to pay via QR</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((m) => (
            <div key={m.id} className={`card p-5 space-y-4 ${!m.active ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  {m.accountInfo && <p className="text-xs text-gray-500 mt-0.5">{m.accountInfo}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {m.active ? "Active" : "Inactive"}
                </span>
              </div>
              <img src={m.qrImageUrl} alt={`${m.name} QR`}
                className="w-full h-40 object-contain bg-gray-50 rounded-lg border border-gray-200 p-2"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIj5RUiBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==";
                }}
              />
              <div className="flex gap-2">
                <button onClick={() => handleEdit(m)} className="btn-secondary flex-1 text-sm py-1.5">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}