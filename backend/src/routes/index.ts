import { Router } from "express";
import healthRoutes         from "./healthRoutes";
import categoryRoutes       from "./categoryRoutes";
import productRoutes        from "./productRoutes";
import authRoutes           from "./authRoutes";
import adminRoutes          from "./adminRoutes";
import orderRoutes          from "./orderRoutes";
import paymentMethodRoutes  from "./paymentMethodRoutes";
import customerRoutes       from "./customerRoutes";
import supportRoutes        from "./supportRoutes";
import fulfillmentRoutes    from "./fulfillmentRoutes";

const router = Router();

// Public
router.use("/health",          healthRoutes);
router.use("/categories",      categoryRoutes);
router.use("/products",        productRoutes);
router.use("/orders",          orderRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/fulfillment",     fulfillmentRoutes);

// Customer auth + profile
router.use("/customers",       customerRoutes);
router.use("/contact",         supportRoutes);

// Admin auth
router.use("/auth",            authRoutes);

// Admin (JWT protected)
router.use("/admin",           adminRoutes);

export default router;
