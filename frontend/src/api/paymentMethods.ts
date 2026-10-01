import { apiClient } from "./client";
import type { PaymentMethod } from "../types";

export const paymentMethodsApi = {
  getAll: () => apiClient.get<PaymentMethod[]>("/payment-methods"),
};