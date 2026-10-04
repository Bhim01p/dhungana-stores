export type AdminExportKind = 'store-sales' | 'online-orders' | 'inventory' | 'snapshot';

export async function downloadAdminExport(token: string, kind: AdminExportKind) {
  const response = await fetch(`/api/admin/exports/${kind}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    let message = 'Could not create this export.';
    try { message = (await response.json()).error ?? message; } catch { /* Keep a readable fallback. */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = kind === 'snapshot' ? 'store-data-snapshot.json' : `${kind}.csv`;
  document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}
