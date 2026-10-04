import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getStorefrontUrl } from "../utils/siteUrls";
import BrandLogo from "./BrandLogo";

const sidebarItems = [
  { to: "/staff-login/desk/dashboard", label: "Dashboard", icon: "📊", feature: "DASHBOARD" },
  { to: "/staff-login/desk/products", label: "Products", icon: "🛒", feature: "PRODUCTS" },
  { to: "/staff-login/desk/inventory", label: "Inventory", icon: "📋", feature: "INVENTORY" },
  { to: "/staff-login/desk/categories", label: "Categories", icon: "📂", feature: "CATEGORIES" },
  { to: "/staff-login/desk/orders", label: "Orders", icon: "📦", feature: "ORDERS" },
  { to: "/staff-login/desk/sales", label: "Store Sales", icon: "🧾", feature: "STORE_SALES" },
  { to: "/staff-login/desk/fulfillment", label: "Delivery & Pickup", icon: "🚚", feature: "FULFILLMENT" },
  { to: "/staff-login/desk/messages", label: "Help & Feedback", icon: "💬", feature: "MESSAGES" },
  { to: "/staff-login/desk/account", label: "My Account", icon: "🔐", feature: "ACCOUNT" },
  { to: "/staff-login/desk/payment-methods", label: "Payment Methods", icon: "💳", feature: "PAYMENT_METHODS" },
  { to: "/staff-login/desk/staff", label: "Staff Access", icon: "👥", feature: "ADMIN_ONLY" },
  { to: "/staff-login/desk/activity", label: "Activity history", icon: "🕘", feature: "ACTIVITY" },
];

function visibleToUser(item: typeof sidebarItems[number], user: { role?: string; permissions?: string[] } | null) {
  return item.feature === "ACCOUNT" || user?.role === "ADMIN" || user?.permissions?.includes(item.feature) === true;
}

export default function AdminLayout() {
  const { user, logout, token, refreshToken } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { if (token) void refreshToken(); }, [token]);

  return (
    <div className="flex min-h-screen bg-[#f7f4ec]">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-950 text-white flex-col hidden md:flex shadow-xl">
        <div className="p-6 border-b border-white/10">
          <BrandLogo className="h-20 w-32 rounded-lg bg-white p-1" />
          <p className="mt-2 text-xs text-rose-100/75">Store management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {sidebarItems.filter(item => visibleToUser(item, user)).map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? "bg-brand-100 text-brand-900 shadow-sm" : "text-rose-50/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 overflow-hidden bg-white/15 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-full w-full object-cover" /> : user?.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-rose-100/70 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm text-rose-50/85 hover:text-white hover:bg-black/15 rounded-xl transition-colors">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-brand-950 text-white z-30 p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-10 w-[60px] rounded bg-white" />
          <span className="font-bold text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={getStorefrontUrl()} className="text-xs text-rose-50/85 hover:text-white px-2 py-2">Store</a>
          <button type="button" onClick={() => setMobileMenuOpen(open => !open)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"} className="rounded-lg p-2 hover:bg-white/10">
            {mobileMenuOpen ? <span className="text-xl leading-none">×</span> : <span className="text-xl leading-none">☰</span>}
          </button>
        </div>
      </div>

      {mobileMenuOpen && <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto bg-brand-950 text-white shadow-xl">
        <nav className="p-4 space-y-1">
          {sidebarItems.filter(item => visibleToUser(item, user)).map(item => <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 ${location.pathname === item.to ? "bg-brand-100 text-brand-900" : "text-rose-50/85 hover:bg-white/10"}`}>
            <span>{item.icon}</span><span className="font-medium">{item.label}</span>
          </Link>)}
          <div className="border-t border-white/10 pt-3 mt-3">
            <p className="px-4 pb-2 text-xs text-rose-100/75">{user?.username} · {user?.role.toLowerCase()}</p>
            <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="w-full min-h-12 rounded-xl px-4 py-3 text-left text-red-200 hover:bg-white/10">🚪 Logout</button>
          </div>
        </nav>
      </div>}

      <main className="flex-1 md:ml-0 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
