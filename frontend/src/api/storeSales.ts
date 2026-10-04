import { adminClient } from './adminClient';
import type { PaginatedResponse, Unit } from '../types';

export type StoreSalePaymentType = 'CASH' | 'QR';
export type StoreSaleKind = 'SALE' | 'HOUSE_USE';
export type StoreSaleStatus = 'COMPLETED' | 'VOIDED' | 'REFUNDED';
export interface StoreSaleProduct { id: string; name: string; price: string; unit: Unit; stockQuantity: number; image: string | null; images: string[]; sku: string | null }
export interface StoreSaleItem { id: string; productName: string; unit: Unit; quantity: number; unitPrice: string; subtotal: string }
export interface StoreSale { id: string; saleNumber: string; cashierName: string; customerName: string | null; customerPhone: string | null; subtotal: string; total: string; paymentType: StoreSalePaymentType | null; saleKind: StoreSaleKind; tenderedAmount: string | null; changeAmount: string | null; status: StoreSaleStatus; statusReason: string | null; statusChangedBy: string | null; createdAt: string; items: StoreSaleItem[] }
export interface CashDrawerClosing { id: string; businessDate: string; openingCash: string; cashSales: string; qrSales: string; cashRefunds: string; cashVoids: string; paidIn: string; paidOut: string; expectedCash: string; countedCash: string; variance: string; notes: string | null; closedBy?: { username: string } | null; createdAt: string }
export interface CashDrawerSummary { businessDate: string; cashSales: number; qrSales: number; cashRefunds: number; cashVoids: number; closing: CashDrawerClosing | null }

export const storeSalesApi = {
  products: (token: string, search = '') => adminClient.get<StoreSaleProduct[]>(`/admin/sales/products${search ? `?search=${encodeURIComponent(search)}` : ''}`, token),
  list: (token: string, search = '') => adminClient.get<PaginatedResponse<StoreSale>>(`/admin/sales?limit=30${search ? `&search=${encodeURIComponent(search)}` : ''}`, token),
  create: (token: string, data: { items: Array<{ productId: string; quantity: number }>; saleKind: StoreSaleKind; paymentType?: StoreSalePaymentType; tenderedAmount?: number; customerName?: string; customerPhone?: string }) => adminClient.post<StoreSale>('/admin/sales', data, token),
  changeStatus: (token: string, id: string, status: 'VOIDED' | 'REFUNDED', reason: string, restockRefundedItems?: boolean) => adminClient.patch<StoreSale>(`/admin/sales/${id}/status`, { status, reason, ...(restockRefundedItems === undefined ? {} : { restockRefundedItems }) }, token),
  cashDrawer: (token: string, date: string) => adminClient.get<CashDrawerSummary>(`/admin/sales/cash-drawer?date=${encodeURIComponent(date)}`, token),
  closeCashDrawer: (token: string, data: { businessDate: string; openingCash: number; countedCash: number; paidIn: number; paidOut: number; notes?: string }) => adminClient.post<CashDrawerClosing>('/admin/sales/cash-drawer/close', data, token),
};
