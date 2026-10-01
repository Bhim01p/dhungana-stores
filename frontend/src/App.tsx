import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CartProvider, useCart } from "./contexts/CartContext";
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";
import CartDrawer from "./components/CartDrawer";
import Navbar from "./components/Navbar";
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
import CategoriesPage from "./pages/CategoriesPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import CustomerSignupPage from "./pages/CustomerSignupPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import NotFoundPage from "./pages/NotFoundPage";
import { getStaffPortalUrl, isStaffPortalHost } from "./utils/siteUrls";

// ── Admin protected route ──────────────────────────────────
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? <>{children}</> : <Navigate to="/admin/orders" replace />;
}

function AdminHome() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "ADMIN" ? "/admin/dashboard" : "/admin/orders"} replace />;
}

// ── Floating cart button ───────────────────────────────────
function FloatingCartButton() {
  const { itemCount, openCart } = useCart();
  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      aria-label={`Open cart${itemCount > 0 ? ` — ${itemCount} items` : ""}`}
    >
      <span className="text-2xl">🛒</span>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
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
  if (isStaffPortalHost()) return <AdminLoginPage />;
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
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Bishnu &amp; Dhungana Stores</p>
                <p className="text-xs text-gray-400">Your neighbourhood kirana store</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
              <Link to="/products" className="hover:text-brand-500 transition-colors">Products</Link>
              <Link to="/categories" className="hover:text-brand-500 transition-colors">Categories</Link>
            </div>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Bishnu and Dhungana Stores</p>
          </div>
        </div>
      </footer>
      <CartDrawer />
      <FloatingCartButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <Routes>
            {/* Public store routes */}
            <Route path="/"                    element={<StoreHomePage />} />
            <Route path="/products"            element={<StoreLayout><ProductsPage /></StoreLayout>} />
            <Route path="/products/:slug"      element={<StoreLayout><ProductDetailPage /></StoreLayout>} />
            <Route path="/categories"          element={<StoreLayout><CategoriesPage /></StoreLayout>} />
            <Route path="/checkout"            element={<StoreLayout><CheckoutPage /></StoreLayout>} />
            <Route path="/order-confirmation"  element={<StoreLayout><OrderConfirmationPage /></StoreLayout>} />
            <Route path="/orders"              element={<StoreLayout><OrdersPage /></StoreLayout>} />
            <Route path="/profile"             element={<StoreLayout><ProfilePage /></StoreLayout>} />

            {/* Customer auth — no navbar/footer needed */}
            <Route path="/login"               element={<CustomerLoginPage />} />
            <Route path="/signup"              element={<CustomerSignupPage />} />
            <Route path="/forgot-password"     element={<ForgotPasswordPage accountType="customer" />} />
            <Route path="/reset-password"      element={<PasswordResetRoute />} />
            <Route path="/admin/forgot-password" element={<StaffDomainOnly><ForgotPasswordPage accountType="admin" /></StaffDomainOnly>} />

            {/* 404 */}
            <Route path="*"                    element={<NotFoundPage />} />

            {/* Admin routes */}
            <Route path="/admin/login"         element={<StaffDomainOnly><AdminLoginPage /></StaffDomainOnly>} />
            <Route path="/admin"               element={<StaffDomainOnly><AdminProtectedRoute><AdminLayout /></AdminProtectedRoute></StaffDomainOnly>}>
              <Route index                     element={<AdminHome />} />
              <Route path="dashboard"         element={<AdminOnlyRoute><AdminDashboardPage /></AdminOnlyRoute>} />
              <Route path="products"           element={<AdminOnlyRoute><AdminProductsPage /></AdminOnlyRoute>} />
              <Route path="categories"         element={<AdminOnlyRoute><AdminCategoriesPage /></AdminOnlyRoute>} />
              <Route path="orders"             element={<AdminOrdersPage />} />
              <Route path="account"            element={<AdminAccountPage />} />
              <Route path="payment-methods"    element={<AdminOnlyRoute><AdminPaymentMethodsPage /></AdminOnlyRoute>} />
              <Route path="staff"              element={<AdminOnlyRoute><AdminStaffPage /></AdminOnlyRoute>} />
            </Route>
          </Routes>
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}
