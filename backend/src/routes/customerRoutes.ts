import { Router } from "express";
import { signup, login, getMe, getMyOrders, updateMe, changePassword, forgotCustomerPassword, resetCustomerPassword, getMyFavorites, addMyFavorite, removeMyFavorite, reorderMyOrder } from "../controllers/customerController";
import { getMySupportMessages } from "../controllers/supportMessageController";
import { requireCustomer } from "../middleware/requireCustomer";
import { asyncHandler } from "../utils/asyncHandler";
import { createCustomerImageSignature } from "../controllers/imageUploadController";

const router = Router();

// Public
router.post("/signup", asyncHandler(signup));
router.post("/login",  asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotCustomerPassword));
router.post("/reset-password", asyncHandler(resetCustomerPassword));

// Protected — customer must be logged in
router.get("/me",     requireCustomer, asyncHandler(getMe));
router.patch("/me",   requireCustomer, asyncHandler(updateMe));
router.post("/me/image-signature", requireCustomer, asyncHandler(createCustomerImageSignature));
router.post("/change-password", requireCustomer, asyncHandler(changePassword));

router.get("/orders", requireCustomer, asyncHandler(getMyOrders));
router.get("/support-messages", requireCustomer, asyncHandler(getMySupportMessages));
router.post("/orders/:orderId/reorder", requireCustomer, asyncHandler(reorderMyOrder));
router.get("/favorites", requireCustomer, asyncHandler(getMyFavorites));
router.post("/favorites/:productId", requireCustomer, asyncHandler(addMyFavorite));
router.delete("/favorites/:productId", requireCustomer, asyncHandler(removeMyFavorite));

export default router;
