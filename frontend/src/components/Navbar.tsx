import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import BrandLogo from "./BrandLogo";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { itemCount, openCart } = useCart();
  const { customer, customerLogout } = useCustomerAuth();
  const { language, setLanguage, t } = useLanguage();

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
          <Link to="/" className="flex shrink-0 items-center rounded-lg bg-white" aria-label="Bishnu & Dhungana Stores home">
            <BrandLogo alt="" className="h-12 w-[72px] sm:h-14 sm:w-[84px]" />
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} role="search" className="hidden min-w-0 max-w-xs flex-1 md:flex lg:max-w-sm">
            <div className="flex w-full items-center rounded-full border border-stone-200 bg-stone-50 p-1 shadow-sm transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
              <svg className="ml-3 h-4 w-4 shrink-0 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m16 16 4 4" /></svg>
              <input type="search" value={searchValue} onChange={e => setSearchValue(e.target.value)}
                placeholder={t("Find something in the store")} aria-label={t("Search products")}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0" />
              {searchValue && <button type="button" onClick={() => setSearchValue("")} aria-label="Clear search" className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700">×</button>}
              <button type="submit" aria-label={t("Search")} className="rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-700">{t("Search")}</button>
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>{t("Home")}</NavLink>
            <NavLink to="/products" className={linkClass}>{t("Shop")}</NavLink>
            <NavLink to="/orders" className={linkClass}>{t("Orders")}</NavLink>
            <NavLink to="/favorites" className={({ isActive }) => `${linkClass({ isActive })} px-2`} title={t("Favorites")} aria-label={t("Favorites")}><span className="text-rose-600" aria-hidden="true">♥</span><span className="ml-1 hidden xl:inline">{t("Favorites")}</span></NavLink>
            <NavLink to="/help" className={linkClass}>{t("Help")}</NavLink>
            <button type="button" onClick={() => setLanguage(language === "en" ? "ne" : "en")} className="ml-1 rounded-lg border border-stone-200 px-2.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50" aria-label="Change language">
              {language === "en" ? "नेपाली" : "English"}
            </button>

            {/* Account button — direct link, no dropdown */}
            {customer ? (
              <Link to="/profile" className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <div className="h-7 w-7 overflow-hidden rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
                  {customer.imageUrl ? <img src={customer.imageUrl} alt="" className="h-full w-full object-cover" /> : customer.name[0].toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate">{customer.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link to="/login" className="ml-1 btn-secondary text-sm py-1.5 px-3">
                {t("Login")}
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
              <Link to="/profile" className="h-8 w-8 overflow-hidden bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm" aria-label="My profile">
                {customer.imageUrl ? <img src={customer.imageUrl} alt="" className="h-full w-full object-cover" /> : customer.name[0].toUpperCase()}
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
            <form onSubmit={handleSearch} role="search">
              <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-1.5 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
                <svg className="ml-2 h-5 w-5 shrink-0 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m16 16 4 4" /></svg>
                <input type="search" value={searchValue} onChange={e => setSearchValue(e.target.value)}
                  placeholder={t("Search products")} aria-label={t("Search products")}
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-sm focus:outline-none focus:ring-0" />
                <button type="submit" aria-label={t("Search products")} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700">{t("Search")}</button>
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>🏠 {t("Home")}</NavLink>
              <NavLink to="/products" className={linkClass} onClick={() => setMobileOpen(false)}>🛍️ {t("Shop products")}</NavLink>
              <NavLink to="/orders" className={linkClass} onClick={() => setMobileOpen(false)}>📦 {t("Orders")}</NavLink>
              <NavLink to="/favorites" className={linkClass} onClick={() => setMobileOpen(false)}><span className="text-rose-600" aria-hidden="true">♥</span> {t("Favorites")}</NavLink>
              <NavLink to="/help" className={linkClass} onClick={() => setMobileOpen(false)}>💬 {t("Help & feedback")}</NavLink>
              <button type="button" onClick={() => setLanguage(language === "en" ? "ne" : "en")} className="mx-3 flex min-h-10 items-center justify-between rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700">
                <span>{language === "en" ? "भाषा / Language" : "भाषा / Language"}</span><span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">{language === "en" ? "नेपाली" : "English"}</span>
              </button>
              {customer ? (
                <>
                  <NavLink to="/profile" className={linkClass} onClick={() => setMobileOpen(false)}>👤 {t("Profile")}</NavLink>
                  <button onClick={() => { customerLogout(); setMobileOpen(false); }}
                    className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
                    🚪 {t("Logout")}
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={linkClass} onClick={() => setMobileOpen(false)}>🔑 {t("Login")} / Sign Up</NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
