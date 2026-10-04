import { Router } from "express";
import { requireAuth, requireRole, requireFeature, requireImageUploadFeature } from "../middleware/requireAuth";
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
import { getDashboardStats, getLowStockProducts, getSalesReport } from "../controllers/adminStatsController";
import {
  getOrders, getOrder, updateOrderStatus, updatePaymentStatus,
} from "../controllers/adminOrderController";
import {
  getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
} from "../controllers/paymentMethodController";
import { createStaff, deleteStaff, listStaff, setStaffActive, updateStaffPermissions, resetStaffPassword } from "../controllers/adminUserController";
import { createAdminImageSignature } from "../controllers/imageUploadController";
import { getSupportMessages, updateSupportMessageStatus, replyToSupportMessage, resendSupportReplyEmail } from "../controllers/supportMessageController";
import { createStoreSale, listStoreSales, searchSaleProducts, updateStoreSaleStatus } from "../controllers/storeSaleController";
import { adjustInventory, getActivity, getInventoryOverview } from "../controllers/inventoryController";
import { exportAdminData } from "../controllers/adminExportController";
import { createDeliveryArea, createDeliverySlot, getAdminFulfillmentOptions, updateDeliveryArea, updateDeliverySlot } from "../controllers/fulfillmentController";
import { closeCashDrawer, getCashDrawer } from "../controllers/cashDrawerController";

const router = Router();

// All routes below require a valid admin JWT
router.use(requireAuth);

// Image uploads use short-lived signatures; the API secret never reaches the browser.
router.post("/uploads/image-signature", requireImageUploadFeature, asyncHandler(createAdminImageSignature));
router.get("/inventory", requireFeature('INVENTORY'), asyncHandler(getInventoryOverview));
router.post("/inventory/adjustments", requireFeature('INVENTORY'), asyncHandler(adjustInventory));
router.get("/activity", requireFeature('ACTIVITY'), asyncHandler(getActivity));
router.get("/exports/:kind", requireFeature('EXPORTS'), asyncHandler(exportAdminData));

// Staff accounts are created and managed only by an ADMIN.
router.get("/staff", requireRole(AdminRole.ADMIN), asyncHandler(listStaff));
router.post("/staff", requireRole(AdminRole.ADMIN), asyncHandler(createStaff));
router.patch("/staff/:id", requireRole(AdminRole.ADMIN), asyncHandler(setStaffActive));
router.patch("/staff/:id/permissions", requireRole(AdminRole.ADMIN), asyncHandler(updateStaffPermissions));
router.patch("/staff/:id/password", requireRole(AdminRole.ADMIN), asyncHandler(resetStaffPassword));
router.delete("/staff/:id", requireRole(AdminRole.ADMIN), asyncHandler(deleteStaff));
router.get("/messages", requireFeature('MESSAGES'), asyncHandler(getSupportMessages));
router.post("/messages/:id/replies", requireFeature('MESSAGES'), asyncHandler(replyToSupportMessage));
router.post("/messages/:id/replies/:replyId/resend", requireFeature('MESSAGES'), asyncHandler(resendSupportReplyEmail));
router.patch("/messages/:id/status", requireFeature('MESSAGES'), asyncHandler(updateSupportMessageStatus));
router.get("/fulfillment", requireFeature('FULFILLMENT'), asyncHandler(getAdminFulfillmentOptions));
router.post("/fulfillment/areas", requireFeature('FULFILLMENT'), asyncHandler(createDeliveryArea));
router.patch("/fulfillment/areas/:id", requireFeature('FULFILLMENT'), asyncHandler(updateDeliveryArea));
router.post("/fulfillment/slots", requireFeature('FULFILLMENT'), asyncHandler(createDeliverySlot));
router.patch("/fulfillment/slots/:id", requireFeature('FULFILLMENT'), asyncHandler(updateDeliverySlot));
router.get("/sales/cash-drawer", requireFeature('CASH_DRAWER'), asyncHandler(getCashDrawer));
router.post("/sales/cash-drawer/close", requireFeature('CASH_DRAWER'), asyncHandler(closeCashDrawer));

// In-store POS: cashiers share the product catalogue and atomically deduct stock.
router.get("/sales/products", requireFeature('STORE_SALES'), asyncHandler(searchSaleProducts));
router.get("/sales", requireFeature('STORE_SALES'), asyncHandler(listStoreSales));
router.post("/sales", requireFeature('STORE_SALES'), asyncHandler(createStoreSale));
router.patch("/sales/:id/status", requireRole(AdminRole.ADMIN), asyncHandler(updateStoreSaleStatus));

// -- Dashboard --
router.get("/stats",            requireFeature('DASHBOARD'), asyncHandler(getDashboardStats));
router.get("/stats/sales",      requireFeature('DASHBOARD'), asyncHandler(getSalesReport));
router.get("/stats/low-stock",  requireFeature('DASHBOARD'), asyncHandler(getLowStockProducts));

// -- Categories --
router.get("/categories",            requireFeature('CATEGORIES'), asyncHandler(getCategories));
router.get("/categories/:idOrSlug",  requireFeature('CATEGORIES'), asyncHandler(getCategory));
router.post("/categories",           requireFeature('CATEGORIES'), asyncHandler(createCategory));
router.patch("/categories/:id",      requireFeature('CATEGORIES'), asyncHandler(updateCategory));
router.delete("/categories/:id",     requireFeature('CATEGORIES'), asyncHandler(deleteCategory));

// -- Products --
router.get("/products",            requireFeature('PRODUCTS'), asyncHandler(getProducts));
router.get("/products/:idOrSlug",  requireFeature('PRODUCTS'), asyncHandler(getProduct));
router.post("/products",           requireFeature('PRODUCTS'), asyncHandler(createProduct));
router.patch("/products/:id",      requireFeature('PRODUCTS'), asyncHandler(updateProduct));
router.delete("/products/:id",     requireFeature('PRODUCTS'), asyncHandler(deleteProduct));

// -- Orders --
router.get("/orders",               requireFeature('ORDERS'), asyncHandler(getOrders));
router.get("/orders/:id",           requireFeature('ORDERS'), asyncHandler(getOrder));
router.patch("/orders/:id/status",  requireFeature('ORDERS'), asyncHandler(updateOrderStatus));
router.patch("/orders/:id/payment", requireFeature('ORDERS'), asyncHandler(updatePaymentStatus));

// -- Payment Methods --
router.get("/payment-methods",        requireFeature('PAYMENT_METHODS'), asyncHandler(getAllPaymentMethods));
router.post("/payment-methods",       requireFeature('PAYMENT_METHODS'), asyncHandler(createPaymentMethod));
router.patch("/payment-methods/:id",  requireFeature('PAYMENT_METHODS'), asyncHandler(updatePaymentMethod));
router.delete("/payment-methods/:id", requireFeature('PAYMENT_METHODS'), asyncHandler(deletePaymentMethod));

export default router;
