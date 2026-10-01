import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";

export default function CustomerSignupPage() {
  const { customerSignup, customerError, isCustomerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.password !== form.confirm) { setFormError("Passwords do not match."); return; }
    if (form.password.length < 12) { setFormError("Password must be at least 12 characters."); return; }
    const phone = form.phone.replace(/\D/g, "").replace(/^\+977/, "");
    if (!/^(97|98)\d{8}$/.test(phone)) { setFormError("Phone must start with 97 or 98 and be 10 digits."); return; }
    try {
      await customerSignup(form.name, form.email, phone, form.password);
      navigate("/profile");
    } catch { /* error shown from context */ }
  };

  const error = formError || customerError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Track your orders and save your details</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required className="input" placeholder="Bishnu Prasad" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input required className="input" placeholder="98xxxxxxxx" maxLength={10}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g,"").slice(0,10) })} />
              <p className="text-xs text-gray-400 mt-1">10-digit Nepal number starting with 97 or 98</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input required type="password" className="input" placeholder="At least 12 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input required type="password" className="input" placeholder="Repeat password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} />
            </div>
            <button type="submit" disabled={isCustomerLoading} className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
              {isCustomerLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Login</Link>
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            <Link to="/" className="text-gray-400 hover:text-brand-500">← Back to store</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
