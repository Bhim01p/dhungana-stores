import { Router } from "express";
import { signup, login, getMe, getMyOrders, updateMe, changePassword, forgotCustomerPassword, resetCustomerPassword } from "../controllers/customerController";
import { requireCustomer } from "../middleware/requireCustomer";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public
router.post("/signup", asyncHandler(signup));
router.post("/login",  asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotCustomerPassword));
router.post("/reset-password", asyncHandler(resetCustomerPassword));

// Protected — customer must be logged in
router.get("/me",     requireCustomer, asyncHandler(getMe));
router.patch("/me",   requireCustomer, asyncHandler(updateMe));
router.post("/change-password", requireCustomer, asyncHandler(changePassword));

router.get("/orders", requireCustomer, asyncHandler(getMyOrders));

export default router;
