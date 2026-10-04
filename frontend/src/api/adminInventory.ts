import { adminClient } from './adminClient';

export interface InventoryMovement {
  id: string; productId: string | null; productName: string; type: string;
  quantityChange: number; stockAfter: number; reason: string | null; reference: string | null;
  unitCost: string | null; createdAt: string; actor?: { username: string } | null;
}
export interface InventoryOverview {
  products: Array<{ id: string; name: string; sku: string | null; stockQuantity: number; lowStockThreshold: number; unit: string; supplierName: string | null; expiresAt: string | null }>;
  movements: InventoryMovement[];
}

export const adminInventoryApi = {
  getOverview: (token: string) => adminClient.get<InventoryOverview>('/admin/inventory', token),
  adjust: (token: string, data: { productId: string; kind: 'RECEIVE' | 'CORRECTION' | 'EXPIRED'; quantity: number; reason: string; unitCost?: number }) => adminClient.post<InventoryMovement>('/admin/inventory/adjustments', data, token),
  getActivity: (token: string) => adminClient.get<Array<{ id: string; action: string; entity: string; summary: string; createdAt: string; actor?: { username: string } | null }>>('/admin/activity', token),
};
