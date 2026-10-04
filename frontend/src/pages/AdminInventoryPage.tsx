import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminInventoryApi, type InventoryOverview } from '../api/adminInventory';
import { adminProductsApi } from '../api/adminProducts';
import type { Product } from '../types';

export default function AdminInventoryPage() {
  const { token } = useAuth();
  const [data, setData] = useState<InventoryOverview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [kind, setKind] = useState<'RECEIVE' | 'CORRECTION' | 'EXPIRED'>('RECEIVE');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [overview, productPage] = await Promise.all([
        adminInventoryApi.getOverview(token),
        adminProductsApi.getAll(token, { active: true, limit: 100 }),
      ]);
      setData(overview); setProducts(productPage.data);
      setProductId(current => current || productPage.data[0]?.id || '');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load stock records.'); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !productId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await adminInventoryApi.adjust(token, {
        productId, kind, quantity: Number(quantity), reason,
        ...(kind === 'RECEIVE' && unitCost !== '' ? { unitCost: Number(unitCost) } : {}),
      });
      setQuantity(''); setUnitCost(''); setReason('');
      setNotice('Stock updated and added to the inventory history.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update stock.'); }
    finally { setBusy(false); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiringSoon = data?.products.filter(product => { if (!product.expiresAt) return false; const date = new Date(product.expiresAt); return date >= today && date <= new Date(today.getTime() + 30 * 86400000); }) ?? [];
  const expired = data?.products.filter(product => product.expiresAt && new Date(product.expiresAt) < today) ?? [];
  const low = data?.products.filter(product => product.stockQuantity <= product.lowStockThreshold) ?? [];
  const selectedProduct = products.find(product => product.id === productId);

  return <div className="space-y-6 p-4 md:p-8">
    <header><p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Stock control</p><h1 className="text-2xl font-bold text-gray-900">Inventory</h1><p className="mt-1 text-sm text-gray-500">Receive stock, record corrections, remove expired items, and review who changed inventory.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
    <div className="grid gap-4 sm:grid-cols-3"><article className="card p-5"><p className="text-sm font-medium text-gray-500">Low stock</p><p className="mt-1 text-3xl font-bold text-brand-700">{low.length}</p><p className="mt-1 text-xs text-gray-500">At or below reorder threshold</p></article><article className="card p-5"><p className="text-sm font-medium text-gray-500">Expiry within 30 days</p><p className="mt-1 text-3xl font-bold text-amber-700">{expiringSoon.length}</p><p className="mt-1 text-xs text-gray-500">Review date and remaining quantity</p></article><article className="card p-5"><p className="text-sm font-medium text-gray-500">Already expired</p><p className="mt-1 text-3xl font-bold text-red-700">{expired.length}</p><p className="mt-1 text-xs text-gray-500">Remove expired stock and record the reason</p></article></div>
    <form onSubmit={submit} className="card grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="font-bold text-gray-900">Update stock</h2><p className="text-sm text-gray-500">Every adjustment is recorded with the staff account and reason.</p></div>
      <label className="text-sm font-medium text-gray-700">Product<select required className="select mt-1" value={productId} onChange={e => setProductId(e.target.value)}><option value="">Choose a product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · stock {product.stockQuantity}</option>)}</select></label>
      <label className="text-sm font-medium text-gray-700">Action<select className="select mt-1" value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="RECEIVE">Receive new stock</option><option value="CORRECTION">Correct stock count</option><option value="EXPIRED">Remove expired stock</option></select></label>
      <label className="text-sm font-medium text-gray-700">{kind === 'CORRECTION' ? 'Change quantity' : 'Quantity'} ({selectedProduct?.unit ?? 'units'})<input required type="number" min={kind === 'CORRECTION' ? -100000 : 1} max="100000" step="1" className="input mt-1" value={quantity} onChange={e => setQuantity(e.target.value)} />{kind === 'CORRECTION' && <span className="mt-1 block text-xs text-gray-500">Use a negative number to remove missing stock.</span>}</label>
      {kind === 'RECEIVE' && <label className="text-sm font-medium text-gray-700">Unit cost in NPR (optional)<input type="number" min="0" step="0.01" className="input mt-1" value={unitCost} onChange={e => setUnitCost(e.target.value)} /></label>}
      <label className="text-sm font-medium text-gray-700 md:col-span-2">Reason<input required minLength={3} maxLength={500} className="input mt-1" value={reason} onChange={e => setReason(e.target.value)} placeholder={kind === 'RECEIVE' ? 'Supplier delivery or invoice reference' : kind === 'EXPIRED' ? 'Expiry / disposal note' : 'Reason for correction'} /></label>
      <button disabled={busy || !productId} className="btn-primary min-h-11 md:col-span-2">{busy ? 'Saving…' : 'Save stock update'}</button>
    </form>
    <section className="card overflow-hidden"><div className="border-b border-gray-100 p-5"><h2 className="font-bold">Stock alerts</h2><p className="text-sm text-gray-500">Supplier and expiry dates are managed in each product’s details.</p></div>{data?.products.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Alert</th></tr></thead><tbody className="divide-y divide-gray-100">{data.products.map(product => { const isExpired = !!product.expiresAt && new Date(product.expiresAt) < today; const isLow = product.stockQuantity <= product.lowStockThreshold; return <tr key={product.id}><td className="px-4 py-3 font-medium">{product.name}</td><td className="px-4 py-3 text-gray-600">{product.supplierName || '—'}</td><td className="px-4 py-3 text-right">{product.stockQuantity} {product.unit}</td><td className="px-4 py-3">{product.expiresAt ? new Date(product.expiresAt).toLocaleDateString() : '—'}</td><td className="px-4 py-3"><span className={`badge ${isExpired ? 'bg-red-100 text-red-800' : isLow ? 'bg-amber-100 text-amber-900' : 'badge-brand'}`}>{isExpired ? 'Expired' : isLow ? 'Low stock' : 'Expiry approaching'}</span></td></tr>; })}</tbody></table></div> : <p className="p-6 text-sm text-gray-500">No products currently need attention.</p>}</section>
    <section className="card overflow-hidden"><div className="border-b border-gray-100 p-5"><h2 className="font-bold">Recent stock history</h2></div>{data?.movements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">Stock after</th><th className="px-4 py-3">Reason / receipt</th><th className="px-4 py-3">By</th></tr></thead><tbody className="divide-y divide-gray-100">{data.movements.map(move => <tr key={move.id}><td className="px-4 py-3 text-gray-500">{new Date(move.createdAt).toLocaleString()}</td><td className="px-4 py-3 font-medium">{move.productName}</td><td className={`px-4 py-3 font-semibold ${move.quantityChange > 0 ? 'text-green-700' : move.quantityChange < 0 ? 'text-red-700' : ''}`}>{move.quantityChange > 0 ? '+' : ''}{move.quantityChange}</td><td className="px-4 py-3">{move.stockAfter}</td><td className="max-w-64 truncate px-4 py-3 text-gray-600">{move.reason || move.reference || move.type}</td><td className="px-4 py-3">{move.actor?.username || 'System'}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-gray-500">No stock movements yet.</p>}</section>
  </div>;
}
