import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

type Totals = { cashSales: number; qrSales: number; cashRefunds: number; cashVoids: number };
function fail(message: string, statusCode = 400): Error { return Object.assign(new Error(message), { statusCode }); }
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw fail('Choose a valid business date.');
  const utc = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) throw fail('Choose a valid business date.');
  const start = new Date(utc.getTime() - 345 * 60_000);
  return { utc, start, end: new Date(start.getTime() + 86_400_000) };
}

async function totalsFor(date: string): Promise<Totals> {
  const { start, end } = validDate(date);
  const sales = await prisma.storeSale.findMany({
    where: { saleKind: 'SALE', OR: [{ createdAt: { gte: start, lt: end } }, { statusChangedAt: { gte: start, lt: end } }] },
    select: { total: true, paymentType: true, status: true, createdAt: true, statusChangedAt: true },
  });
  const totals: Totals = { cashSales: 0, qrSales: 0, cashRefunds: 0, cashVoids: 0 };
  for (const sale of sales) {
    const amount = Number(sale.total);
    const soldThatDay = sale.createdAt >= start && sale.createdAt < end;
    const adjustmentThatDay = sale.statusChangedAt !== null && sale.statusChangedAt >= start && sale.statusChangedAt < end;
    // Count the original cash received on the day of sale even if it was later
    // refunded or voided. The adjustment is deducted on statusChangedAt below.
    // Otherwise a same-day refund/void is subtracted without its original sale,
    // making the expected drawer balance too low.
    if (soldThatDay && sale.paymentType === 'CASH') totals.cashSales += amount;
    if (soldThatDay && sale.status === 'COMPLETED' && sale.paymentType === 'QR') totals.qrSales += amount;
    if (adjustmentThatDay && sale.status === 'REFUNDED' && sale.paymentType === 'CASH') totals.cashRefunds += amount;
    if (adjustmentThatDay && sale.status === 'VOIDED' && sale.paymentType === 'CASH') totals.cashVoids += amount;
  }
  for (const key of Object.keys(totals) as (keyof Totals)[]) totals[key] = Math.round(totals[key] * 100) / 100;
  return totals;
}

function nonNegative(value: unknown, label: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 99_999_999.99) throw fail(`${label} must be a valid non-negative amount.`);
  return Math.round(amount * 100) / 100;
}

export const cashDrawerService = {
  async get(date: string) {
    const [{ utc }, totals, closing] = await Promise.all([
      Promise.resolve(validDate(date)), totalsFor(date),
      prisma.cashDrawerClosing.findUnique({ where: { businessDate: new Date(`${date}T00:00:00Z`) }, include: { closedBy: { select: { username: true } } } }),
    ]);
    return { businessDate: utc.toISOString().slice(0, 10), ...totals, closing };
  },

  async close(input: { businessDate?: string; openingCash?: number; countedCash?: number; paidIn?: number; paidOut?: number; notes?: string }, actorId: string) {
    const date = input.businessDate ?? '';
    const { utc } = validDate(date);
    const openingCash = nonNegative(input.openingCash, 'Opening cash');
    const countedCash = nonNegative(input.countedCash, 'Counted cash');
    const paidIn = nonNegative(input.paidIn ?? 0, 'Cash added');
    const paidOut = nonNegative(input.paidOut ?? 0, 'Cash removed');
    const totals = await totalsFor(date);
    const expectedCash = Math.round((openingCash + totals.cashSales - totals.cashRefunds - totals.cashVoids + paidIn - paidOut) * 100) / 100;
    if (expectedCash < 0) throw fail('Calculated drawer balance cannot be negative. Check the opening float and adjustments.');
    try {
      return await prisma.$transaction(async (tx) => {
      if (await tx.cashDrawerClosing.findUnique({ where: { businessDate: utc } })) throw fail('The drawer for this business date is already closed.', 409);
      const closing = await tx.cashDrawerClosing.create({ data: {
        businessDate: utc, openingCash: new Decimal(openingCash), cashSales: new Decimal(totals.cashSales), qrSales: new Decimal(totals.qrSales),
        cashRefunds: new Decimal(totals.cashRefunds), cashVoids: new Decimal(totals.cashVoids), paidIn: new Decimal(paidIn), paidOut: new Decimal(paidOut),
        expectedCash: new Decimal(expectedCash), countedCash: new Decimal(countedCash), variance: new Decimal(Math.round((countedCash - expectedCash) * 100) / 100),
        notes: input.notes?.trim().slice(0, 1000) || null, closedById: actorId,
      }, include: { closedBy: { select: { username: true } } } });
      await tx.adminAuditLog.create({ data: { actorId, action: 'CASH_DRAWER_CLOSED', entity: 'CASH_DRAWER', entityId: closing.id, summary: `Cash drawer closed for ${date}. Variance: NPR ${Number(closing.variance).toFixed(2)}.`, metadata: { businessDate: date, expectedCash, countedCash, variance: Number(closing.variance) } } });
      return closing;
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') throw fail('The drawer for this business date was just closed by another cashier.', 409);
      throw error;
    }
  },
};
