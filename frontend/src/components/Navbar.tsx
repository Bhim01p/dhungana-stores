import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { itemCount, openCart } = useCart();
  const { customer, customerLogout } = useCustomerAuth();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) { navigate(`/products?search=${encodeURIComponent(q)}`); setSearchValue(""); setMobileOpen(false); }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">Bishnu &amp; Dhungana</p>
              <p className="text-xs text-brand-500 leading-tight font-medium">Stores</p>
            </div>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🔍</span>
              <input type="search" value={searchValue} onChange={e => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50" />
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/products" className={linkClass}>Products</NavLink>
            <NavLink to="/categories" className={linkClass}>Categories</NavLink>
            <NavLink to="/orders" className={linkClass}>Orders</NavLink>

            {/* Account button — direct link, no dropdown */}
            {customer ? (
              <Link to="/profile" className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">
                  {customer.name[0].toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate">{customer.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link to="/login" className="ml-1 btn-secondary text-sm py-1.5 px-3">
                Login
              </Link>
            )}

            {/* Cart button */}
            <button onClick={openCart}
              className="relative ml-1 p-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
              aria-label={`Cart ${itemCount > 0 ? `(${itemCount})` : "(empty)"}`}>
              <span className="text-lg leading-none">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {customer ? (
              <Link to="/profile" className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm">
                {customer.name[0].toUpperCase()}
              </Link>
            ) : (
              <Link to="/login" className="text-xs text-brand-600 font-semibold px-2 py-1 border border-brand-300 rounded-lg">Login</Link>
            )}
            <button onClick={openCart} className="relative p-2 rounded-lg bg-brand-500 text-white" aria-label="Cart">
              <span className="text-lg">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileOpen(v => !v)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Menu">
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 pt-3 pb-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
                <input type="search" value={searchValue} onChange={e => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50" />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>🏠 Home</NavLink>
              <NavLink to="/products" className={linkClass} onClick={() => setMobileOpen(false)}>🛍️ Products</NavLink>
              <NavLink to="/categories" className={linkClass} onClick={() => setMobileOpen(false)}>📂 Categories</NavLink>
              <NavLink to="/orders" className={linkClass} onClick={() => setMobileOpen(false)}>📦 Orders</NavLink>
              {customer ? (
                <>
                  <NavLink to="/profile" className={linkClass} onClick={() => setMobileOpen(false)}>👤 Profile</NavLink>
                  <button onClick={() => { customerLogout(); setMobileOpen(false); }}
                    className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
                    🚪 Logout
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={linkClass} onClick={() => setMobileOpen(false)}>🔑 Login / Sign Up</NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
