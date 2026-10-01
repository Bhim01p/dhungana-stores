import { Router } from "express";
import { getPaymentMethods } from "../controllers/paymentMethodController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// GET /api/payment-methods  — public, returns active methods only
router.get("/", asyncHandler(getPaymentMethods));

export default router;