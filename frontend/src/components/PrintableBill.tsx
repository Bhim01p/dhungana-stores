import type { Order } from "../types";
import { createPortal } from "react-dom";
import BrandLogo from "./BrandLogo";

interface Props {
  order: Order;
}

const money = (value: string | number) =>
  `NPR ${Number(value).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PrintableBill({ order }: Props) {
  const address = `${order.address}${order.landmark ? `, ${order.landmark}` : ""}`;
  const itemLines = (order.orderItems ?? []).reduce(
    (sum, item) => sum + Math.max(1, Math.ceil(item.productName.length / 24)),
    0,
  );
  const addressLines = Math.max(1, Math.ceil(address.length / 34));
  const noteLines = order.notes ? Math.max(1, Math.ceil(order.notes.length / 34)) : 0;
  const receiptHeightMm = Math.min(900, Math.max(130, 98 + itemLines * 8 + (order.orderItems?.length ?? 0) * 3 + addressLines * 4 + noteLines * 4));

  return createPortal(
    <>
    <style>{`@page { size: 80mm ${receiptHeightMm}mm; margin: 3mm; }`}</style>
    <article className="print-bill" aria-label={`Bill for order ${order.orderNumber}`}>
      <header className="bill-header">
        <BrandLogo className="bill-logo" alt="" />
        <p className="bill-title">Order Bill</p>
      </header>
      <section className="bill-meta">
        <div><span>Bill / Order No.</span><strong>{order.orderNumber}</strong></div>
        <div><span>Date</span><strong>{new Date(order.createdAt).toLocaleString("en-NP")}</strong></div>
      </section>
      <section className="bill-customer">
        <h2>Customer</h2>
        <p>{order.customerName}</p>
        <p>{order.phone}{order.email ? ` · ${order.email}` : ""}</p>
        <p>{address}</p>
      </section>
      <table className="bill-items">
        <colgroup><col className="bill-item-name-column" /><col className="bill-quantity-column" /><col className="bill-amount-column" /></colgroup>
        <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>
          {(order.orderItems ?? []).map((item) => (
            <tr key={item.id}>
              <td>{item.productName}<small>@ {money(item.unitPrice)} / {item.unit}</small></td>
              <td>{item.quantity}</td>
              <td>{money(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="bill-totals">
        <div><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div><span>Delivery</span><span>{money(order.deliveryCharge)}</span></div>
        <div className="bill-grand-total"><strong>Total</strong><strong>{money(order.total)}</strong></div>
      </section>
      <section className="bill-status">
        <span>Payment: {order.paymentStatus.replace(/_/g, " ")}</span>
        <span>Order: {order.orderStatus.replace(/_/g, " ")}</span>
      </section>
      {order.notes && <p className="bill-notes"><strong>Note:</strong> {order.notes}</p>}
      <footer className="bill-footer">Thank you for shopping with us.</footer>
    </article>
    </>,
    document.body,
  );
}
