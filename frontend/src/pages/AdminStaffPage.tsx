import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminStaffApi, StaffAccount } from "../api/adminStaff";
import { useAuth } from "../contexts/AuthContext";

export default function AdminStaffPage() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [username, setUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setStaff(await adminStaffApi.list(token)); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load staff accounts."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createStaff = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      await adminStaffApi.create(token, { username: username.trim(), recoveryEmail: recoveryEmail.trim(), password });
      setUsername(""); setRecoveryEmail(""); setPassword("");
      setNotice("Staff account created. Give the staff member their username and temporary password privately.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create staff account."); }
    finally { setSaving(false); }
  };

  const toggleActive = async (account: StaffAccount) => {
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await adminStaffApi.setActive(token, account.id, !account.active);
      await refresh();
      setNotice(account.active ? "Staff access turned off." : "Staff access turned on.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update staff access."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff access</h1>
        <p className="mt-1 text-gray-500">Create a separate login for each staff member. Staff can view and update orders, but cannot manage products, payments, or staff accounts. Staff can change their own password under My Account.</p>
      </div>

      <form onSubmit={createStaff} className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add staff member</h2>
        <label className="block text-sm font-medium text-gray-700">Username
          <input required minLength={3} maxLength={40} autoComplete="off" className="input mt-1" value={username} onChange={event => setUsername(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Recovery email
          <input required type="email" autoComplete="email" className="input mt-1" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Temporary password (at least 12 characters)
          <input required minLength={12} autoComplete="new-password" type="password" className="input mt-1" value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Creating…" : "Create staff login"}</button>
      </form>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="card overflow-hidden">
        <h2 className="border-b px-6 py-4 text-lg font-semibold">Staff accounts</h2>
        {loading ? <p className="p-6 text-gray-500">Loading staff…</p> : staff.length === 0 ? <p className="p-6 text-gray-500">No staff accounts yet.</p> : (
          <ul className="divide-y divide-gray-100">
            {staff.map(account => (
              <li key={account.id} className="flex items-center justify-between gap-4 p-4 md:px-6">
                <div><p className="font-medium text-gray-900">{account.username}</p><p className="text-sm text-gray-500">{account.recoveryEmail} · {account.active ? "Access enabled" : "Access disabled"}</p></div>
                <button type="button" onClick={() => void toggleActive(account)} className={account.active ? "text-sm font-medium text-red-600 hover:text-red-800" : "text-sm font-medium text-green-700 hover:text-green-900"}>
                  {account.active ? "Disable access" : "Enable access"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
