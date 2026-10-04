import type { Order, CustomerUser, Product } from "../types";
import { readApiResponse } from "./readResponse";

const BASE = "/api/customers";

async function authFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options?.headers },
    ...options,
  });
  return readApiResponse<T>(res, path);
}

async function publicFetch<T>(path: string, options: RequestInit): Promise<T> {
  return readApiResponse<T>(await fetch(`${BASE}${path}`, options), path);
}

export const customersApi = {
  requestPasswordReset: (email: string) => publicFetch<{ message: string }>("/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => publicFetch<{ message: string }>("/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }),
  getMe:    (token: string) => authFetch<CustomerUser>("/me", token),
  getOrders: (token: string) => authFetch<Order[]>("/orders", token),
  getFavorites: (token: string) => authFetch<Product[]>("/favorites", token),
  addFavorite: (token: string, productId: string) => authFetch<{ productId: string }>(`/favorites/${encodeURIComponent(productId)}`, token, { method: "POST" }),
  removeFavorite: (token: string, productId: string) => authFetch<{ productId: string }>(`/favorites/${encodeURIComponent(productId)}`, token, { method: "DELETE" }),
  reorder: (token: string, orderId: string) => authFetch<{ items: Array<{ product: Product; quantity: number; limited: boolean }>; unavailable: string[] }>(`/orders/${encodeURIComponent(orderId)}/reorder`, token, { method: "POST" }),
  updateMe: (token: string, data: { name?: string; phone?: string; imageUrl?: string | null }) =>
    authFetch<CustomerUser>("/me", token, { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (token: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    authFetch<{ message: string }>("/change-password", token, { method: "POST", body: JSON.stringify(data) }),
};
