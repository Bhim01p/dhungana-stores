import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminStaffApi, StaffAccount, staffAccessAreas } from "../api/adminStaff";
import { useAuth } from "../contexts/AuthContext";
import { uploadImage } from "../api/imageUpload";

export default function AdminStaffPage() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [username, setUsername] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>(["ORDERS", "STORE_SALES", "CASH_DRAWER"]);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const accounts = await adminStaffApi.list(token);
      setStaff(accounts);
      setPermissionDrafts(Object.fromEntries(accounts.map(account => [account.id, account.permissions ?? []])));
      setError(null);
    }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load staff accounts."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createStaff = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      if (!imageUrl) { setError("Upload a profile photo for this staff member first."); return; }
      await adminStaffApi.create(token, { username: username.trim(), recoveryEmail: recoveryEmail.trim(), password, imageUrl, permissions });
      setUsername(""); setRecoveryEmail(""); setPassword(""); setImageUrl("");
      setPermissions(["ORDERS", "STORE_SALES", "CASH_DRAWER"]);
      setNotice("Staff account created. Give the staff member their username and temporary password privately.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create staff account."); }
    finally { setSaving(false); }
  };

  const savePermissions = async (account: StaffAccount) => {
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await adminStaffApi.setPermissions(token, account.id, permissionDrafts[account.id] ?? []);
      setNotice(`Access updated for ${account.username}. They need to sign in again for the change to take effect.`);
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update staff access."); }
  };

  const resetPassword = async (account: StaffAccount) => {
    if (!token) return;
    const nextPassword = passwordDrafts[account.id] ?? "";
    if (nextPassword.length < 12) { setError("New staff passwords must be at least 12 characters."); return; }
    setError(null); setNotice(null);
    try {
      const result = await adminStaffApi.resetPassword(token, account.id, nextPassword);
      setPasswordDrafts(current => ({ ...current, [account.id]: "" }));
      setNotice(`${result.message} Give it to the staff member privately.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reset this password."); }
  };

  const uploadStaffPhoto = async (file?: File) => {
    if (!file || !token) return;
    setPhotoUploading(true); setError(null);
    try { setImageUrl(await uploadImage(file, "/api/admin/uploads/image-signature", token, "profile")); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not upload this photo."); }
    finally { setPhotoUploading(false); }
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

  const deleteStaff = async (account: StaffAccount) => {
    if (!token || account.active) return;
    if (!window.confirm(`Permanently delete the staff login for “${account.username}”? This cannot be undone.`)) return;
    setError(null); setNotice(null);
    try {
      await adminStaffApi.delete(token, account.id);
      await refresh();
      setNotice("Staff account permanently deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the staff account."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff access</h1>
        <p className="mt-1 text-gray-600">Choose exactly which store areas each person can use. Every staff account still needs the email code at sign-in. Only the main admin can change a staff password or access these staff settings.</p>
      </div>

      <form onSubmit={createStaff} className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add staff member</h2>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-800">{imageUrl ? <img src={imageUrl} alt="New staff profile" className="h-full w-full object-cover" /> : "?"}</div>
          <div><p className="text-sm font-medium text-gray-700">Profile photo <span className="text-red-700">required</span></p><label className="btn-secondary mt-2 inline-flex min-h-10 cursor-pointer items-center px-3 py-2 text-sm">{photoUploading ? "Uploading…" : imageUrl ? "Change photo" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" className="sr-only" disabled={photoUploading} onChange={event => { void uploadStaffPhoto(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label></div>
        </div>
        <label className="block text-sm font-medium text-gray-700">Username
          <input required minLength={3} maxLength={40} autoComplete="off" className="input mt-1" value={username} onChange={event => setUsername(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Recovery email
          <input required type="email" autoComplete="email" className="input mt-1" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Temporary password (at least 12 characters)
          <input required minLength={12} autoComplete="new-password" type="password" className="input mt-1" value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        <fieldset className="rounded-xl border border-gray-200 p-4">
          <legend className="px-1 text-sm font-semibold text-gray-800">Give access to</legend>
          <div className="mb-2 flex gap-3 text-xs"><button type="button" onClick={() => setPermissions(staffAccessAreas.map(area => area.id))} className="font-semibold text-brand-700 hover:underline">Select all store areas</button><button type="button" onClick={() => setPermissions([])} className="font-semibold text-gray-600 hover:underline">Clear all</button></div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {staffAccessAreas.map(area => <label key={area.id} className="flex min-h-10 items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={permissions.includes(area.id)} onChange={event => setPermissions(current => event.target.checked ? [...current, area.id] : current.filter(value => value !== area.id))} />
              {area.label}
            </label>)}
          </div>
        </fieldset>
        <button className="btn-primary" type="submit" disabled={saving || photoUploading || !imageUrl}>{saving ? "Creating…" : "Create staff login"}</button>
      </form>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="card overflow-hidden">
        <h2 className="border-b px-6 py-4 text-lg font-semibold">Staff accounts</h2>
        {loading ? <p className="p-6 text-gray-500">Loading staff…</p> : staff.length === 0 ? <p className="p-6 text-gray-500">No staff accounts yet.</p> : (
          <ul className="divide-y divide-gray-100">
            {staff.map(account => (
              <li key={account.id} className="space-y-3 p-4 md:px-6">
                <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-800">{account.imageUrl ? <img src={account.imageUrl} alt="" className="h-full w-full object-cover" /> : account.username[0]?.toUpperCase()}</div><div className="min-w-0"><p className="font-medium text-gray-900">{account.username}</p><p className="truncate text-sm text-gray-500">{account.recoveryEmail} · {account.active ? "Access enabled" : "Access disabled"}</p></div></div>
                <div className="flex shrink-0 items-center gap-4">
                  <button type="button" onClick={() => void toggleActive(account)} className={account.active ? "text-sm font-medium text-red-600 hover:text-red-800" : "text-sm font-medium text-green-700 hover:text-green-900"}>
                    {account.active ? "Disable access" : "Enable access"}
                  </button>
                  {!account.active && <button type="button" onClick={() => void deleteStaff(account)} className="text-sm font-semibold text-red-700 hover:text-red-900">Delete</button>}
                </div>
                </div>
                <details className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-800">Manage access and password</summary>
                  <div className="mt-3 space-y-4">
                    <fieldset><legend className="text-sm font-semibold text-gray-800">Allowed areas</legend><div className="mb-2 mt-1 flex gap-3 text-xs"><button type="button" onClick={() => setPermissionDrafts(current => ({ ...current, [account.id]: staffAccessAreas.map(area => area.id) }))} className="font-semibold text-brand-700 hover:underline">Select all store areas</button><button type="button" onClick={() => setPermissionDrafts(current => ({ ...current, [account.id]: [] }))} className="font-semibold text-gray-600 hover:underline">Clear all</button></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{staffAccessAreas.map(area => <label key={area.id} className="flex min-h-9 items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={(permissionDrafts[account.id] ?? []).includes(area.id)} onChange={event => setPermissionDrafts(current => { const values = current[account.id] ?? []; return { ...current, [account.id]: event.target.checked ? [...values, area.id] : values.filter(value => value !== area.id) }; })} />{area.label}</label>)}</div><button type="button" onClick={() => void savePermissions(account)} className="btn-primary mt-3">Save access</button></fieldset>
                    <form onSubmit={event => { event.preventDefault(); void resetPassword(account); }} className="flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium text-gray-700">Set a new password<input required minLength={12} maxLength={200} type="password" autoComplete="new-password" className="input mt-1" value={passwordDrafts[account.id] ?? ""} onChange={event => setPasswordDrafts(current => ({ ...current, [account.id]: event.target.value }))} /></label><button type="submit" className="btn-secondary">Change password</button></form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
