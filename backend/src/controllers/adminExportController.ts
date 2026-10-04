import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

function csvCell(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
function csv(rows: Array<Record<string, unknown>>, columns: string[]) {
  return [columns.map(csvCell).join(','), ...rows.map(row => columns.map(column => csvCell(row[column])).join(','))].join('\r\n');
}
function sendCsv(res: Response, filename: string, content: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${content}`);
}

export async function exportAdminData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = String(req.params.kind);
    const actorId = req.admin!.sub;
    if (!['store-sales', 'online-orders', 'inventory', 'snapshot'].includes(kind)) {
      res.status(400).json({ error: 'Choose store-sales, online-orders, inventory, or snapshot export.' });
      return;
    }
    await prisma.adminAuditLog.create({ data: { actorId, action: 'DATA_EXPORTED', entity: 'EXPORT', entityId: kind, summary: `Admin data export created: ${kind}.` } });

    if (kind === 'store-sales') {
      const rows = await prisma.storeSale.findMany({ take: 20000, orderBy: { createdAt: 'desc' }, include: { items: true } });
      sendCsv(res, 'store-sales.csv', csv(rows.map(sale => ({
        saleNumber: sale.saleNumber, createdAt: sale.createdAt, cashierName: sale.cashierName,
        customerName: sale.customerName, customerPhone: sale.customerPhone, kind: sale.saleKind,
        paymentType: sale.paymentType, status: sale.status, total: sale.total.toString(),
        items: sale.items.map(item => `${item.productName} x${item.quantity}`).join('; '),
      })), ['saleNumber','createdAt','cashierName','customerName','customerPhone','kind','paymentType','status','total','items']));
      return;
    }
    if (kind === 'online-orders') {
      const rows = await prisma.order.findMany({ take: 20000, orderBy: { createdAt: 'desc' }, include: { orderItems: true } });
      sendCsv(res, 'online-orders.csv', csv(rows.map(order => ({
        orderNumber: order.orderNumber, createdAt: order.createdAt, customerName: order.customerName,
        phone: order.phone, email: order.email, address: order.address, paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus, subtotal: order.subtotal.toString(), deliveryCharge: order.deliveryCharge.toString(),
        total: order.total.toString(), items: order.orderItems.map(item => `${item.productName} x${item.quantity}`).join('; '),
      })), ['orderNumber','createdAt','customerName','phone','email','address','paymentStatus','orderStatus','subtotal','deliveryCharge','total','items']));
      return;
    }
    if (kind === 'inventory') {
      const rows = await prisma.inventoryMovement.findMany({ take: 20000, orderBy: { createdAt: 'desc' }, include: { actor: { select: { username: true } } } });
      sendCsv(res, 'inventory-history.csv', csv(rows.map(row => ({
        createdAt: row.createdAt, productName: row.productName, type: row.type,
        quantityChange: row.quantityChange, stockAfter: row.stockAfter, unitCost: row.unitCost?.toString(),
        reason: row.reason, reference: row.reference, actor: row.actor?.username,
      })), ['createdAt','productName','type','quantityChange','stockAfter','unitCost','reason','reference','actor']));
      return;
    }

    const [products, categories, orders, storeSales, inventory, customers, paymentMethods, staff, supportMessages, auditLogs] = await Promise.all([
      prisma.product.findMany(), prisma.category.findMany(), prisma.order.findMany({ include: { orderItems: true } }),
      prisma.storeSale.findMany({ include: { items: true } }), prisma.inventoryMovement.findMany(),
      prisma.customer.findMany({ select: { id: true, name: true, email: true, phone: true, imageUrl: true, active: true, createdAt: true, updatedAt: true } }),
      prisma.paymentMethod.findMany(),
      prisma.adminUser.findMany({ select: { id: true, username: true, recoveryEmail: true, imageUrl: true, role: true, active: true, createdAt: true, updatedAt: true } }),
      prisma.supportMessage.findMany({ include: { replies: true } }), prisma.adminAuditLog.findMany(),
    ]);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="store-data-snapshot.json"');
    res.status(200).json({
      exportedAt: new Date().toISOString(),
      purpose: 'Portable data snapshot; not a point-in-time database restore. Use the database provider backup for full recovery.',
      products, categories, orders, storeSales, inventory, customers, paymentMethods, staff, supportMessages, auditLogs,
    });
  } catch (err) { next(err); }
}
