import { apiClient } from './client';
import type { Category, PaginatedResponse } from '../types';

export const categoriesApi = {
  getAll: (params?: { active?: boolean; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.active !== undefined) qs.set('active', String(params.active));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<PaginatedResponse<Category>>(`/categories${query}`);
  },

  getOne: (idOrSlug: string) =>
    apiClient.get<Category>(`/categories/${idOrSlug}`),
};
