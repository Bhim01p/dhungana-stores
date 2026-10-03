import { adminClient } from "./adminClient";

export interface StaffAccount {
  id: string;
  username: string;
  recoveryEmail: string | null;
  role: "STAFF";
  active: boolean;
  createdAt: string;
}

export const adminStaffApi = {
  list: (token: string) => adminClient.get<StaffAccount[]>("/admin/staff", token),
  create: (token: string, data: { username: string; recoveryEmail: string; password: string }) =>
    adminClient.post<StaffAccount>("/admin/staff", data, token),
  setActive: (token: string, id: string, active: boolean) =>
    adminClient.patch<StaffAccount>(`/admin/staff/${id}`, { active }, token),
  delete: (token: string, id: string) =>
    adminClient.delete<void>(`/admin/staff/${id}`, token),
};
