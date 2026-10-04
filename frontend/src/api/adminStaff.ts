import { adminClient } from "./adminClient";

export interface StaffAccount {
  id: string;
  username: string;
  recoveryEmail: string | null;
  imageUrl: string | null;
  role: "STAFF";
  permissions: string[];
  active: boolean;
  createdAt: string;
}

export const adminStaffApi = {
  list: (token: string) => adminClient.get<StaffAccount[]>("/admin/staff", token),
  create: (token: string, data: { username: string; recoveryEmail: string; password: string; imageUrl: string; permissions: string[] }) =>
    adminClient.post<StaffAccount>("/admin/staff", data, token),
  setActive: (token: string, id: string, active: boolean) =>
    adminClient.patch<StaffAccount>(`/admin/staff/${id}`, { active }, token),
  setPermissions: (token: string, id: string, permissions: string[]) =>
    adminClient.patch<StaffAccount>(`/admin/staff/${id}/permissions`, { permissions }, token),
  resetPassword: (token: string, id: string, password: string) =>
    adminClient.patch<{ message: string }>(`/admin/staff/${id}/password`, { password }, token),
  delete: (token: string, id: string) =>
    adminClient.delete<void>(`/admin/staff/${id}`, token),
};

export const staffAccessAreas = [
  { id: "DASHBOARD", label: "Dashboard & reports" },
  { id: "PRODUCTS", label: "Products & product photos" },
  { id: "INVENTORY", label: "Inventory & stock changes" },
  { id: "CATEGORIES", label: "Categories" },
  { id: "ORDERS", label: "Online orders & payment status" },
  { id: "STORE_SALES", label: "In-store bills & sales history" },
  { id: "CASH_DRAWER", label: "Cash drawer close" },
  { id: "FULFILLMENT", label: "Delivery areas & time slots" },
  { id: "MESSAGES", label: "Help & customer feedback" },
  { id: "PAYMENT_METHODS", label: "Payment method settings" },
  { id: "EXPORTS", label: "Download store reports" },
  { id: "ACTIVITY", label: "Activity history" },
] as const;
