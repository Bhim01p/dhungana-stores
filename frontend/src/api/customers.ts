import type { Order, CustomerUser } from "../types";

const BASE = "/api/customers";

async function authFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

export const customersApi = {
  requestPasswordReset: (email: string) => fetch(`${BASE}/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Request failed"); return d as { message: string }; }),
  resetPassword: (token: string, password: string) => fetch(`${BASE}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error ?? "Request failed"); return d as { message: string }; }),
  getMe:    (token: string) => authFetch<CustomerUser>("/me", token),
  getOrders: (token: string) => authFetch<Order[]>("/orders", token),
  updateMe: (token: string, data: { name?: string; phone?: string }) =>
    authFetch<CustomerUser>("/me", token, { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (token: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    authFetch<{ message: string }>("/change-password", token, { method: "POST", body: JSON.stringify(data) }),
};
