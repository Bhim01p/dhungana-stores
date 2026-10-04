import { apiClient } from "./client";
import type { Order, CreateOrderPayload } from "../types";
import { readApiResponse } from "./readResponse";

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
    return readApiResponse<Order>(res, "/orders");
  },

  getByOrderNumber: (lookupToken: string) =>
    apiClient.post<Order>("/orders/guest-lookup", { lookupToken }),
};
