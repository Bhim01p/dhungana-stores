import { useEffect, useState } from "react";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { customersApi } from "../api/customers";
import { ordersApi } from "../api/orders";
import type { Order } from "../types";
import { isOrderComplete } from "../types";
import OrderStatusTracker, { StatusBadge } from "./OrderStatusTracker";
import PaymentQrImage from "./PaymentQrImage";
import { forgetGuestOrderLookupToken, getGuestOrderLookupTokens } from "../utils/guestOrders";

const POLL_MS = 20_000;

function OrderPayment({ order }: { order: Order }) {
  const [showQR, setShowQR] = useState(false);
  return (
    <div className="mt-4">
      {!showQR ? (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Payment pending — NPR {Number(order.total).toLocaleString("en-NP")}</p>
            <p className="mt-0.5 text-xs text-yellow-700">{order.paymentMethodName ? "Use the payment details saved for this order." : "Contact the store to arrange payment."}</p>
          </div>
          {order.paymentMethodName && <button onClick={() => setShowQR(true)} className="btn-primary whitespace-nowrap px-4 py-2 text-xs">Payment details</button>}
        </div>
      ) : (
        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-yellow-800">Payment details for this order</p>
            <button onClick={() => setShowQR(false)} className="text-xs font-medium text-yellow-700">Hide</button>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-white p-4">
            <PaymentQrImage url={order.paymentMethodQrImageUrl} name={order.paymentMethodName ?? "Payment"} amount={Number(order.total)} accountInfo={order.paymentMethodAccountInfo} />
          </div>
          <p className="mt-3 text-center text-xs text-yellow-700">The store will confirm your payment manually.</p>
        </div>
      )}
    </div>
  );
}

export default function ActiveOrdersBanner() {
  const { customer, customerToken } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (customer && customerToken) {
          const all = await customersApi.getOrders(customerToken);
          if (!cancelled) setOrders(all.filter((o) => !isOrderComplete(o.orderStatus)));
          return;
        }
        const numbers = getGuestOrderLookupTokens();
        if (numbers.length === 0) { if (!cancelled) setOrders([]); return; }
        const results = await Promise.all(numbers.map((n) => ordersApi.getByOrderNumber(n).catch(() => null)));
        const active: Order[] = [];
        for (let i = 0; i < numbers.length; i++) {
          const order = results[i];
          if (!order || isOrderComplete(order.orderStatus)) forgetGuestOrderLookupToken(numbers[i]);
          else active.push(order);
        }
        if (!cancelled) setOrders(active);
      } catch { /* keep last known orders */ }
    }
    void load();
    const timer = window.setInterval(() => { void load(); }, POLL_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [customer, customerToken]);

  if (orders.length === 0) return null;
  return (
    <section className="relative z-10 -mt-6 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.orderNumber} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Current order</p><p className="mt-1 font-mono font-bold text-gray-900">{order.orderNumber}</p>{order.address && <p className="mt-1 text-sm text-gray-500">Delivering to {order.address}</p>}</div>
              <div className="text-right"><StatusBadge status={order.orderStatus} /><p className="mt-2 text-sm font-bold text-brand-600">NPR {Number(order.total).toLocaleString("en-NP")}</p></div>
            </div>
            <OrderStatusTracker status={order.orderStatus} />
            {order.paymentStatus === "PENDING" && order.orderStatus !== "CANCELLED" && <OrderPayment order={order} />}
          </div>
        ))}
      </div>
    </section>
  );
}
