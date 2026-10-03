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
      {user?.role === "ADMIN" && <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Password recovery email</h2>
        <p className="text-sm text-gray-500">Sign-in codes and password reset links go to the owner email set for this store.</p>
        <input type="email" className="input disabled:bg-gray-100" value={recoveryEmail} disabled readOnly />
      </section>}
    </div>
  );
}
