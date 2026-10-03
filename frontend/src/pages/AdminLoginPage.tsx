import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { Link } from "react-router-dom";
import { getStorefrontUrl } from "../utils/siteUrls";

export default function AdminLoginPage() {
  const { login, verifyLoginCode, error, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<{ challengeId: string; emailHint: string } | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (challenge) {
        await verifyLoginCode(challenge.challengeId, code.trim());
        navigate("/staff");
      } else {
        const next = await login(username, password);
        setChallenge({ challengeId: next.challengeId, emailHint: next.emailHint });
      }
    } catch { /* Error is provided by AuthContext */ }
    finally { setSubmitting(false); }
  };

  if (isLoading) return <LoadingSpinner message="Loading..." />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg"><span className="text-2xl font-bold text-white">B</span></div><h1 className="text-3xl font-bold text-gray-900 mb-2">Staff &amp; Admin Login</h1><p className="text-gray-500">Bishnu &amp; Dhungana Stores Dashboard</p></div>
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}
            {!challenge ? <>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="input" required /></div>
              <button type="submit" disabled={isLoading || submitting} className="btn-primary w-full py-3 disabled:opacity-60">{submitting ? "Sending code…" : "Continue"}</button>
            </> : <>
              <p className="text-sm text-gray-600">We sent a 6-digit sign-in code to <strong>{challenge.emailHint}</strong>. It expires in 5 minutes.</p>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email code</label><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="input tracking-[0.3em]" required /></div>
              <button type="submit" disabled={submitting || code.length !== 6} className="btn-primary w-full py-3 disabled:opacity-60">{submitting ? "Verifying…" : "Verify and sign in"}</button>
              <p className="text-center text-xs text-gray-500">Didn’t receive it? Go back and continue again to send a fresh code.</p>
              <button type="button" onClick={() => { setChallenge(null); setCode(""); }} className="w-full text-sm text-gray-600 hover:text-brand-600">Back to username and password</button>
            </>}
          </form>
          {!challenge && <p className="mt-4 text-center text-sm"><Link to="/staff-recovery" className="text-brand-600 hover:underline">Forgot your password?</Link></p>}
          <div className="mt-6 border-t pt-6 text-center"><a href={getStorefrontUrl()} className="text-sm text-brand-500 hover:text-brand-600">← Back to store</a></div>
        </div>
      </div>
    </div>
  );
}
