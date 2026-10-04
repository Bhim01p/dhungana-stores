import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customerService";
import { completePasswordReset, requestPasswordReset } from "../services/passwordResetService";

export async function forgotCustomerPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = (req.body as { email?: string }).email ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    await requestPasswordReset('CUSTOMER', email);
    res.status(200).json({ message: 'If an active account uses that email, a reset link will be sent shortly.' });
  } catch (err) { next(err); }
}

export async function resetCustomerPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) { res.status(400).json({ error: 'Reset link and new password are required.' }); return; }
    await completePasswordReset('CUSTOMER', token, password);
    res.status(200).json({ message: 'Password reset. Sign in with your new password.' });
  } catch (err) { next(err); }
}

// POST /api/customers/signup
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, password } = req.body as {
      name?: string; email?: string; phone?: string; password?: string;
    };
    if (!name?.trim())     { res.status(400).json({ error: "Name is required." }); return; }
    if (!email?.trim())    { res.status(400).json({ error: "Email is required." }); return; }
    if (!phone?.trim())    { res.status(400).json({ error: "Phone is required." }); return; }
    if (!password || password.length < 12) {
      res.status(400).json({ error: "Password must be at least 12 characters." }); return;
    }
    // Validate phone format
    const cleanPhone = phone.replace(/\s/g, "").replace(/^\+977/, "");
    if (!/^(97|98)\d{8}$/.test(cleanPhone)) {
      res.status(400).json({ error: "Phone must be a valid Nepal number (97/98 + 8 digits)." }); return;
    }
    const result = await customerService.signup({ name, email, phone: cleanPhone, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// POST /api/customers/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      res.status(400).json({ error: "Email and password are required." }); return;
    }
    const result = await customerService.login(email, password);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

// GET /api/customers/me
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await customerService.getProfile(req.customer!.sub);
    if (!profile) { res.status(404).json({ error: "Customer not found." }); return; }
    res.status(200).json(profile);
  } catch (err) { next(err); }
}

// GET /api/customers/orders
export async function getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await customerService.getOrders(req.customer!.sub);
    res.status(200).json(orders);
  } catch (err) { next(err); }
}

export async function getMyFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await customerService.getFavorites(req.customer!.sub)); }
  catch (err) { next(err); }
}

export async function addMyFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await customerService.addFavorite(req.customer!.sub, String(req.params.productId))); }
  catch (err) { next(err); }
}

export async function removeMyFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await customerService.removeFavorite(req.customer!.sub, String(req.params.productId))); }
  catch (err) { next(err); }
}

export async function reorderMyOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await customerService.getReorderProducts(req.customer!.sub, String(req.params.orderId))); }
  catch (err) { next(err); }
}

// PATCH /api/customers/me
export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, phone, imageUrl } = req.body as { name?: string; phone?: string; imageUrl?: string | null };
    if (imageUrl !== undefined && imageUrl !== null) {
      let parsed: URL;
      try { parsed = new URL(imageUrl); } catch { res.status(400).json({ error: 'Profile photo URL is invalid.' }); return; }
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') {
        res.status(400).json({ error: 'Profile photos must be uploaded through the store image uploader.' });
        return;
      }
    }
    const profile = await customerService.updateProfile(req.customer!.sub, { name, phone, imageUrl });
    res.status(200).json(profile);
  } catch (err) { next(err); }
}
// POST /api/customers/change-password
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string; newPassword?: string; confirmPassword?: string;
    };
    if (!currentPassword)        { res.status(400).json({ error: "Current password is required." }); return; }
    if (!newPassword)            { res.status(400).json({ error: "New password is required." }); return; }
    if (newPassword.length < 12) { res.status(400).json({ error: "New password must be at least 12 characters." }); return; }
    if (newPassword !== confirmPassword) { res.status(400).json({ error: "New passwords do not match." }); return; }

    const result = await customerService.changePassword(req.customer!.sub, currentPassword, newPassword);
    res.status(200).json(result);
  } catch (err) { next(err); }
}
