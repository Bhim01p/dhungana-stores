import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_CHARGE } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

export default function CartDrawer() {
  const { t } = useLanguage();
  const {
    items, isOpen, closeCart, removeItem, updateQty,
    subtotal, deliveryCharge: _deliveryCharge, total, isFreeDelivery, amountUntilFreeDelivery, itemCount,
  } = useCart();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-bold text-gray-900 text-lg">{t("Your Cart")}</h2>
            {itemCount > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-brand-50 border-b border-brand-100">
            {isFreeDelivery ? (
              <p className="text-sm text-brand-700 font-semibold flex items-center gap-1">
                🎉 {t("You get free delivery!")}
              </p>
            ) : (
              <div>
                <p className="text-xs text-gray-600 mb-1.5">
                  {t("Add")} <span className="font-bold text-brand-600">NPR {amountUntilFreeDelivery.toLocaleString("en-NP")}</span> {t("more for free delivery")}
                </p>
                <div className="h-1.5 bg-brand-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{t("Free delivery on orders over NPR 500")}</p>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <span className="text-5xl">🛍️</span>
              <p className="font-semibold text-gray-700">{t("Your cart is empty")}</p>
              <p className="text-sm text-gray-400">{t("Add products to start your order")}</p>
              <button
                onClick={() => { closeCart(); navigate("/products"); }}
                className="btn-primary mt-2"
              >
                {t("Browse Products")}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-start gap-3">
                {/* Image */}
                <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🛒</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    NPR {Number(item.price).toLocaleString("en-NP")} / {item.unit}
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold"
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stockQuantity}
                      className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold disabled:opacity-40"
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                </div>

                {/* Subtotal + remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-sm font-bold text-brand-600">
                    NPR {(Number(item.price) * item.quantity).toLocaleString("en-NP")}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    {t("Remove")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — totals + checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-white">
            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
              <span>{t("Subtotal")} ({itemCount} items)</span>
                <span>NPR {subtotal.toLocaleString("en-NP")}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t("Delivery")}</span>
                <span className={isFreeDelivery ? "text-green-600 font-semibold" : ""}>
                  {isFreeDelivery ? "FREE" : `NPR ${DELIVERY_CHARGE}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
                <span>{t("Total")}</span>
                <span className="text-brand-600">NPR {total.toLocaleString("en-NP")}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => { closeCart(); navigate("/checkout"); }}
              className="btn-primary w-full py-3.5 text-base rounded-xl"
            >
              {t("Proceed to Checkout →")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
