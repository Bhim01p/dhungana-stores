import { useLocation, Link } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import type { Order } from "../types";

export default function OrderConfirmationPage() {
  const location = useLocation();
  const { customer } = useCustomerAuth();
  const order = location.state?.order as Order | undefined;

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-gray-900">No order found</h1>
        <p className="text-gray-500">This page is only accessible right after placing an order.</p>
        <Link to="/" className="btn-primary inline-block mt-2">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-500">
          Thank you, <span className="font-semibold text-gray-700">{order.customerName}</span>.
          Your order has been received.
        </p>
      </div>

      {/* Order card */}
      <div className="card p-6 space-y-6">
        {/* Order number */}
        <div className="bg-brand-50 rounded-xl p-5 text-center">
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-widest mb-1">Order Number</p>
          <p className="text-2xl font-extrabold text-brand-700 font-mono tracking-wide">
            {order.orderNumber}
          </p>
          <p className="text-xs text-gray-500 mt-1">Track this order on the home page until it is delivered.</p>
        </div>

        {/* What happens next */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">What happens next?</h2>
          <div className="space-y-3">
            {[
              { step: "1", icon: "📱", text: order.paymentStatus === "CONFIRMED" ? "Payment received; we are preparing your order" : "We will confirm the order and payment with you" },
              { step: "2", icon: "📦", text: "Your order is prepared and packed" },
              { step: "3", icon: "🚚", text: "Delivery to your address" },
            ].map(({ step, icon, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {step}
                </div>
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order details */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>NPR {Number(order.subtotal).toLocaleString("en-NP")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span className={Number(order.deliveryCharge) === 0 ? "text-green-600 font-semibold" : ""}>
              {Number(order.deliveryCharge) === 0 ? "FREE" : `NPR ${Number(order.deliveryCharge).toLocaleString("en-NP")}`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
            <span>Order total</span>
            <span className="text-brand-600">NPR {Number(order.total).toLocaleString("en-NP")}</span>
          </div>
        </div>

        {order.paymentStatus === "PENDING" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            <p className="font-semibold">Payment is still pending.</p>
            {order.paymentMethodName ? <p className="mt-1">Selected method: {order.paymentMethodName}{order.paymentMethodAccountInfo ? ` · ${order.paymentMethodAccountInfo}` : ""}</p> : <p className="mt-1">The store will contact you to arrange payment.</p>}
          </div>
        )}

        {/* Delivery info */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Delivering to:</span> {order.address}</p>
          {order.landmark && <p><span className="font-medium">Landmark:</span> {order.landmark}</p>}
          <p><span className="font-medium">Contact:</span> {order.phone}</p>
        </div>
      </div>

      {/* Create account prompt for guests */}
      {!customer && (
        <div className="mt-6 bg-brand-50 border border-brand-200 rounded-2xl p-5 text-center">
          <p className="font-semibold text-brand-800 mb-1">🎉 Want to track this order?</p>
          <p className="text-sm text-brand-700 mb-4">
            Create a free account to track future orders. Guest orders are not linked by phone number alone for your privacy.
          </p>
          <Link to="/signup" className="btn-primary text-sm px-6">Create Account</Link>
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <Link to="/login" className="btn-secondary text-sm px-6">Login</Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link to="/" className="btn-primary flex-1 text-center py-3">
          Track on Home
        </Link>
        <Link to="/products" className="btn-secondary flex-1 text-center py-3">
          Browse More Products
        </Link>
      </div>
    </div>
  );
}
