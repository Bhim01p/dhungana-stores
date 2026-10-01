import { useEffect, useState } from "react";
import { adminStatsApi } from "../api/adminStats";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

interface StatCardProps { title: string; value: number | string; icon: string; color: string; }

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = { blue: "bg-blue-50 text-blue-700 border-blue-100", green: "bg-green-50 text-green-700 border-green-100", orange: "bg-orange-50 text-orange-700 border-orange-100", purple: "bg-purple-50 text-purple-700 border-purple-100" };
  return (
    <div className={`card p-6 flex items-center gap-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl">{icon}</div>
      <div><p className="text-xs font-semibold uppercase tracking-wide">{title}</p><p className="text-2xl font-bold">{value}</p></div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-500 mt-0.5">Overview of your store performance</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon="🛒" color="blue" />
        <StatCard title="Active Products" value={stats?.activeProducts ?? 0} icon="✅" color="green" />
        <StatCard title="Categories" value={stats?.totalCategories ?? 0} icon="📂" color="orange" />
        <StatCard title="Low Stock" value={stats?.lowStockProducts ?? 0} icon="⚠️" color="purple" />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="font-bold text-orange-800 mb-3">⚠️ Low Stock Alerts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item: any) => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-orange-100">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.sku ? `SKU: ${item.sku} • ` : ""}Stock: {item.stockQuantity} / Threshold: {item.lowStockThreshold} {item.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-gray-900">Recent Orders</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase font-medium"><tr><th className="px-6 py-3">Order #</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3 text-right">Total</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-right">Date</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono">{order.orderNumber}</td>
                    <td className="px-6 py-3">{order.customerName}</td>
                    <td className="px-6 py-3 text-right font-semibold">NPR {Number(order.total).toLocaleString("en-NP")}</td>
                    <td className="px-6 py-3 text-center"><span className={`px-2 py-1 rounded text-xs font-medium ${order.orderStatus === "PENDING" ? "bg-red-100 text-red-700" : order.orderStatus === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{order.orderStatus.replace("_", " ")}</span></td>
                    <td className="px-6 py-3 text-right text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><p className="text-gray-500">No orders yet. Customer orders will appear here.</p></div>
      )}
    </div>
  );
}