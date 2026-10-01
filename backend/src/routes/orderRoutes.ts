import { Router } from "express";
import { createOrder, getGuestOrder } from "../controllers/orderController";
import { optionalCustomer } from "../middleware/requireCustomer";
import { asyncHandler } from "../utils/asyncHandler";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

// POST /api/orders — optionalCustomer links order to account if logged in
router.post("/", rateLimit(20, 60 * 60 * 1000), optionalCustomer, asyncHandler(createOrder));

// Keep the secret lookup credential in a POST body so it is not copied into access logs or referrers.
router.post("/guest-lookup", rateLimit(1000, 60 * 60 * 1000), asyncHandler(getGuestOrder));

export default router;
