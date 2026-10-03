// ─────────────────────────────────────────────
// Shared TypeScript types — Bishnu and Dhungana Stores
// ─────────────────────────────────────────────

export type Unit = "kg" | "gram" | "litre" | "ml" | "packet" | "box" | "piece" | "dozen";
export type AdminRole = "ADMIN" | "STAFF";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "NOT_REQUIRED" | "REFUNDED";

export interface Category {
  id: string; name: string; slug: string;
  description: string | null; imageUrl?: string | null; active: boolean;
  parentId?: string | null;
  parent?: Pick<Category, "id" | "name" | "slug" | "parentId"> | null;
  children?: Category[];
  createdAt: string; updatedAt: string;
  _count?: { products: number; children?: number };
}

export interface Product {
  id: string; name: string; slug: string;
  description: string | null; brand: string | null; sku: string | null;
  price: string; unit: Unit; stockQuantity: number; lowStockThreshold: number;
  image: string | null; active: boolean; featured: boolean;
  categoryId: string; category: {
    id: string; name: string; slug: string; parentId?: string | null;
    parent?: { id: string; name: string; slug: string } | null;
  };
  createdAt: string; updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: string;       // keep as string to match Product.price
  unit: Unit;
  image: string | null;
  quantity: number;
  stockQuantity: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  qrImageUrl: string;
  accountInfo: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string; productName: string; unit: Unit;
  quantity: number; unitPrice: string; subtotal: string; createdAt: string;
}

export interface Order {
  id: string; orderNumber: string;
  customerName: string; phone: string; email: string | null;
  address: string; landmark: string | null; notes: string | null;
  subtotal: string; deliveryCharge: string; total: string;
  paymentMethodName?: string | null;
  paymentMethodQrImageUrl?: string | null;
  paymentMethodAccountInfo?: string | null;
  paymentStatus: PaymentStatus; orderStatus: OrderStatus;
  createdAt: string; updatedAt: string;
  orderItems?: OrderItem[];
  guestLookupToken?: string;
}

export interface CreateOrderPayload {
  customerName?: string;
  phone?: string;
  email?: string;
  paymentMethodId?: string;
  address: string;
  landmark?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export function isOrderComplete(status: OrderStatus | string): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

export interface DashboardStats {
  totalProducts: number; activeProducts: number;
  totalCategories: number; totalOrders: number;
  pendingOrders: number; lowStockProducts: number;
  recentOrders: Array<{
    id: string; orderNumber: string; customerName: string;
    total: string; orderStatus: OrderStatus; createdAt: string;
  }>;
}

export interface LowStockProduct {
  id: string; name: string; sku: string | null;
  stockQuantity: number; lowStockThreshold: number; unit: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuthResponse {
  token: string;
  admin: { id: string; username: string; role: AdminRole };
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
}

export interface ApiError { error: string; }

// Delivery constants (mirror backend)
export const FREE_DELIVERY_THRESHOLD = 500;
export const DELIVERY_CHARGE = 50;
