export function getStaffPortalUrl(): URL | null {
  const configuredUrl = import.meta.env.VITE_STAFF_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function isStaffPortalHost(): boolean {
  const staffPortalUrl = getStaffPortalUrl();
  return Boolean(staffPortalUrl && staffPortalUrl.host === window.location.host);
}

export function getStorefrontUrl(): string {
  const staffPortalUrl = getStaffPortalUrl();
  if (!staffPortalUrl || !staffPortalUrl.hostname.startsWith('staff.')) return '/';

  staffPortalUrl.hostname = staffPortalUrl.hostname.slice('staff.'.length);
  return staffPortalUrl.origin;
}
