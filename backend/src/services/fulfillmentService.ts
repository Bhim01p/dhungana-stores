import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

function fail(message: string, statusCode = 400): Error { return Object.assign(new Error(message), { statusCode }); }

export const fulfillmentService = {
  async options() {
    const [areas, slots] = await Promise.all([
      prisma.deliveryArea.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      prisma.deliverySlot.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }] }),
    ]);
    return { areas, slots, pickupAvailable: true };
  },

  async adminOptions() {
    const [areas, slots] = await Promise.all([
      prisma.deliveryArea.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      prisma.deliverySlot.findMany({ orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }] }),
    ]);
    return { areas, slots };
  },

  async createArea(input: { name?: string; deliveryCharge?: number; freeDeliveryThreshold?: number }) {
    const name = input.name?.trim().slice(0, 100);
    if (!name) throw fail('Enter a delivery area name.');
    const charge = Number(input.deliveryCharge ?? 50), threshold = Number(input.freeDeliveryThreshold ?? 500);
    if (!Number.isFinite(charge) || charge < 0 || !Number.isFinite(threshold) || threshold < 0) throw fail('Delivery prices must be zero or greater.');
    return prisma.deliveryArea.create({ data: { name, deliveryCharge: new Decimal(charge), freeDeliveryThreshold: new Decimal(threshold) } });
  },

  async updateArea(id: string, input: { name?: string; deliveryCharge?: number; freeDeliveryThreshold?: number; active?: boolean }) {
    const data: { name?: string; deliveryCharge?: Decimal; freeDeliveryThreshold?: Decimal; active?: boolean } = {};
    if (input.name !== undefined) { const name = input.name.trim().slice(0, 100); if (!name) throw fail('Area name cannot be empty.'); data.name = name; }
    for (const key of ['deliveryCharge', 'freeDeliveryThreshold'] as const) if (input[key] !== undefined) {
      const amount = Number(input[key]); if (!Number.isFinite(amount) || amount < 0) throw fail('Delivery prices must be zero or greater.');
      data[key] = new Decimal(amount);
    }
    if (input.active !== undefined) data.active = input.active;
    return prisma.deliveryArea.update({ where: { id }, data });
  },

  async createSlot(input: { label?: string; startTime?: string; endTime?: string; weekdays?: number[] }) {
    const label = input.label?.trim().slice(0, 80), startTime = input.startTime, endTime = input.endTime;
    if (!label || !startTime || !endTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) throw fail('Enter a label and valid start/end times.');
    const weekdays = input.weekdays ?? [];
    if (!Array.isArray(weekdays) || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw fail('Weekdays must be numbers from 0 (Sunday) to 6 (Saturday).');
    return prisma.deliverySlot.create({ data: { label, startTime, endTime, weekdays: [...new Set(weekdays)] } });
  },

  async updateSlot(id: string, input: { label?: string; startTime?: string; endTime?: string; weekdays?: number[]; active?: boolean }) {
    const current = await prisma.deliverySlot.findUnique({ where: { id } });
    if (!current) throw fail('Delivery time slot not found.', 404);
    const label = input.label ?? current.label, startTime = input.startTime ?? current.startTime, endTime = input.endTime ?? current.endTime;
    if (!label.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) throw fail('Enter a label and valid start/end times.');
    const weekdays = input.weekdays ?? current.weekdays;
    if (!Array.isArray(weekdays) || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw fail('Weekdays must be numbers from 0 (Sunday) to 6 (Saturday).');
    return prisma.deliverySlot.update({ where: { id }, data: { label: label.trim().slice(0, 80), startTime, endTime, weekdays: [...new Set(weekdays)], ...(input.active !== undefined ? { active: input.active } : {}) } });
  },
};
