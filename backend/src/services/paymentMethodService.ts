import prisma from '../config/prisma';

export const paymentMethodService = {
  getAll: (activeOnly = true) =>
    prisma.paymentMethod.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),

  getOne: (id: string) =>
    prisma.paymentMethod.findUnique({ where: { id } }),

  create: (data: {
    name: string;
    qrImageUrl: string;
    accountInfo?: string;
    active?: boolean;
    sortOrder?: number;
  }) =>
    prisma.paymentMethod.create({ data }),

  update: (id: string, data: {
    name?: string;
    qrImageUrl?: string;
    accountInfo?: string;
    active?: boolean;
    sortOrder?: number;
  }) =>
    prisma.paymentMethod.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.paymentMethod.delete({ where: { id } }),
};