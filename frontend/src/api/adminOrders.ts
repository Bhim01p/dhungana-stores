import { adminClient } from "./adminClient";
import type { PaginatedResponse, Order, OrderItem } from "../types";
import type { OrderStatus, PaymentStatus } from "../types";

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminOrdersApi = {
  getAll: (token: string, filters?: OrderFilters) => {
    const qs = new URLSearchParams();
    if (filters?.status) qs.set("status", filters.status);
    if (filters?.paymentStatus) qs.set("paymentStatus", filters.paymentStatus);
    if (filters?.search) qs.set("search", filters.search);
    if (filters?.page) qs.set("page", String(filters.page));
    if (filters?.limit) qs.set("limit", String(filters.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return adminClient.get<PaginatedResponse<Order>>(`/admin/orders${query}`, token);
  },
  getOne: (token: string, id: string) =>
    adminClient.get<Order & { orderItems: OrderItem[] }>(`/admin/orders/${id}`, token),
  updateStatus: (token: string, id: string, orderStatus: OrderStatus) =>
    adminClient.patch<Order>(`/admin/orders/${id}/status`, { orderStatus }, token),
  updatePaymentStatus: (token: string, id: string, paymentStatus: PaymentStatus) =>
    adminClient.patch<Order>(`/admin/orders/${id}/payment`, { paymentStatus }, token),
};