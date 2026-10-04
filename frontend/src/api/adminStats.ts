import { adminClient } from "./adminClient";
import type { DashboardStats, LowStockProduct } from "../types";

export type SalesReportPeriod = '7d' | '30d' | '6m' | '1y';
export interface SalesReportPoint { bucket: string; revenue: number; storeRevenue: number; onlineRevenue: number; cash: number; qr: number; transactions: number }
export interface SalesReport {
  period: SalesReportPeriod;
  granularity: 'day' | 'month';
  totals: { revenue: number; storeRevenue: number; onlineRevenue: number; cash: number; qr: number; transactions: number; houseUseValue: number; houseUseCount: number };
  buckets: SalesReportPoint[];
}

export const adminStatsApi = {
  getDashboardStats: (token: string) =>
    adminClient.get<DashboardStats>("/admin/stats", token),
  getLowStockProducts: (token: string) =>
    adminClient.get<LowStockProduct[]>("/admin/stats/low-stock", token),
  getSalesReport: (token: string, period: SalesReportPeriod) =>
    adminClient.get<SalesReport>(`/admin/stats/sales?period=${period}`, token),
};
