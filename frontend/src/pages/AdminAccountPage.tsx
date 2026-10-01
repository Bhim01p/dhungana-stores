import { FormEvent, useEffect, useState } from "react";
import { adminAuthApi } from "../api/adminAuth";
import { useAuth } from "../contexts/AuthContext";

export default function AdminAccountPage() {
  const { token, user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  useEffect(() => {
    if (!token) return;
    adminAuthApi.me(token).then(me => setRecoveryEmail(me.recoveryEmail ?? "")).catch(() => undefined);
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError("The new passwords do not match."); return; }
    if (!token) return;
    setSaving(true);
    try {
      await adminAuthApi.changePassword(token, { currentPassword, newPassword });
      logout();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update password."); }
    finally { setSaving(false); }
  };

  const saveRecoveryEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setEmailError(null); setEmailNotice(null);
    try {
      await adminAuthApi.updateRecoveryEmail(token, recoveryEmail.trim());
      setEmailNotice("Recovery email saved. Use an address you can access.");
    } catch (err) { setEmailError(err instanceof Error ? err.message : "Could not save recovery email."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My account</h1><p className="mt-1 text-gray-500">Signed in as {user?.username} ({user?.role.toLowerCase()}).</p></div>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Change password</h2>
        <label className="block text-sm font-medium text-gray-700">Current password
          <input required type="password" autoComplete="current-password" className="input mt-1" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">New password (at least 12 characters)
          <input required minLength={12} type="password" autoComplete="new-password" className="input mt-1" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Confirm new password
          <input required minLength={12} type="password" autoComplete="new-password" className="input mt-1" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Updating…" : "Update password"}</button>
        <p className="text-sm text-gray-500">You’ll be signed out after the change and can sign back in using the new password.</p>
      </form>
      {user?.role === "ADMIN" && <form onSubmit={saveRecoveryEmail} className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Password recovery email</h2>
        <p className="text-sm text-gray-500">Use an inbox you control. A reset link will be sent here if you forget your admin password.</p>
        <input required type="email" className="input" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} />
        {emailError && <p role="alert" className="text-sm text-red-700">{emailError}</p>}
        {emailNotice && <p role="status" className="text-sm text-green-700">{emailNotice}</p>}
        <button className="btn-primary" type="submit">Save recovery email</button>
      </form>}
    </div>
  );
}
