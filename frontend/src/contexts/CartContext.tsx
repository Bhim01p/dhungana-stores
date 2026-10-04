import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import type { CartItem, Product } from "../types";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_CHARGE } from "../types";

// ─── State ────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  cartNotice: string | null;
}

// ─── Actions ──────────────────────────────────────────────
type CartAction =
  | { type: "ADD_ITEM"; product: Product; quantity?: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QTY"; productId: string; quantity: number }
  | { type: "SYNC_PRODUCT"; product: Product }
  | { type: "CLEAR" }
  | { type: "OPEN_DRAWER" }
  | { type: "CLOSE_DRAWER" }
  | { type: "CLEAR_NOTICE" }
  | { type: "LOAD"; items: CartItem[] };

// ─── Reducer ──────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { ...state, items: action.items };

    case "ADD_ITEM": {
      const { product, quantity = 1 } = action;
      const existing = state.items.find((i) => i.productId === product.id);
      let items: CartItem[];
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stockQuantity);
        items = state.items.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      } else {
        items = [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            image: product.image,
            quantity: Math.min(quantity, product.stockQuantity),
            stockQuantity: product.stockQuantity,
          },
        ];
      }
      return { ...state, items, cartNotice: `${product.name} added to your cart` };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };

    case "UPDATE_QTY": {
      if (action.quantity < 1) {
        return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: Math.min(action.quantity, i.stockQuantity) }
            : i
        ),
      };
    }

    case "SYNC_PRODUCT": {
      const product = action.product;
      return {
        ...state,
        items: state.items.map((item) => item.productId === product.id ? {
          ...item,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image: product.image,
          stockQuantity: product.stockQuantity,
          quantity: product.stockQuantity > 0 ? Math.min(item.quantity, product.stockQuantity) : item.quantity,
        } : item),
      };
    }

    case "CLEAR":
      return { ...state, items: [], cartNotice: null };

    case "OPEN_DRAWER":
      return { ...state, isOpen: true };

    case "CLOSE_DRAWER":
      return { ...state, isOpen: false };

    case "CLEAR_NOTICE":
      return { ...state, cartNotice: null };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────
interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  cartNotice: string | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  syncProduct: (product: Product) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCartNotice: () => void;
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  isFreeDelivery: boolean;
  amountUntilFreeDelivery: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "bd_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false, cartNotice: null });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const items = JSON.parse(saved) as CartItem[];
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: "LOAD", items });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  // Derived values
  const subtotal = state.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = isFreeDelivery ? 0 : (state.items.length > 0 ? DELIVERY_CHARGE : 0);
  const total = subtotal + deliveryCharge;
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const amountUntilFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        cartNotice: state.cartNotice,
        addItem: (product, quantity) => dispatch({ type: "ADD_ITEM", product, quantity }),
        removeItem: (productId) => dispatch({ type: "REMOVE_ITEM", productId }),
        updateQty: (productId, quantity) => dispatch({ type: "UPDATE_QTY", productId, quantity }),
        syncProduct: (product) => dispatch({ type: "SYNC_PRODUCT", product }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        openCart: () => dispatch({ type: "OPEN_DRAWER" }),
        closeCart: () => dispatch({ type: "CLOSE_DRAWER" }),
        clearCartNotice: () => dispatch({ type: "CLEAR_NOTICE" }),
        itemCount,
        subtotal,
        deliveryCharge,
        total,
        isFreeDelivery,
        amountUntilFreeDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
