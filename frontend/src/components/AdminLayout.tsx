import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getStorefrontUrl } from "../utils/siteUrls";

const sidebarItems = [
  { to: "/admin/dashboard",        label: "Dashboard",        icon: "📊", adminOnly: true },
  { to: "/admin/products",         label: "Products",         icon: "🛒", adminOnly: true },
  { to: "/admin/categories",       label: "Categories",       icon: "📂", adminOnly: true },
  { to: "/admin/orders",           label: "Orders",           icon: "📦", adminOnly: false },
  { to: "/admin/account",          label: "My Account",       icon: "🔐", adminOnly: false },
  { to: "/admin/payment-methods",  label: "Payment Methods",  icon: "💳", adminOnly: true },
  { to: "/admin/staff",            label: "Staff Access",     icon: "👥", adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-lg">Bishnu &amp; Dhungana</span>
          </div>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.filter(item => !item.adminOnly || user?.role === "ADMIN").map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-brand-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={getStorefrontUrl()} className="text-xs text-gray-300 hover:text-white px-2 py-2">Store</a>
          <button type="button" onClick={() => setMobileMenuOpen(open => !open)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"} className="rounded-lg p-2 hover:bg-gray-800">
            {mobileMenuOpen ? <span className="text-xl leading-none">×</span> : <span className="text-xl leading-none">☰</span>}
          </button>
        </div>
      </div>

      {mobileMenuOpen && <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto bg-gray-900 text-white shadow-xl">
        <nav className="p-4 space-y-1">
          {sidebarItems.filter(item => !item.adminOnly || user?.role === "ADMIN").map(item => <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 ${location.pathname === item.to ? "bg-brand-600 text-white" : "text-gray-200 hover:bg-gray-800"}`}>
            <span>{item.icon}</span><span className="font-medium">{item.label}</span>
          </Link>)}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="px-4 pb-2 text-xs text-gray-400">{user?.username} · {user?.role.toLowerCase()}</p>
            <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="w-full min-h-12 rounded-lg px-4 py-3 text-left text-red-300 hover:bg-gray-800">🚪 Logout</button>
          </div>
        </nav>
      </div>}

      <main className="flex-1 md:ml-0 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
