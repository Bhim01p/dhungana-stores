import { adminClient } from "./adminClient";
import type { PaginatedResponse, Product } from "../types";
import type { Unit } from "../types";

export interface ProductFilters {
  active?: boolean;
  featured?: boolean;
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  lowStock?: boolean;
  missingImage?: boolean;
  page?: number;
  limit?: number;
}

export const adminProductsApi = {
  getAll: (token: string, filters?: ProductFilters) => {
    const qs = new URLSearchParams();
    if (filters?.active !== undefined) qs.set("active", String(filters.active));
    if (filters?.featured !== undefined) qs.set("featured", String(filters.featured));
    if (filters?.categorySlug) qs.set("category", filters.categorySlug);
    if (filters?.categoryId) qs.set("categoryId", filters.categoryId);
    if (filters?.search) qs.set("search", filters.search);
    if (filters?.lowStock) qs.set("lowStock", "true");
    if (filters?.missingImage) qs.set("missingImage", "true");
    if (filters?.page) qs.set("page", String(filters.page));
    if (filters?.limit) qs.set("limit", String(filters.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return adminClient.get<PaginatedResponse<Product>>(`/admin/products${query}`, token);
  },
  getOne: (token: string, idOrSlug: string) =>
    adminClient.get<Product>(`/admin/products/${idOrSlug}`, token),
  create: (token: string, data: {
    name: string;
    description?: string;
    categoryId: string;
    brand?: string;
    sku?: string;
    price: string;
    unit: Unit;
    stockQuantity?: number;
    lowStockThreshold?: number;
    image?: string;
    active?: boolean;
    featured?: boolean;
  }) => adminClient.post<Product>("/admin/products", data, token),
  update: (token: string, id: string, data: Partial<{
    name: string;
    description?: string;
    categoryId?: string;
    brand?: string;
    sku?: string;
    price: string;
    unit: Unit;
    stockQuantity?: number;
    lowStockThreshold?: number;
    image?: string;
    active?: boolean;
    featured?: boolean;
  }>) => adminClient.patch<Product>(`/admin/products/${id}`, data, token),
  delete: (token: string, id: string) =>
    adminClient.delete<void>(`/admin/products/${id}`, token),
};
