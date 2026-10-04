import { apiClient } from './client';
import type { Product, PaginatedResponse } from '../types';

export interface ProductFilters {
  active?: boolean;
  featured?: boolean;
  /** Category slug — maps to ?category= query param */
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const productsApi = {
  getAll: (filters?: ProductFilters) => {
    const qs = new URLSearchParams();
    if (filters?.active !== undefined)  qs.set('active',     String(filters.active));
    if (filters?.featured !== undefined) qs.set('featured',   String(filters.featured));
    if (filters?.categorySlug)           qs.set('category',   filters.categorySlug);
    if (filters?.categoryId)             qs.set('categoryId', filters.categoryId);
    if (filters?.search)                 qs.set('search',     filters.search);
    if (filters?.page)                   qs.set('page',       String(filters.page));
    if (filters?.limit)                  qs.set('limit',      String(filters.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<PaginatedResponse<Product>>(`/products${query}`);
  },

  getOne: (idOrSlug: string) =>
    apiClient.get<Product>(`/products/${idOrSlug}`),

  getByIds: (ids: string[]) => {
    const query = new URLSearchParams({ ids: ids.slice(0, 50).join(","), limit: "50" });
    return apiClient.get<PaginatedResponse<Product>>(`/products?${query.toString()}`);
  },
};
