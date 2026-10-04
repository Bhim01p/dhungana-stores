import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { customersApi } from "../api/customers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import type { CustomerUser } from "../types";
import { uploadImage } from "../api/imageUpload";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { customer, customerToken, customerLogout, syncCustomer, isCustomerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Change password state — separate section
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwError, setPwError]     = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isCustomerLoading && !customer) navigate("/login", { state: { from: "/profile" } });
  }, [customer, isCustomerLoading, navigate]);

  useEffect(() => {
    if (!customerToken) return;
    customersApi.getMe(customerToken)
      .then(data => { setProfile(data); setName(data.name); syncCustomer(data); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerToken]);

  // ── Save name ──────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!customerToken || !profile) return;
    if (!name.trim()) { setSaveError(t("Name cannot be empty.")); return; }
    setSaving(true); setSaveError(null); setSuccessMsg(null);
    try {
      const updated = await customersApi.updateMe(customerToken, { name: name.trim() });
      setProfile(updated);
      syncCustomer(updated);
      setEditing(false);
      setSuccessMsg(t("Name updated successfully!"));
    } catch (err: any) {
      setSaveError(t(err.message ?? "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePhoto = async (file?: File) => {
    if (!file || !customerToken) return;
    setPhotoUploading(true);
    setSaveError(null);
    setSuccessMsg(null);
    try {
      const imageUrl = await uploadImage(file, "/api/customers/me/image-signature", customerToken);
      const updated = await customersApi.updateMe(customerToken, { imageUrl });
      setProfile(updated);
      syncCustomer(updated);
      setSuccessMsg(t("Profile photo updated."));
    } catch (err) {
      setSaveError(t(err instanceof Error ? err.message : "Could not update your profile photo."));
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!customerToken) return;
    setPwError(null); setPwSuccess(null);
    if (!pwForm.current)        { setPwError(t("Please enter your current password.")); return; }
    if (!pwForm.next)           { setPwError(t("Please enter a new password.")); return; }
    if (pwForm.next.length < 12) { setPwError(t("New password must be at least 12 characters.")); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError(t("New passwords do not match.")); return; }
    if (pwForm.next === pwForm.current) { setPwError(t("New password must be different from current password.")); return; }
    setPwSaving(true);
    try {
      const res = await customersApi.changePassword(customerToken, {
        currentPassword: pwForm.current,
        newPassword:     pwForm.next,
        confirmPassword: pwForm.confirm,
      });
      setPwSuccess(t(res.message));
      setPwForm({ current: "", next: "", confirm: "" });
      setChangingPw(false);
    } catch (err: any) {
      setPwError(t(err.message ?? "Failed to change password."));
    } finally {
      setPwSaving(false);
    }
  };

  if (isCustomerLoading || loading) return <LoadingSpinner message={t("Loading profile...")} />;
  if (error) return <ErrorMessage message={t(error)} />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("My Profile")}</h1>
        <button
          onClick={() => { customerLogout(); navigate("/"); }}
          className="btn-secondary text-sm px-4 py-2 text-red-500 border-red-200 hover:bg-red-50"
        >
          🚪 {t("Logout")}
        </button>
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Avatar row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
            {profile.imageUrl ? <img src={profile.imageUrl} alt={t("Profile photo for")} className="h-full w-full object-cover" /> : profile.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            {profile.createdAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t("Member since")} {new Date(profile.createdAt).toLocaleDateString(language === "ne" ? "ne-NP" : undefined)}
              </p>
            )}
            <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
              {photoUploading ? t("Uploading…") : profile.imageUrl ? t("Change photo") : t("Upload profile photo")}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" className="sr-only" disabled={photoUploading} onChange={event => { void handleProfilePhoto(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
            </label>
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">✅ {successMsg}</div>
        )}
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{saveError}</div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("Full Name")}</p>
            {editing ? (
              <div className="flex gap-2">
                <input className="input flex-1" value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveName()} />
                <button onClick={handleSaveName} disabled={saving}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                  {saving ? t("Saving...") : t("Save")}
                </button>
                <button onClick={() => { setEditing(false); setName(profile.name); setSaveError(null); }}
                  className="btn-secondary px-3 py-2 text-sm">
                  {t("Cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-medium">{profile.name}</p>
                <button onClick={() => { setEditing(true); setSuccessMsg(null); }}
                  className="text-xs text-brand-500 hover:text-brand-700 font-semibold">
                  ✏️ {t("Edit")}
                </button>
              </div>
            )}
          </div>

          {/* Email — read only */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("Email")}</p>
            <p className="text-gray-900 font-medium">{profile.email}</p>
          </div>

          {/* Phone — read only */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("Phone Number")}</p>
            <p className="text-gray-900 font-medium">{profile.phone}</p>
          </div>
        </div>
      </div>

      {/* ── Change Password card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-gray-900">{t("Password")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("Keep your account secure")}</p>
          </div>
          {!changingPw && (
            <button
              onClick={() => { setChangingPw(true); setPwError(null); setPwSuccess(null); }}
              className="btn-secondary text-sm px-4 py-2"
            >
              🔑 {t("Change Password")}
            </button>
          )}
        </div>

        {pwSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">✅ {pwSuccess}</div>
        )}

        {changingPw && (
          <div className="space-y-4">
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{pwError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Current Password")}</label>
              <input type="password" className="input w-full" placeholder={t("Enter your current password")}
                value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("New Password")}</label>
              <input type="password" className="input w-full" placeholder={t("At least 12 characters")}
                value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("Confirm New Password")}</label>
              <input type="password" className="input w-full" placeholder={t("Repeat new password")}
                value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleChangePassword} disabled={pwSaving}
                className="btn-primary px-6 py-2 text-sm disabled:opacity-60">
                {pwSaving ? t("Updating...") : t("Update Password")}
              </button>
              <button
                onClick={() => { setChangingPw(false); setPwForm({ current: "", next: "", confirm: "" }); setPwError(null); }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick link ── */}
      <a href="/orders" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-5 hover:border-brand-300 transition-colors group">
        <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 group-hover:bg-brand-100 text-xl">
          📦
        </div>
        <div>
          <p className="font-semibold text-gray-900">{t("My Orders")}</p>
          <p className="text-xs text-gray-500">{t("View and track all your orders →")}</p>
        </div>
      </a>

    </div>
  );
}
