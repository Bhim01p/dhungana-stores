import { useEffect, useState } from "react";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { customersApi } from "../api/customers";
import { ordersApi } from "../api/orders";
import { paymentMethodsApi } from "../api/paymentMethods";
import type { Order, PaymentMethod } from "../types";
import { isOrderComplete } from "../types";
import OrderStatusTracker, { StatusBadge } from "./OrderStatusTracker";
import {
  forgetGuestOrderLookupToken,
  getGuestOrderLookupTokens,
} from "../utils/guestOrders";

const POLL_MS = 20_000;

function PaymentQRToggle({ paymentMethods, orderTotal }: { paymentMethods: PaymentMethod[], orderTotal: number }) {
  const [showQR, setShowQR] = useState(false);
  const [selected, setSelected] = useState(0);
  const method = paymentMethods[selected];

  const saveQR = () => {
    const link = document.createElement("a");
    link.href = method.qrImageUrl;
    link.download = `PaymentQR-${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4">
      {!showQR ? (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Payment pending — NPR {Number(orderTotal).toLocaleString("en-NP")}</p>
            <p className="text-xs text-yellow-700 mt-0.5">Click Pay Now to reveal QR code</p>
          </div>
          <button onClick={() => setShowQR(true)} className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
            💳 Pay Now
          </button>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-yellow-800">Scan QR to complete payment</p>
            <button onClick={() => setShowQR(false)} className="text-xs text-yellow-600 hover:text-yellow-800 font-medium">
              Hide ▲
            </button>
          </div>
          
          {/* Method tabs */}
          {paymentMethods.length > 1 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {paymentMethods.map((m, i) => (
                <button key={m.id} onClick={() => setSelected(i)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    i === selected ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
                  }`}>
                  {m.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 bg-white rounded-xl p-4 border border-yellow-200">
            {method ? (
              <>
                <p className="text-sm font-bold text-gray-800">{method.name}</p>
                <img
                  src={method.qrImageUrl}
                  alt={`${method.name} QR`}
                  className="w-44 h-44 object-contain rounded-lg border border-gray-200 bg-white p-2"
                  onError={e => { (e.target as HTMLImageElement).src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BishnuAndDhunganaStores&bgcolor=ffffff"; }}
                />
                {method.accountInfo && (
                  <p className="text-sm text-gray-600 text-center">
                    Account: <span className="font-bold text-gray-900">{method.accountInfo}</span>
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={saveQR} className="btn-secondary text-xs py-2 px-3">
                    📸 Save QR
                  </button>
                  <a href={method.qrImageUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary text-xs py-2 px-3">
                    🔗 Open in New Tab
                  </a>
                </div>
              </>
            ) : (
              <>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BishnuAndDhunganaStores&bgcolor=ffffff"
                  alt="Payment QR"
                  className="w-44 h-44 object-contain rounded-lg border border-gray-200 bg-white p-2"
                />
                <p className="text-xs text-gray-500 text-center">Contact us for payment details</p>
              </>
            )}
          </div>
          <p className="text-xs text-yellow-600 text-center mt-3">After payment, your order will be confirmed manually.</p>
        </div>
      )}
    </div>
  );
}

export default function ActiveOrdersBanner() {
  const { customer, customerToken } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (customer && customerToken) {
          const [all, methods] = await Promise.all([
            customersApi.getOrders(customerToken),
            paymentMethodsApi.getAll().catch(() => [] as PaymentMethod[]),
          ]);
          if (!cancelled) {
            setPaymentMethods(methods);
            setOrders(all.filter((o) => !isOrderComplete(o.orderStatus)));
          }
          return;
        }

        const numbers = getGuestOrderLookupTokens();
        const [methods] = await Promise.all([
          paymentMethodsApi.getAll().catch(() => [] as PaymentMethod[]),
        ]);
        if (!cancelled) setPaymentMethods(methods);
        if (numbers.length === 0) {
          if (!cancelled) setOrders([]);
          return;
        }
        const results = await Promise.all(
          numbers.map((n) => ordersApi.getByOrderNumber(n).catch(() => null)),
        );
        const active: Order[] = [];
        for (let i = 0; i < numbers.length; i++) {
          const order = results[i];
          if (!order || isOrderComplete(order.orderStatus)) {
            forgetGuestOrderLookupToken(numbers[i]);
          } else {
            active.push(order);
          }
        }
        if (!cancelled) setOrders(active);
      } catch {
        /* keep last known orders */
      }
    }

    void load();
    const timer = window.setInterval(() => { void load(); }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [customer, customerToken]);

  if (orders.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.orderNumber} className="bg-white rounded-2xl border border-brand-100 shadow-md p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Current order</p>
                <p className="font-mono font-bold text-gray-900 mt-1">{order.orderNumber}</p>
                {order.address && (
                  <p className="text-sm text-gray-500 mt-1">Delivering to {order.address}</p>
                )}
              </div>
              <div className="text-right">
                <StatusBadge status={order.orderStatus} />
                <p className="font-bold text-brand-600 text-sm mt-2">
                  NPR {Number(order.total).toLocaleString("en-NP")}
                </p>
              </div>
            </div>
            <OrderStatusTracker status={order.orderStatus} />
            {order.paymentStatus === "PENDING" && (
              <PaymentQRToggle paymentMethods={paymentMethods} orderTotal={Number(order.total)} />
            )}
            {/* Removed the "This stays here until it is delivered..." paragraph */}
          </div>
        ))}
      </div>
    </section>
  );
}
