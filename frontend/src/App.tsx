import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CartProvider, useCart } from "./contexts/CartContext";
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
import BrandLogo from "./components/BrandLogo";
import AdminLayout from "./components/AdminLayout";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminPaymentMethodsPage from "./pages/AdminPaymentMethodsPage";
import AdminStaffPage from "./pages/AdminStaffPage";
import AdminAccountPage from "./pages/AdminAccountPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import CustomerSignupPage from "./pages/CustomerSignupPage";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import AdminMessagesPage from "./pages/AdminMessagesPage";
import AdminSalesPage from "./pages/AdminSalesPage";
import AdminInventoryPage from "./pages/AdminInventoryPage";
import AdminActivityPage from "./pages/AdminActivityPage";
import OrdersPage from "./pages/OrdersPage";
import NotFoundPage from "./pages/NotFoundPage";
import FavoritesPage from "./pages/FavoritesPage";
import AdminFulfillmentPage from "./pages/AdminFulfillmentPage";
import AdminCashDrawerPage from "./pages/AdminCashDrawerPage";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useLanguage } from "./i18n/LanguageContext";
import { getStaffPortalUrl, isStaffPortalHost } from "./utils/siteUrls";

// ── Admin protected route ──────────────────────────────────
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/staff-login" replace />;
  return <>{children}</>;
}

function FeatureRoute({ children, feature }: { children: React.ReactNode; feature: string }) {
  const { user } = useAuth();
  return user?.role === "ADMIN" || user?.permissions?.includes(feature)
    ? <>{children}</>
    : <Navigate to="/staff-login/desk/account" replace />;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? <>{children}</> : <Navigate to="/staff-login/desk/account" replace />;
}

function AdminHome() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <Navigate to="/staff-login/desk/dashboard" replace />;
  const first = ["ORDERS", "STORE_SALES", "CASH_DRAWER", "DASHBOARD", "PRODUCTS", "INVENTORY", "CATEGORIES", "FULFILLMENT", "MESSAGES", "PAYMENT_METHODS", "EXPORTS", "ACTIVITY"]
    .find(feature => user?.permissions?.includes(feature));
  const route = { ORDERS: "orders", STORE_SALES: "sales", CASH_DRAWER: "cash-drawer", DASHBOARD: "dashboard", PRODUCTS: "products", INVENTORY: "inventory", CATEGORIES: "categories", FULFILLMENT: "fulfillment", MESSAGES: "messages", PAYMENT_METHODS: "payment-methods", EXPORTS: "account", ACTIVITY: "activity" }[first ?? ""];
  return <Navigate to={route ? `/staff-login/desk/${route}` : "/staff-login/desk/account"} replace />;
}

// ── Floating cart button ───────────────────────────────────
function FloatingCartButton() {
  const { itemCount, openCart, cartNotice, clearCartNotice } = useCart();
  useEffect(() => {
    if (!cartNotice) return;
    const timer = window.setTimeout(clearCartNotice, 4500);
    return () => window.clearTimeout(timer);
  }, [cartNotice, clearCartNotice]);
  return (
    <>
      {cartNotice && <div role="status" aria-live="polite" className="fixed bottom-6 right-24 z-40 w-64 max-w-[calc(100vw-7rem)] rounded-2xl border border-emerald-200 bg-white p-3 shadow-xl">
        <p className="truncate text-xs font-semibold text-stone-800">✓ {cartNotice}</p>
        <button type="button" onClick={() => { clearCartNotice(); openCart(); }} className="mt-2 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-800 hover:bg-brand-100">View cart &amp; checkout</button>
      </div>}
      <button
        onClick={() => { clearCartNotice(); openCart(); }}
        className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-brand-600 active:scale-95 ${cartNotice ? "scale-105 ring-4 ring-amber-300" : ""}`}
        aria-label={`Open cart${itemCount > 0 ? ` — ${itemCount} items` : ""}`}
      >
        <span className="text-2xl">🛒</span>
        {itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">{itemCount > 99 ? "99+" : itemCount}</span>}
      </button>
    </>
  );
}

function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/9779846692687?text=Namaste%2C%20I%20need%20help%20with%20an%20order."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Bishnu and Dhungana Stores on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-24 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white transition hover:scale-105 hover:bg-[#1fbd5b] active:scale-95"
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.35.15 11.92c0 2.1.55 4.16 1.6 5.98L.05 24l6.25-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.19-1.24-6.19-3.48-8.43ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.88 9.88 0 0 1-1.52-5.27c0-5.47 4.45-9.92 9.93-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.91 7.01c0 5.47-4.45 9.92-9.92 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.38-.28.3-1.05 1.02-1.05 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.73 2.02-1.44.25-.7.25-1.32.18-1.44-.08-.13-.28-.2-.58-.35Z" />
      </svg>
    </a>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full" />
    </div>
  );
}

function StaffDomainOnly({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const staffPortalUrl = getStaffPortalUrl();
  const isOnStaffDomain = staffPortalUrl?.host === window.location.host;

  useEffect(() => {
    if (!staffPortalUrl || isOnStaffDomain) return;
    setRedirecting(true);
    const destination = new URL(`${location.pathname}${location.search}`, staffPortalUrl.origin);
    window.location.replace(destination.toString());
  }, [isOnStaffDomain, location.pathname, location.search, staffPortalUrl?.origin]);

  if (staffPortalUrl && !isOnStaffDomain) return <Spinner />;
  if (redirecting) return <Spinner />;
  return <>{children}</>;
}

function StoreHomePage() {
  if (isStaffPortalHost()) return <Navigate to="/staff-login" replace />;
  return <StoreLayout><HomePage /></StoreLayout>;
}

function PasswordResetRoute() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("type") === "admin") {
    return <StaffDomainOnly><ResetPasswordPage /></StaffDomainOnly>;
  }
  return <ResetPasswordPage />;
}

// ── Public store layout — Navbar + Footer + CartDrawer + floating cart ─────
function StoreLayout({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  return (
    <div className={`min-h-screen flex flex-col ${language === "ne" ? "public-nepali" : ""}`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className={`border-t border-gray-200 bg-white mt-12 ${language === "ne" ? "nepali-text" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-14 w-[84px] rounded-md" />
              <p className="max-w-[180px] text-xs text-gray-700">{t("Your neighbourhood kirana store")}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link to="/" className="hover:text-brand-500 transition-colors">{t("Home")}</Link>
              <Link to="/products" className="hover:text-brand-500 transition-colors">{t("Shop")}</Link>
              <Link to="/help" className="hover:text-brand-500 transition-colors">{t("Help & feedback")}</Link>
            </div>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Bishnu and Dhungana Stores</p>
          </div>
        </div>
      </footer>
      <CartDrawer />
      <FloatingWhatsAppButton />
      <FloatingCartButton />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <FavoritesProvider>
            <CartProvider>
          <Routes>
            {/* Public store routes */}
            <Route path="/"                    element={<StoreHomePage />} />
            <Route path="/products"            element={<StoreLayout><ProductsPage /></StoreLayout>} />
            <Route path="/products/:slug"      element={<StoreLayout><ProductDetailPage /></StoreLayout>} />
            <Route path="/categories"          element={<Navigate to="/products" replace />} />
            <Route path="/checkout"            element={<StoreLayout><CheckoutPage /></StoreLayout>} />
            <Route path="/order-confirmation"  element={<StoreLayout><OrderConfirmationPage /></StoreLayout>} />
            <Route path="/orders"              element={<StoreLayout><OrdersPage /></StoreLayout>} />
            <Route path="/favorites"           element={<StoreLayout><FavoritesPage /></StoreLayout>} />
            <Route path="/profile"             element={<StoreLayout><ProfilePage /></StoreLayout>} />
            <Route path="/help"                element={<StoreLayout><HelpPage /></StoreLayout>} />

            {/* Customer auth — no navbar/footer needed */}
            <Route path="/login"               element={<CustomerLoginPage />} />
            <Route path="/signup"              element={<CustomerSignupPage />} />
            <Route path="/forgot-password"     element={<ForgotPasswordPage accountType="customer" />} />
            <Route path="/reset-password"      element={<PasswordResetRoute />} />
            <Route path="/owner-password-recovery" element={<StaffDomainOnly><ForgotPasswordPage accountType="admin" /></StaffDomainOnly>} />
            <Route path="/admin/forgot-password" element={<NotFoundPage />} />
            <Route path="/admin"               element={<NotFoundPage />} />

            {/* 404 */}
            <Route path="*"                    element={<NotFoundPage />} />

            {/* Admin routes */}
            <Route path="/staff-login"         element={<StaffDomainOnly><AdminLoginPage /></StaffDomainOnly>} />
            <Route path="/staff/*"             element={<NotFoundPage />} />
            <Route path="/admin/login"         element={<NotFoundPage />} />
            <Route path="/admin/*"             element={<NotFoundPage />} />
            <Route path="/staff-login/desk"               element={<StaffDomainOnly><AdminProtectedRoute><AdminLayout /></AdminProtectedRoute></StaffDomainOnly>}>
              <Route index                     element={<AdminHome />} />
              <Route path="dashboard"         element={<FeatureRoute feature="DASHBOARD"><AdminDashboardPage /></FeatureRoute>} />
              <Route path="products"           element={<FeatureRoute feature="PRODUCTS"><AdminProductsPage /></FeatureRoute>} />
              <Route path="inventory"          element={<FeatureRoute feature="INVENTORY"><AdminInventoryPage /></FeatureRoute>} />
              <Route path="categories"         element={<FeatureRoute feature="CATEGORIES"><AdminCategoriesPage /></FeatureRoute>} />
              <Route path="orders"             element={<FeatureRoute feature="ORDERS"><AdminOrdersPage /></FeatureRoute>} />
              <Route path="sales"              element={<FeatureRoute feature="STORE_SALES"><AdminSalesPage /></FeatureRoute>} />
              <Route path="cash-drawer"        element={<FeatureRoute feature="CASH_DRAWER"><AdminCashDrawerPage /></FeatureRoute>} />
              <Route path="fulfillment"        element={<FeatureRoute feature="FULFILLMENT"><AdminFulfillmentPage /></FeatureRoute>} />
              <Route path="messages"           element={<FeatureRoute feature="MESSAGES"><AdminMessagesPage /></FeatureRoute>} />
              <Route path="account"            element={<AdminAccountPage />} />
              <Route path="payment-methods"    element={<FeatureRoute feature="PAYMENT_METHODS"><AdminPaymentMethodsPage /></FeatureRoute>} />
              <Route path="staff"              element={<AdminOnlyRoute><AdminStaffPage /></AdminOnlyRoute>} />
              <Route path="activity"           element={<FeatureRoute feature="ACTIVITY"><AdminActivityPage /></FeatureRoute>} />
            </Route>
          </Routes>
            </CartProvider>
          </FavoritesProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
