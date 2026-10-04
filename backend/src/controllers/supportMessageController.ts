import { Request, Response, NextFunction } from 'express';
import { SupportMessageStatus, SupportMessageType } from '@prisma/client';
import { supportMessageService } from '../services/supportMessageService';
import prisma from '../config/prisma';

const validTypes = Object.values(SupportMessageType);
const validStatuses = Object.values(SupportMessageStatus);

export async function createSupportMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { type?: string; name?: string; email?: string; phone?: string; subject?: string; message?: string; rating?: number };
    const type = body.type as SupportMessageType;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const subject = body.subject?.trim();
    const message = body.message?.trim();

    if (!validTypes.includes(type)) { res.status(400).json({ error: 'Choose a valid message type.' }); return; }
    if (!name || name.length > 100) { res.status(400).json({ error: 'Enter your name (up to 100 characters).' }); return; }
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) { res.status(400).json({ error: 'Enter a valid email address.' }); return; }
    if (phone && phone.length > 30) { res.status(400).json({ error: 'Phone number is too long.' }); return; }
    if (type !== SupportMessageType.REVIEW && !email && !phone) { res.status(400).json({ error: 'Add an email or phone number so the store team can reply.' }); return; }
    if (!subject || subject.length > 160) { res.status(400).json({ error: 'Enter a subject (up to 160 characters).' }); return; }
    if (!message || message.length < 10 || message.length > 5000) { res.status(400).json({ error: 'Message must be between 10 and 5,000 characters.' }); return; }
    if (type === SupportMessageType.REVIEW && (!Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5)) {
      res.status(400).json({ error: 'Choose a rating from 1 to 5 stars for a store review.' }); return;
    }

    const customer = req.customer ? await prisma.customer.findUnique({ where: { id: req.customer.sub }, select: { id: true, name: true, email: true, phone: true, active: true } }) : null;
    if (req.customer && !customer?.active) { res.status(401).json({ error: 'Your customer account is inactive. Sign in again or contact the store.' }); return; }
    await supportMessageService.create({
      type, name: customer?.name ?? name, email: customer?.email ?? email, phone: customer?.phone ?? phone,
      subject, message, customerId: customer?.id,
      rating: type === SupportMessageType.REVIEW ? body.rating : undefined,
    });
    res.status(201).json({ message: 'Thanks for reaching out. Your message has been sent to the store team.' });
  } catch (err) { next(err); }
}

export async function getMySupportMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await supportMessageService.getForCustomer(req.customer!.sub)); }
  catch (err) { next(err); }
}

export async function getSupportMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const status = req.query.status ? String(req.query.status) as SupportMessageStatus : undefined;
    if (status && !validStatuses.includes(status)) { res.status(400).json({ error: 'Choose a valid message status.' }); return; }
    res.status(200).json(await supportMessageService.getAll(page, limit, status));
  } catch (err) { next(err); }
}

export async function updateSupportMessageStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = (req.body as { status?: string }).status as SupportMessageStatus;
    if (!validStatuses.includes(status)) { res.status(400).json({ error: 'Choose a valid message status.' }); return; }
    res.status(200).json(await supportMessageService.updateStatus(String(req.params.id), status));
  } catch (err) { next(err); }
}

export async function replyToSupportMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = (req.body as { body?: unknown }).body;
    if (typeof body !== 'string' || body.trim().length < 2 || body.trim().length > 5000) {
      res.status(400).json({ error: 'Reply must be between 2 and 5,000 characters.' }); return;
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub }, select: { id: true, username: true, active: true } });
    if (!admin?.active) { res.status(401).json({ error: 'Admin account is inactive or no longer exists.' }); return; }
    res.status(200).json(await supportMessageService.reply(String(req.params.id), admin.id, admin.username, body.trim()));
  } catch (err) { next(err); }
}

export async function resendSupportReplyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reply = await supportMessageService.resendReply(String(req.params.id), String(req.params.replyId));
    res.status(200).json({ reply, emailSent: true });
  } catch (err) { next(err); }
}
