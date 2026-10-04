import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminStatsApi } from "../api/adminStats";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AdminSalesChart from "../components/AdminSalesChart";
import { downloadAdminExport, type AdminExportKind } from "../api/adminExports";

interface StatCardProps { title: string; value: number | string; icon: string; tint: string; }
function StatCard({ title, value, icon, tint }: StatCardProps) {
  return <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6"><div className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tint}`}>{icon}</div><div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p><p className="mt-0.5 text-2xl font-bold text-stone-900">{value}</p></div></div>;
}

function getFirstName(username?: string) {
  const value = username?.trim() ?? "";
  const localPart = value.split("@")[0] ?? "";
  if (/^nishandhungana\d*$/i.test(localPart)) return "Nishan";
  const firstName = localPart.split(/[._\-\s\d]+/).find(Boolean) ?? "Admin";
  return firstName.charAt(0).toLocaleUpperCase() + firstName.slice(1);
}

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const firstName = getFirstName(user?.username);
  const can = (permission: string) => user?.role === "ADMIN" || user?.permissions?.includes(permission) === true;
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<AdminExportKind | null>(null);
  const [exportError, setExportError] = useState("");

  const exportData = async (kind: AdminExportKind) => {
    if (!token) return;
    setExporting(kind); setExportError("");
    try { await downloadAdminExport(token, kind); }
    catch (err) { setExportError(err instanceof Error ? err.message : "Could not export data."); }
    finally { setExporting(null); }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true); setError(null);
    (async () => {
      try {
        const [statsRes, lowStockRes] = await Promise.all([adminStatsApi.getDashboardStats(token), adminStatsApi.getLowStockProducts(token)]);
        setStats(statsRes); setLowStock(lowStockRes);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <div className="min-h-screen bg-[#f7f4ec] p-5"><ErrorMessage message={error} /></div>;

  return <div className="min-h-screen bg-[#f7f4ec] px-4 py-5 pb-10 md:px-8 md:py-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-900 to-brand-600 p-5 text-white shadow-sm md:p-7"><div><p className="text-sm font-medium text-rose-100/85">Bishnu &amp; Dhungana Stores · Admin</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">Welcome, {firstName}</h1><p className="mt-1 text-sm text-white/85">Your store at a glance. Choose a task to get started.</p></div><div className="flex flex-wrap items-center gap-3"><Link to="/staff-login/desk/account" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"><span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-white text-xs font-bold text-brand-800">{user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-full w-full object-cover" /> : firstName[0]}</span>Profile &amp; photo</Link>{can("STORE_SALES") && <Link to="/staff-login/desk/sales" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-brand-800 shadow-sm hover:bg-brand-50">🧾 New store sale</Link>}</div></header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active products" value={stats?.activeProducts ?? 0} icon="🛍️" tint="bg-emerald-50 text-emerald-800" />
        <StatCard title="All products" value={stats?.totalProducts ?? 0} icon="📦" tint="bg-amber-50 text-amber-800" />
        <StatCard title="Categories" value={stats?.totalCategories ?? 0} icon="🗂️" tint="bg-orange-50 text-orange-800" />
        <StatCard title="Online orders" value={stats?.totalOrders ?? 0} icon="🛵" tint="bg-sky-50 text-sky-800" />
      </div>

      {token && <AdminSalesChart token={token} />}

      {can("EXPORTS") && <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-stone-900">Reports and data backup</h2><p className="text-sm text-stone-500">Download sales, orders, or stock history for your records.</p></div><button type="button" onClick={() => void exportData('snapshot')} disabled={!!exporting} className="btn-secondary">{exporting === 'snapshot' ? 'Preparing…' : 'Download data snapshot'}</button></div>
        <div className="mt-3 flex flex-wrap gap-2">{([['store-sales','Store sales CSV'],['online-orders','Online orders CSV'],['inventory','Inventory history CSV']] as const).map(([kind,label]) => <button key={kind} type="button" disabled={!!exporting} onClick={() => void exportData(kind)} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-50">{exporting === kind ? 'Preparing…' : label}</button>)}</div>
        <p className="mt-2 text-xs text-stone-500">The snapshot includes customer, staff, and support contact details. Store it privately; it is not a full database restore. Enable Neon backups separately for recovery.</p>
        {exportError && <p role="alert" className="mt-2 text-sm text-red-700">{exportError}</p>}
      </section>}

      <section><div className="mb-3"><h2 className="text-lg font-bold text-stone-900">Quick access</h2><p className="text-sm text-stone-500">Common store and customer tasks</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/staff-login/desk/sales", permission: "STORE_SALES", icon: "🧾", title: "Store Sales", text: "Create a walk-in customer bill" },
          { to: "/staff-login/desk/orders", permission: "ORDERS", icon: "🛵", title: "Online Orders", text: `${stats?.pendingOrders ?? 0} waiting for attention` },
          { to: "/staff-login/desk/products", permission: "PRODUCTS", icon: "🛍️", title: "Products", text: "Update price, stock and details" },
          { to: "/staff-login/desk/inventory", permission: "INVENTORY", icon: "📋", title: "Inventory", text: "Receive stock, check expiry and history" },
          { to: "/staff-login/desk/categories", permission: "CATEGORIES", icon: "🗂️", title: "Categories", text: "Organize the online catalogue" },
        ].filter(action => can(action.permission)).map(action => <Link key={action.to} to={action.to} className="group rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"><span className="text-2xl">{action.icon}</span><h3 className="mt-3 font-bold text-stone-900 group-hover:text-brand-800">{action.title} <span aria-hidden="true">→</span></h3><p className="mt-1 text-sm text-stone-500">{action.text}</p></Link>)}
      </div></section>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><div><h2 className="font-bold text-stone-900">Stock to check</h2><p className="text-sm text-stone-500">Products at or below their threshold</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{lowStock.length}</span></div>
          {lowStock.length ? <div className="mt-4 space-y-2">{lowStock.slice(0, 6).map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50/80 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-800">{item.name}</p>{item.sku && <p className="text-xs text-stone-500">SKU {item.sku}</p>}</div><span className="shrink-0 rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs font-bold text-amber-900">{item.stockQuantity} {item.unit}</span></div>)}</div> : <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">All set — there are no low stock alerts.</div>}
          {lowStock.length > 6 && can("PRODUCTS") && <Link to="/staff-login/desk/products" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">See all products →</Link>}
        </section>
        {can("ORDERS") && <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-stone-100 px-5 py-4"><div><h2 className="font-bold text-stone-900">Recent online orders</h2><p className="text-sm text-stone-500">Delivery orders placed by customers</p></div><Link to="/staff-login/desk/orders" className="text-sm font-semibold text-brand-700 hover:underline">View all →</Link></div>
          {stats?.recentOrders?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-stone-100">{stats.recentOrders.slice(0, 6).map((order: any) => <tr key={order.id}><td className="px-5 py-3 font-mono text-xs">{order.orderNumber}</td><td className="px-5 py-3">{order.customerName}</td><td className="px-5 py-3 text-right font-semibold">NPR {Number(order.total).toLocaleString("en-NP")}</td><td className="px-5 py-3"><span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">{order.orderStatus.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div> : <p className="px-5 py-10 text-center text-sm text-stone-500">No online orders yet.</p>}
        </section>}
      </div>
    </div>
  </div>;
}
