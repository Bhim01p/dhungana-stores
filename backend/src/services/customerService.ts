import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

export interface CustomerJwtPayload {
  sub: string;
  email: string;
  type: "customer";
  iat?: number;
}

export function signCustomerToken(payload: CustomerJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyCustomerToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as CustomerJwtPayload;
}

export const customerService = {
  async signup(data: { name: string; email: string; phone: string; password: string }) {
    const existing = await prisma.customer.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) {
      if (existing.email === data.email) {
        throw Object.assign(new Error("An account with this email already exists."), { statusCode: 409 });
      }
      throw Object.assign(new Error("An account with this phone number already exists."), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        password: passwordHash,
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    const token = signCustomerToken({ sub: customer.id, email: customer.email, type: "customer" });
    return { token, customer };
  },

  async login(email: string, password: string) {
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!customer || !customer.active) {
      throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
    }
    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
    }

    const token = signCustomerToken({ sub: customer.id, email: customer.email, type: "customer" });
    return {
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    };
  },

  async getProfile(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
  },

  async getOrders(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: { orderItems: true },
    });
  },

  async updateProfile(customerId: string, data: { name?: string; phone?: string }) {
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.phone && { phone: data.phone.trim() }),
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
  },

  async changePassword(customerId: string, currentPassword: string, newPassword: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw Object.assign(new Error("Customer not found."), { statusCode: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, customer.password);
    if (!valid) {
      throw Object.assign(new Error("Current password is incorrect."), { statusCode: 401 });
    }
    if (newPassword.length < 12) {
      throw Object.assign(new Error("New password must be at least 12 characters."), { statusCode: 400 });
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.customer.update({
      where: { id: customerId },
      data: { password: passwordHash, passwordChangedAt: new Date() },
    });
    return { message: "Password updated successfully." };
  },
};
