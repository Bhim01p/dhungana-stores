import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import BrandLogo from "../components/BrandLogo";

export default function CustomerSignupPage() {
  const { customerSignup, customerError, isCustomerLoading } = useCustomerAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.password !== form.confirm) { setFormError(t("Passwords do not match.")); return; }
    if (form.password.length < 12) { setFormError(t("Password must be at least 12 characters.")); return; }
    const phone = form.phone.replace(/\D/g, "").replace(/^\+977/, "");
    if (!/^(97|98)\d{8}$/.test(phone)) { setFormError(t("Phone must start with 97 or 98 and be 10 digits.")); return; }
    try {
      await customerSignup(form.name, form.email, phone, form.password);
      navigate("/profile");
    } catch { /* error shown from context */ }
  };

  const error = formError || customerError;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-3 py-4 sm:px-4 sm:py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-4 sm:mb-8">
          <BrandLogo className="mx-auto mb-3 h-16 w-24 rounded-xl shadow-sm sm:mb-4 sm:h-20 sm:w-32" />
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setLanguage(language === "en" ? "ne" : "en")} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              {language === "en" ? "नेपाली" : "English"}
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t("Create Account")}</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{t("Track your orders and save your details")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Full Name *")}</label>
              <input required className="input" placeholder="Bishnu Prasad" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Email *")}</label>
              <input required type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Phone *")}</label>
              <input required className="input" placeholder="98xxxxxxxx" maxLength={10}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g,"").slice(0,10) })} />
              <p className="text-xs text-gray-400 mt-1">{t("10-digit Nepal number starting with 97 or 98")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Password *")}</label>
              <input required type="password" className="input" placeholder={t("At least 12 characters")} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Confirm Password *")}</label>
              <input required type="password" className="input" placeholder={t("Repeat password")} value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} />
            </div>
            <button type="submit" disabled={isCustomerLoading} className="btn-primary w-full min-h-11 py-2.5 sm:py-3 mt-2 disabled:opacity-60">
              {isCustomerLoading ? t("Creating account...") : t("Create Account")}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            {t("Already have an account?")}{" "}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t("Login")}</Link>
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            <Link to="/" className="text-gray-400 hover:text-brand-500">← {t("Back to store")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
