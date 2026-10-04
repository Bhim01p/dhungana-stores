import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { ordersApi } from "../api/orders";
import { paymentMethodsApi } from "../api/paymentMethods";
import { productsApi } from "../api/products";
import type { PaymentMethod } from "../types";
import { DELIVERY_CHARGE } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PaymentQrImage from "../components/PaymentQrImage";
import { rememberGuestOrderLookupToken } from "../utils/guestOrders";
import { useLanguage } from "../i18n/LanguageContext";
import { fulfillmentApi } from "../api/fulfillment";
import type { DeliveryArea, DeliverySlot, OrderFulfillment } from "../types";

function nepalDateOffset(offset: number) {
  const local = new Date(Date.now() + 345 * 60_000 + offset * 86_400_000);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, syncProduct, removeItem } = useCart();
  const { customer, customerToken } = useCustomerAuth();
  const { t, language } = useLanguage();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingCart, setCheckingCart] = useState(true);
  const [cartCheckError, setCartCheckError] = useState<string | null>(null);
  const [fulfillmentOptionsError, setFulfillmentOptionsError] = useState<string | null>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<OrderFulfillment>("DELIVERY");
  const [deliveryAreaId, setDeliveryAreaId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => nepalDateOffset(0));
  const [deliverySlotId, setDeliverySlotId] = useState("");
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const cartIds = items.map((item) => item.productId).sort().join(",");
  const selectedArea = deliveryAreas.find((area) => area.id === deliveryAreaId);
  const deliveryFee = fulfillmentType === "PICKUP" ? 0 : selectedArea
    ? subtotal >= Number(selectedArea.freeDeliveryThreshold) ? 0 : Number(selectedArea.deliveryCharge)
    : DELIVERY_CHARGE;
  const checkoutTotal = subtotal + deliveryFee;
  const selectedDateDay = new Date(`${deliveryDate}T00:00:00Z`).getUTCDay();
  const availableSlots = deliverySlots.filter((slot) => slot.weekdays.length === 0 || slot.weekdays.includes(selectedDateDay));

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    landmark: "",
    notes: "",
  });

  // Redirect to products if cart is empty
  useEffect(() => {
    if (items.length === 0) navigate("/products");
  }, [items, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function refreshCart() {
      if (!items.length) { setCheckingCart(false); return; }
      setCheckingCart(true);
      setCartCheckError(null);
      setUnavailableItems([]);
      const results = await Promise.all(items.map(async (item) => {
        try { return { id: item.productId, product: await productsApi.getOne(item.productId), failed: false }; }
        catch { return { id: item.productId, product: null, failed: true }; }
      }));
      if (cancelled) return;
      const unavailable: string[] = [];
      const failed = results.some((result) => result.failed);
      for (const result of results) {
        if (result.failed) continue;
        if (!result.product || !result.product.active || result.product.stockQuantity <= 0) unavailable.push(result.id);
        else syncProduct(result.product);
      }
      setUnavailableItems(unavailable);
      if (failed) setCartCheckError("We couldn’t verify current prices and stock. Check your connection and reload checkout before ordering.");
      setCheckingCart(false);
    }
    void refreshCart();
    return () => { cancelled = true; };
  // cartIds deliberately makes a price update not trigger another refetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartIds]);

  // Load payment methods
  useEffect(() => {
    paymentMethodsApi.getAll()
      .then((methods) => {
        setPaymentMethods(methods);
        if (methods.length > 0) setSelectedPayment(methods[0].id);
      })
      .catch(() => {/* no payment methods is fine — show notice */})
      .finally(() => setLoadingMethods(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fulfillmentApi.options().then((options) => {
      if (cancelled) return;
      setDeliveryAreas(options.areas); setDeliverySlots(options.slots);
      if (options.areas[0]) setDeliveryAreaId(options.areas[0].id);
      if (options.slots[0]) setDeliverySlotId(options.slots[0].id);
    }).catch((err) => { if (!cancelled) setFulfillmentOptionsError(err instanceof Error ? err.message : "Delivery options could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!availableSlots.some((slot) => slot.id === deliverySlotId)) setDeliverySlotId(availableSlots[0]?.id ?? "");
  }, [deliveryDate, deliverySlotId, availableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        customerName: customer ? undefined : form.customerName,
        phone: customer ? undefined : form.phone,
        email: customer ? undefined : (form.email || undefined),
        paymentMethodId: selectedPayment || undefined,
        address: fulfillmentType === "PICKUP" ? "Store pickup" : form.address,
        fulfillmentType,
        ...(fulfillmentType === "DELIVERY" ? { deliveryAreaId } : {}),
        deliveryDate,
        deliverySlotId,
        landmark: form.landmark || undefined,
        notes: form.notes || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }, customerToken);
      if (!customer && order.guestLookupToken) rememberGuestOrderLookupToken(order.guestLookupToken);
      clearCart();
      navigate("/order-confirmation", { state: { order } });
    } catch (err: any) {
      setError(err.message ?? "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return <LoadingSpinner message="Redirecting..." />;

  const selectedMethod = paymentMethods.find((m) => m.id === selectedPayment);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-500">{t("Home")}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{t("Checkout")}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("Checkout")}</h1>

      {unavailableItems.length > 0 && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Some cart items are no longer available. Remove them before placing this order.</p>
          <div className="mt-3 space-y-2">
            {unavailableItems.map((id) => {
              const item = items.find((entry) => entry.productId === id);
              return <div key={id} className="flex items-center justify-between gap-3"><span>{item?.name ?? "Unavailable item"}</span><button type="button" className="font-semibold underline" onClick={() => removeItem(id)}>Remove</button></div>;
            })}
          </div>
        </div>
      )}
      {checkingCart && <p className="mb-4 text-sm text-gray-500">Checking current prices and stock…</p>}
      {cartCheckError && <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{cartCheckError}</div>}

      {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: Customer form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">

          {/* Customer details */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">
              {customer ? t("Delivery & notes") : t("Your Details")}
            </h2>

            {customer && (
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-sm text-brand-800">
                Ordering as <span className="font-semibold">{customer.name}</span>
                <span className="text-brand-600"> · {customer.phone}</span>
              </div>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-gray-700">{t("How would you like to receive your order?")}</legend>
              <div className="grid grid-cols-2 gap-3">
                {([{ value: "DELIVERY", label: t("Delivery") }, { value: "PICKUP", label: t("Pick up at store") }] as const).map((option) => <button key={option.value} type="button" onClick={() => setFulfillmentType(option.value)} className={`min-h-12 rounded-xl border-2 px-3 text-sm font-semibold ${fulfillmentType === option.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}>{option.value === "PICKUP" ? "🏪 " : "🚚 "}{option.label}</button>)}
              </div>
            </fieldset>
            {fulfillmentOptionsError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{fulfillmentOptionsError}</p>}
            {fulfillmentType === "DELIVERY" && <label className="block text-sm font-medium text-gray-700">{t("Delivery area")}
              <select required value={deliveryAreaId} onChange={(e) => setDeliveryAreaId(e.target.value)} className="input mt-1" disabled={!deliveryAreas.length}>
                {deliveryAreas.map((area) => <option value={area.id} key={area.id}>{area.name} · {Number(area.deliveryCharge) ? `NPR ${area.deliveryCharge}` : t("Free")}</option>)}
              </select>
            </label>}
            {fulfillmentType === "PICKUP" && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t("Collect your order from our physical store at the selected time.")}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">{t("Date")}
                <select value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="input mt-1">{Array.from({ length: 8 }, (_, index) => nepalDateOffset(index)).map((date) => <option value={date} key={date}>{new Intl.DateTimeFormat(language === "ne" ? "ne-NP" : "en-NP", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00Z`))}</option>)}</select>
              </label>
              <label className="block text-sm font-medium text-gray-700">{t("Time slot")}
                <select required value={deliverySlotId} onChange={(e) => setDeliverySlotId(e.target.value)} className="input mt-1" disabled={!availableSlots.length}>{availableSlots.map((slot) => <option value={slot.id} key={slot.id}>{slot.label}</option>)}</select>
              </label>
            </div>
            {!availableSlots.length && !fulfillmentOptionsError && <p role="alert" className="text-sm text-amber-700">{t("No time slots are available for this date. Select another date or contact the store.")}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!customer && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Full Name *")}</label>
                    <input
                      required
                      className="input"
                      placeholder="Bishnu Prasad"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Phone *")}</label>
                    <input
                      required
                      className="input"
                      placeholder="98xxxxxxxx"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setForm({ ...form, phone: val });
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">10-digit Nepal number starting with 97 or 98</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("Email (optional)")}</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </>
              )}

              {fulfillmentType === "DELIVERY" && <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Delivery Address *")}</label>
                <textarea
                  required
                  rows={2}
                  className="input"
                  placeholder="Street, Area, City"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>}

              {fulfillmentType === "DELIVERY" && <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Landmark (optional)")}</label>
                <input
                  className="input"
                  placeholder="Near temple, Blue gate..."
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                />
              </div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("Special note (optional)")}</label>
                <input
                  className="input"
                  placeholder="Special instructions..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Payment section */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">{t("Payment")}</h2>

            {loadingMethods ? (
              <LoadingSpinner message="Loading payment options..." />
            ) : paymentMethods.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="font-semibold text-gray-800">No online payment method is configured</p>
                <p className="mt-2 text-sm text-gray-600">You can still place the order. The store will contact you to arrange payment.</p>
              </div>
            ) : (
              <>
                {/* Payment method tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        selectedPayment === method.id
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 hover:border-brand-300 text-gray-700"
                      }`}
                    >
                      {method.name}
                      {method.accountInfo && (
                        <span className="block text-xs font-normal text-gray-500 mt-0.5 truncate">
                          {method.accountInfo}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* QR Code display */}
                {selectedMethod && (
                  <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center gap-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">
                      Scan QR to pay via {selectedMethod.name}
                    </p>
                    <PaymentQrImage url={selectedMethod.qrImageUrl} name={selectedMethod.name} accountInfo={selectedMethod.accountInfo} className="w-full" />
                    <p className="text-xs text-gray-500 text-center">
                      After payment, place your order. We will verify and confirm manually.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || checkingCart || Boolean(cartCheckError) || unavailableItems.length > 0 || Boolean(fulfillmentOptionsError) || !deliverySlotId || (fulfillmentType === "DELIVERY" && !deliveryAreaId)}
            className="btn-primary w-full py-4 text-base rounded-xl disabled:opacity-60"
          >
            {submitting ? t("Placing order...") : `${t("Place Order")} — NPR ${checkoutTotal.toLocaleString("en-NP")}`}
          </button>
        </form>

        {/* ── Right: Order summary ── */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4">{t("Order Summary")}</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-1 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : <span className="text-sm">🛒</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">× {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    NPR {(Number(item.price) * item.quantity).toLocaleString("en-NP")}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t("Subtotal")}</span>
                <span>NPR {subtotal.toLocaleString("en-NP")}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t("Delivery")}</span>
                <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                  {deliveryFee === 0 ? t("Free") : `NPR ${deliveryFee.toLocaleString("en-NP")}`}
                </span>
              </div>
              {fulfillmentType === "DELIVERY" && selectedArea && subtotal < Number(selectedArea.freeDeliveryThreshold) && (
                <p className="text-xs text-brand-500">
                  {t("Add")} NPR {(Number(selectedArea.freeDeliveryThreshold) - subtotal).toLocaleString("en-NP")} {t("more for free delivery")}
                </p>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
                <span>{t("Total")}</span>
                <span className="text-brand-600">NPR {checkoutTotal.toLocaleString("en-NP")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
