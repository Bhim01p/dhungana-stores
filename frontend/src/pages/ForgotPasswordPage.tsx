import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { customersApi } from "../api/customers";
import { adminAuthApi } from "../api/adminAuth";

export default function ForgotPasswordPage({ accountType }: { accountType: "customer" | "admin" }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = accountType === "admin";

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage(null); setError(null);
    try {
      const result = isAdmin ? await adminAuthApi.requestPasswordReset(email) : await customersApi.requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not request a reset link."); }
    finally { setLoading(false); }
  };

  return <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-3 py-5 sm:px-4 sm:py-12">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Forgot password?</h1>
      <p className="mt-2 mb-5 sm:mb-6 text-sm text-gray-600">{isAdmin ? "Enter the main admin owner email. Staff password resets are managed by the main admin." : "Enter the email address on your customer account. If it matches an active account, we’ll send a reset link."}</p>
      {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Email address
          <input required type="email" autoComplete="email" className="input mt-1" value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full min-h-11">{loading ? "Sending…" : "Send reset link"}</button>
      </form>
      <div className="mt-5 text-center"><Link to={isAdmin ? "/staff-login" : "/login"} className="text-sm text-brand-600 hover:underline">Back to sign in</Link></div>
    </div>
  </div>;
}
