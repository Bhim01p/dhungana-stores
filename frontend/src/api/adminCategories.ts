import { adminClient } from "./adminClient";
import type { PaginatedResponse, Category } from "../types";

export const adminCategoriesApi = {
  getAll: (token: string, params?: { active?: boolean; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.active !== undefined) qs.set("active", String(params.active));
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return adminClient.get<PaginatedResponse<Category>>(`/admin/categories${query}`, token);
  },
  getOne: (token: string, idOrSlug: string) =>
    adminClient.get<Category>(`/admin/categories/${idOrSlug}`, token),
  create: (token: string, data: { name: string; description?: string; active?: boolean; parentId?: string | null }) =>
    adminClient.post<Category>("/admin/categories", data, token),
  update: (token: string, id: string, data: { name?: string; description?: string; active?: boolean; parentId?: string | null }) =>
    adminClient.patch<Category>(`/admin/categories/${id}`, data, token),
  delete: (token: string, id: string) =>
    adminClient.delete<void>(`/admin/categories/${id}`, token),
};
