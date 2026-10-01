import { adminClient } from "./adminClient";
import type { DashboardStats, LowStockProduct } from "../types";

export const adminStatsApi = {
  getDashboardStats: (token: string) =>
    adminClient.get<DashboardStats>("/admin/stats", token),
  getLowStockProducts: (token: string) =>
    adminClient.get<LowStockProduct[]>("/admin/stats/low-stock", token),
};