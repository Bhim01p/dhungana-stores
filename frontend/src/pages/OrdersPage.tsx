import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { customersApi } from "../api/customers";
import type { Order } from "../types";
import PaymentQrImage from "../components/PaymentQrImage";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useCart } from "../contexts/CartContext";
import { useLanguage } from "../i18n/LanguageContext";

const STATUS_STEPS = [
  { key: "PENDING",          label: "Order Received",   icon: "📋" },
  { key: "CONFIRMED",        label: "Confirmed",        icon: "✅" },
  { key: "PREPARING",        label: "Being Prepared",   icon: "🍳" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚚" },
  { key: "DELIVERED",        label: "Delivered",        icon: "🎉" },
];

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const colors: Record<string, string> = {
    PENDING:          "bg-yellow-100 text-yellow-800",
    CONFIRMED:        "bg-blue-100 text-blue-800",
    PREPARING:        "bg-orange-100 text-orange-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED:        "bg-green-100 text-green-800",
    CANCELLED:        "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {t(status.replace(/_/g," "))}
    </span>
  );
}

function OrderStatusTracker({ status }: { status: string }) {
  const { t } = useLanguage();
  if (status === "CANCELLED") {
    return <p className="text-sm text-red-600 font-medium mt-2">❌ {t("This order was cancelled.")}</p>;
  }
  const currentIndex = STATUS_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-start gap-1 flex-wrap mt-3">
      {STATUS_STEPS.map((step, i) => {
        const done    = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base
                ${current ? "bg-brand-500 text-white shadow-md ring-2 ring-brand-300" :
                  done    ? "bg-brand-200 text-brand-700" : "bg-gray-100 text-gray-400"}`}>
                {step.icon}
              </div>
              <p className={`text-[10px] mt-1 text-center leading-tight w-14
                ${current ? "text-brand-600 font-bold" : done ? "text-brand-400" : "text-gray-400"}`}>
                {t(step.label)}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-5 mb-4 rounded ${done ? "bg-brand-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentQRSection({ order }: { order: Order }) {
  const { t } = useLanguage();
  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">💳</span>
        <p className="font-semibold text-brand-800">{t("Payment Required")}</p>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{t("Pending")}</span>
      </div>
      {order.paymentMethodName ? <PaymentQrImage url={order.paymentMethodQrImageUrl} name={order.paymentMethodName} amount={Number(order.total)} accountInfo={order.paymentMethodAccountInfo} /> : <p className="text-sm text-brand-700">No payment method was saved for this order. Contact the store to arrange payment.</p>}
      <p className="text-xs text-brand-600 text-center">After payment, your order will be confirmed manually.</p>
    </div>
  );
}

export default function OrdersPage() {
  const { customerToken, isCustomerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  async function reorder(orderId: string) {
    if (!customerToken) return;
    setReordering(orderId); setReorderMessage(null);
    try {
      const result = await customersApi.reorder(customerToken, orderId);
      result.items.forEach(({ product, quantity }) => addItem(product, quantity));
      if (!result.items.length) setReorderMessage("None of the products from this order are currently available.");
      else if (result.unavailable.length || result.items.some((item) => item.limited)) setReorderMessage(t("Some items were unavailable or had lower stock, so the available quantities were added."));
      else setReorderMessage(t("Reorder added to cart"));
    } catch (error) { setReorderMessage(error instanceof Error ? error.message : "Could not repeat this order."); }
    finally { setReordering(null); }
  }

  useEffect(() => {
    if (!isCustomerLoading && !customerToken) navigate("/login", { state: { from: "/orders" } });
  }, [customerToken, isCustomerLoading, navigate]);

  useEffect(() => {
    if (!customerToken) return;
    customersApi.getOrders(customerToken)
      .then((ordersRes) => { setOrders(ordersRes); })
      .catch(err => setOrdersError(err.message))
      .finally(() => setLoadingOrders(false));
  }, [customerToken]);

  if (isCustomerLoading) return <LoadingSpinner message="Loading orders..." />;
  if (!customerToken) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("My Orders")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t("Track all your past and current orders")}</p>
      </div>

      {reorderMessage && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"><span>{reorderMessage}</span><button type="button" onClick={openCart} className="font-bold underline">{t("Your Cart")}</button></div>}

      {loadingOrders ? (
        <LoadingSpinner message="Loading orders..." />
      ) : ordersError ? (
        <ErrorMessage message={ordersError} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="text-gray-500 mt-3 font-medium">{t("No orders yet")}</p>
          <Link to="/products" className="btn-primary inline-block mt-4 text-sm">{t("Start Shopping")}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Header row */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="font-mono text-sm font-bold text-gray-900 shrink-0">{order.orderNumber}</span>
                  <StatusBadge status={order.orderStatus} />
                  {order.paymentStatus === "CONFIRMED" && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold shrink-0">✓ {t("Paid")}</span>
                  )}
                  {order.paymentStatus === "PENDING" && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-semibold shrink-0">⚠ {t("Payment Pending")}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="font-bold text-brand-600 text-sm">NPR {Number(order.total).toLocaleString("en-NP")}</span>
                  <span className="text-gray-400 text-xs hidden sm:block">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="text-gray-400 text-xs">{expandedOrder === order.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded content */}
              {expandedOrder === order.id && (
                <div className="px-5 pb-6 border-t border-gray-100 space-y-5 pt-4">

                  <button type="button" disabled={reordering === order.id} onClick={() => void reorder(order.id)} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                    {reordering === order.id ? "Adding…" : `↻ ${t("Buy again")}`}
                  </button>

                  {/* Status tracker */}
                  <OrderStatusTracker status={order.orderStatus} />

                  {/* QR payment — show only if payment not confirmed */}
                  {order.paymentStatus === "PENDING" && (
                    <PaymentQRSection order={order} />
                  )}

                  {/* Items */}
                  {order.orderItems && order.orderItems.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("Items")}</p>
                      <div className="space-y-1.5">
                        {order.orderItems.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-700">
                            <span>{item.productName} × {item.quantity} <span className="text-gray-400">{item.unit}</span></span>
                            <span className="font-medium">NPR {Number(item.subtotal).toLocaleString("en-NP")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>NPR {Number(order.subtotal).toLocaleString("en-NP")}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery</span>
                      <span className={Number(order.deliveryCharge) === 0 ? "text-green-600 font-medium" : ""}>
                        {Number(order.deliveryCharge) === 0 ? "Free" : `NPR ${Number(order.deliveryCharge).toLocaleString("en-NP")}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1">
                      <span>Total</span>
                      <span className="text-brand-600">NPR {Number(order.total).toLocaleString("en-NP")}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 space-y-0.5">
                    <p><span className="font-medium">{order.fulfillmentType === "PICKUP" ? t("Pick up at store") : t("Delivering to:")}</span> {order.fulfillmentType === "PICKUP" ? "Bishnu & Dhungana Stores" : order.address}</p>
                    {order.deliveryArea && <p><span className="font-medium">{t("Delivery area")}:</span> {order.deliveryArea.name}</p>}
                    {order.deliveryDate && <p><span className="font-medium">{t("Date")}:</span> {new Date(`${order.deliveryDate.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-NP", { timeZone: "UTC", month: "short", day: "numeric" })}</p>}
                    {order.deliverySlot && <p><span className="font-medium">{t("Time slot")}:</span> {order.deliverySlot.label}</p>}
                    {order.landmark && <p><span className="font-medium">Landmark:</span> {order.landmark}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
