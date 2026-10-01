import { adminClient } from "./adminClient";
import type { PaymentMethod } from "../types";

export const adminPaymentMethodsApi = {
  getAll: (token: string) =>
    adminClient.get<PaymentMethod[]>("/admin/payment-methods", token),

  create: (token: string, data: {
    name: string; qrImageUrl: string;
    accountInfo?: string; active?: boolean; sortOrder?: number;
  }) => adminClient.post<PaymentMethod>("/admin/payment-methods", data, token),

  update: (token: string, id: string, data: {
    name?: string; qrImageUrl?: string;
    accountInfo?: string; active?: boolean; sortOrder?: number;
  }) => adminClient.patch<PaymentMethod>(`/admin/payment-methods/${id}`, data, token),

  delete: (token: string, id: string) =>
    adminClient.delete<void>(`/admin/payment-methods/${id}`, token),
};