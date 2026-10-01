import { apiClient } from "./client";
import type { Order, CreateOrderPayload } from "../types";

const BASE_URL = "/api";

export const ordersApi = {
  create: async (payload: CreateOrderPayload, token?: string | null) => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to place order.");
    return data as Order;
  },

  getByOrderNumber: (lookupToken: string) =>
    apiClient.post<Order>("/orders/guest-lookup", { lookupToken }),
};
