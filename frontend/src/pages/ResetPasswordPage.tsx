import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { customersApi } from "../api/customers";
import { adminAuthApi } from "../api/adminAuth";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const type = params.get("type");
  const token = params.get("token") ?? "";
  const validType = type === "admin" || type === "customer";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setMessage(null);
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setLoading(true);
    try {
      const result = type === "admin" ? await adminAuthApi.resetPassword(token, password) : await customersApi.resetPassword(token, password);
      setMessage(result.message); setPassword(""); setConfirm("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reset the password."); }
    finally { setLoading(false); }
  };

  const loginHref = type === "admin" ? "/staff-login" : "/login";
  return <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-3 py-5 sm:px-4 sm:py-12">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Set a new password</h1>
      <p className="mt-2 mb-6 text-sm text-gray-500">Choose at least 12 characters. Reset links expire after 30 minutes and can only be used once.</p>
      {!validType || !token ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">This reset link is incomplete. Request a new one from the sign-in page.</p> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">New password
          <input required minLength={12} type="password" autoComplete="new-password" className="input mt-1" value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Confirm password
          <input required minLength={12} type="password" autoComplete="new-password" className="input mt-1" value={confirm} onChange={event => setConfirm(event.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        {!message && <button type="submit" disabled={loading} className="btn-primary w-full min-h-11">{loading ? "Updating…" : "Reset password"}</button>}
      </form>}
      {message && <div className="mt-5 text-center"><Link to={loginHref} className="text-sm text-brand-600 hover:underline">Go to sign in</Link></div>}
    </div>
  </div>;
}
