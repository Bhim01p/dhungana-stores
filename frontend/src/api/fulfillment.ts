import { readApiResponse } from './readResponse';
import { adminClient } from './adminClient';
import type { OrderFulfillment, DeliveryArea, DeliverySlot } from '../types';

export interface FulfillmentOptions { areas: DeliveryArea[]; slots: DeliverySlot[]; pickupAvailable: boolean; }
export interface AdminFulfillmentOptions { areas: DeliveryArea[]; slots: DeliverySlot[]; }

export const fulfillmentApi = {
  options: async () => readApiResponse<FulfillmentOptions>(await fetch('/api/fulfillment/options'), '/fulfillment/options'),
  adminOptions: (token: string) => adminClient.get<AdminFulfillmentOptions>('/admin/fulfillment', token),
  createArea: (token: string, data: { name: string; deliveryCharge: number; freeDeliveryThreshold: number }) => adminClient.post<DeliveryArea>('/admin/fulfillment/areas', data, token),
  updateArea: (token: string, id: string, data: Partial<DeliveryArea>) => adminClient.patch<DeliveryArea>(`/admin/fulfillment/areas/${id}`, data, token),
  createSlot: (token: string, data: { label: string; startTime: string; endTime: string; weekdays: number[] }) => adminClient.post<DeliverySlot>('/admin/fulfillment/slots', data, token),
  updateSlot: (token: string, id: string, data: Partial<DeliverySlot>) => adminClient.patch<DeliverySlot>(`/admin/fulfillment/slots/${id}`, data, token),
};

export type { OrderFulfillment };
