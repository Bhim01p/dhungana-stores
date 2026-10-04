import prisma from '../config/prisma';
import { SupportMessageStatus, SupportMessageType } from '@prisma/client';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface NewSupportMessage {
  type: SupportMessageType;
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  rating?: number;
  customerId?: string;
}

function mailTransport() {
  if (![env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD, env.SMTP_FROM].every(value => value.trim())) {
    throw Object.assign(new Error('Reply email is not configured. Set the SMTP settings and restart the backend.'), { statusCode: 503 });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
}

async function emailReply(message: { email: string | null; subject: string; name: string; message: string }, reply: { body: string; responderName: string }) {
  if (!message.email) throw Object.assign(new Error('This customer has no email address on file.'), { statusCode: 400 });
  await mailTransport().sendMail({
    from: env.SMTP_FROM,
    to: message.email,
    subject: `Re: ${message.subject.replace(/[\r\n]+/g, ' ').slice(0, 160)}`,
    text: `Hello ${message.name},\n\n${reply.responderName} from Bishnu & Dhungana Stores replied to your message:\n\n${reply.body}\n\nYour original message:\n${message.message}\n\nYou can view your support history by signing in to your account and visiting Help & feedback.`,
  });
}

export const supportMessageService = {
  create(input: NewSupportMessage) {
    return prisma.supportMessage.create({
      data: {
        type: input.type,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
        rating: input.rating ?? null,
        customerId: input.customerId ?? null,
      },
    });
  },

  async getAll(page = 1, limit = 20, status?: SupportMessageStatus) {
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { replies: { orderBy: { createdAt: 'asc' }, select: { id: true, body: true, responderName: true, createdAt: true, emailSentAt: true } } },
      }),
      prisma.supportMessage.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  updateStatus(id: string, status: SupportMessageStatus) {
    return prisma.supportMessage.findUnique({ where: { id } }).then(existing => {
      if (!existing) throw Object.assign(new Error('Message not found.'), { statusCode: 404 });
      return prisma.supportMessage.update({ where: { id }, data: { status } });
    });
  },

  getForCustomer(customerId: string) {
    return prisma.supportMessage.findMany({
      where: { customerId }, orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, status: true, subject: true, message: true, rating: true, createdAt: true,
        replies: { orderBy: { createdAt: 'asc' }, select: { id: true, body: true, responderName: true, createdAt: true, emailSentAt: true } },
      },
    });
  },

  async reply(id: string, adminUserId: string, responderName: string, body: string) {
    const message = await prisma.supportMessage.findUnique({ where: { id } });
    if (!message) throw Object.assign(new Error('Message not found.'), { statusCode: 404 });
    if (!message.email) throw Object.assign(new Error('This customer did not provide an email address, so an email reply cannot be sent.'), { statusCode: 400 });

    const reply = await prisma.supportMessageReply.create({
      data: { supportMessageId: id, adminUserId, responderName, body },
      select: { id: true, supportMessageId: true, body: true, responderName: true, createdAt: true, emailSentAt: true },
    });
    try {
      await emailReply(message, reply);
      const sent = await prisma.supportMessageReply.update({ where: { id: reply.id }, data: { emailSentAt: new Date() }, select: { id: true, supportMessageId: true, body: true, responderName: true, createdAt: true, emailSentAt: true } });
      return { reply: sent, emailSent: true };
    } catch (error) {
      console.error('Support reply email delivery failed.', error instanceof Error ? error.message : 'Unknown email error');
      return { reply, emailSent: false };
    }
  },

  async resendReply(messageId: string, replyId: string) {
    const reply = await prisma.supportMessageReply.findFirst({
      where: { id: replyId, supportMessageId: messageId },
      include: { supportMessage: true },
    });
    if (!reply) throw Object.assign(new Error('Reply not found.'), { statusCode: 404 });
    if (!reply.supportMessage.email) throw Object.assign(new Error('This customer has no email address on file.'), { statusCode: 400 });
    await emailReply(reply.supportMessage, reply);
    return prisma.supportMessageReply.update({ where: { id: reply.id }, data: { emailSentAt: new Date() }, select: { id: true, supportMessageId: true, body: true, responderName: true, createdAt: true, emailSentAt: true } });
  },
};
