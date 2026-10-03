import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { AdminRole } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";

// Controllers -- public resources (reuse existing)
import {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory,
} from "../controllers/categoryController";
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from "../controllers/productController";

// Controllers -- admin-only
import { getDashboardStats, getLowStockProducts } from "../controllers/adminStatsController";
import {
  getOrders, getOrder, updateOrderStatus, updatePaymentStatus,
} from "../controllers/adminOrderController";
import {
  getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
} from "../controllers/paymentMethodController";
import { createStaff, deleteStaff, listStaff, setStaffActive } from "../controllers/adminUserController";

const router = Router();

// All routes below require a valid admin JWT
router.use(requireAuth);

// Staff accounts are created and managed only by an ADMIN.
router.get("/staff", requireRole(AdminRole.ADMIN), asyncHandler(listStaff));
router.post("/staff", requireRole(AdminRole.ADMIN), asyncHandler(createStaff));
router.patch("/staff/:id", requireRole(AdminRole.ADMIN), asyncHandler(setStaffActive));
router.delete("/staff/:id", requireRole(AdminRole.ADMIN), asyncHandler(deleteStaff));

// -- Dashboard --
router.get("/stats",            requireRole(AdminRole.ADMIN), asyncHandler(getDashboardStats));
router.get("/stats/low-stock",  requireRole(AdminRole.ADMIN), asyncHandler(getLowStockProducts));

// -- Categories --
router.get("/categories",            requireRole(AdminRole.ADMIN), asyncHandler(getCategories));
router.get("/categories/:idOrSlug",  requireRole(AdminRole.ADMIN), asyncHandler(getCategory));
router.post("/categories",           requireRole(AdminRole.ADMIN), asyncHandler(createCategory));
router.patch("/categories/:id",      requireRole(AdminRole.ADMIN), asyncHandler(updateCategory));
router.delete("/categories/:id",     requireRole(AdminRole.ADMIN), asyncHandler(deleteCategory));

// -- Products --
router.get("/products",            requireRole(AdminRole.ADMIN), asyncHandler(getProducts));
router.get("/products/:idOrSlug",  requireRole(AdminRole.ADMIN), asyncHandler(getProduct));
router.post("/products",           requireRole(AdminRole.ADMIN), asyncHandler(createProduct));
router.patch("/products/:id",      requireRole(AdminRole.ADMIN), asyncHandler(updateProduct));
router.delete("/products/:id",     requireRole(AdminRole.ADMIN), asyncHandler(deleteProduct));

// -- Orders --
router.get("/orders",               asyncHandler(getOrders));
router.get("/orders/:id",           asyncHandler(getOrder));
router.patch("/orders/:id/status",  asyncHandler(updateOrderStatus));
router.patch("/orders/:id/payment", requireRole(AdminRole.ADMIN), asyncHandler(updatePaymentStatus));

// -- Payment Methods --
router.get("/payment-methods",        requireRole(AdminRole.ADMIN), asyncHandler(getAllPaymentMethods));
router.post("/payment-methods",       requireRole(AdminRole.ADMIN), asyncHandler(createPaymentMethod));
router.patch("/payment-methods/:id",  requireRole(AdminRole.ADMIN), asyncHandler(updatePaymentMethod));
router.delete("/payment-methods/:id", requireRole(AdminRole.ADMIN), asyncHandler(deletePaymentMethod));

export default router;
