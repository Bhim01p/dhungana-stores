import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminInventoryApi } from '../api/adminInventory';

export default function AdminActivityPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof adminInventoryApi.getActivity>>>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (token) adminInventoryApi.getActivity(token).then(setItems).catch(e => setError(e instanceof Error ? e.message : 'Could not load activity.')); }, [token]);
  return <div className="space-y-5 p-4 md:p-8"><header><p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Accountability</p><h1 className="text-2xl font-bold">Activity history</h1><p className="mt-1 text-sm text-gray-500">Important order, payment, staff, and stock actions recorded with the account that made the change.</p></header>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<section className="card divide-y divide-gray-100 overflow-hidden">{items.length ? items.map(item => <article key={item.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-gray-900">{item.summary}</p><p className="text-xs uppercase tracking-wide text-brand-700">{item.entity} · {item.action} · {item.actor?.username || 'System'}</p></div><time className="shrink-0 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</time></article>) : <p className="p-8 text-center text-sm text-gray-500">{error ? 'Activity could not be loaded.' : 'No activity records yet.'}</p>}</section></div>;
}
