import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import BrandLogo from "../components/BrandLogo";

export default function CustomerLoginPage() {
  const { customerLogin, customerError, isCustomerLoading } = useCustomerAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/profile";

  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerLogin(form.email, form.password);
      navigate(from, { replace: true });
    } catch { /* error shown from context */ }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-3 py-5 sm:px-4 sm:py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-5 sm:mb-8">
          <BrandLogo className="mx-auto mb-3 h-16 w-24 rounded-xl shadow-sm sm:mb-4 sm:h-20 sm:w-32" />
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setLanguage(language === "en" ? "ne" : "en")} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              {language === "en" ? "नेपाली" : "English"}
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t("Welcome Back")}</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{t("Login to track your orders")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          {customerError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {customerError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Email")}</label>
              <input required type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Password")}</label>
              <input required type="password" className="input" placeholder={t("Your password")}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="text-right -mt-2"><Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">{t("Forgot your password?")}</Link></div>
            <button type="submit" disabled={isCustomerLoading}
              className="btn-primary w-full min-h-11 py-2.5 sm:py-3 mt-2 disabled:opacity-60">
              {isCustomerLoading ? t("Logging in...") : t("Login")}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4 sm:mt-6">
            {t("No account yet?")}{" "}
            <Link to="/signup" className="text-brand-600 font-semibold hover:underline">{t("Sign up")}</Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            <Link to="/" className="hover:text-brand-500">← {t("Back to store")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
