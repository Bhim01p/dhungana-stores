import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Link } from "react-router-dom";
import { getStorefrontUrl } from "../utils/siteUrls";

export default function AdminLoginPage() {
  const { login, error, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login(username, password); navigate("/admin"); } catch { /* Error set by useAuth */ }
  };

  if (isLoading) return <LoadingSpinner message="Loading..." />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg"><span className="text-2xl font-bold text-white">B</span></div><h1 className="text-3xl font-bold text-gray-900 mb-2">Staff &amp; Admin Login</h1><p className="text-gray-500">Bishnu &amp; Dhungana Stores Dashboard</p></div>
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required /></div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-60">{isLoading ? "Logging in..." : "Login"}</button>
          </form>
          <p className="mt-4 text-center text-sm"><Link to="/admin/forgot-password" className="text-brand-600 hover:underline">Forgot your password?</Link></p>
          <div className="mt-6 border-t pt-6 text-center"><a href={getStorefrontUrl()} className="text-sm text-brand-500 hover:text-brand-600">← Back to store</a></div>
        </div>
      </div>
    </div>
  );
}
