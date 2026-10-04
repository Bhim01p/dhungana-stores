import { FormEvent, useEffect, useState } from "react";
import { adminAuthApi } from "../api/adminAuth";
import { useAuth } from "../contexts/AuthContext";
import { uploadImage } from "../api/imageUpload";

export default function AdminAccountPage() {
  const { token, user, logout, syncUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.imageUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!token) return;
    adminAuthApi.me(token).then(me => { setRecoveryEmail(me.recoveryEmail ?? ""); setProfilePhoto(me.imageUrl); syncUser(me); }).catch(() => undefined);
  }, [token]);

  const handleProfilePhoto = async (file?: File) => {
    if (!file || !token) return;
    setPhotoUploading(true); setPhotoNotice(null); setError(null);
    try {
      const imageUrl = await uploadImage(file, "/api/auth/me/image-signature", token);
      const updated = await adminAuthApi.updateProfilePhoto(token, imageUrl);
      setProfilePhoto(updated.imageUrl); syncUser(updated, updated.token); setPhotoNotice("Profile photo updated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update your photo."); }
    finally { setPhotoUploading(false); }
  };

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
      <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700 flex items-center justify-center">
          {profilePhoto ? <img src={profilePhoto} alt="Your profile" className="h-full w-full object-cover" /> : user?.username[0]?.toUpperCase()}
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Profile photo</h2>
          <p className="text-sm text-gray-500">Choose a photo to identify your staff account in the admin desk.</p>
          <label className="btn-secondary inline-flex min-h-10 cursor-pointer items-center px-4 py-2 text-sm">
            {photoUploading ? "Uploading…" : profilePhoto ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" className="sr-only" disabled={photoUploading} onChange={event => { void handleProfilePhoto(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
          </label>
          {photoNotice && <p role="status" className="text-sm text-green-700">{photoNotice}</p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </section>
      {user?.role === "ADMIN" ? <form onSubmit={submit} className="card p-6 space-y-4">
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
      </form> : <section className="card p-6"><h2 className="text-lg font-semibold">Password access</h2><p className="mt-2 text-sm text-gray-600">Only the main admin can change staff passwords. Ask them to set a new password if you cannot sign in.</p></section>}
      {user?.role === "ADMIN" && <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Password recovery email</h2>
        <p className="text-sm text-gray-500">Sign-in codes and password reset links go to the owner email set for this store.</p>
        <input type="email" className="input disabled:bg-gray-100" value={recoveryEmail} disabled readOnly />
      </section>}
    </div>
  );
}
