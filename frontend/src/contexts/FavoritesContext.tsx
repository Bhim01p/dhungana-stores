import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "../types";
import { customersApi } from "../api/customers";
import { useCustomerAuth } from "./CustomerAuthContext";

interface FavoritesContextValue {
  favorites: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  isSyncing: boolean;
}
const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "bd_favorite_products";

function readSaved(): Product[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Product[];
    return Array.isArray(value) ? value.filter((p) => p && typeof p.id === "string" && typeof p.name === "string") : [];
  } catch { return []; }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { customerToken, isCustomerLoading } = useCustomerAuth();
  const [favorites, setFavorites] = useState<Product[]>(readSaved);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isCustomerLoading || !customerToken) return;
    let cancelled = false;
    setIsSyncing(true);
    const guestFavorites = readSaved();
    void (async () => {
      try {
        const syncMarker = `bd_favorites_synced_${customerToken.slice(0, 12)}`;
        let failedGuestFavorites: Product[] = [];
        if (sessionStorage.getItem(syncMarker) !== "yes") {
          const results = await Promise.allSettled(guestFavorites.map((product) => customersApi.addFavorite(customerToken, product.id)));
          failedGuestFavorites = guestFavorites.filter((_, index) => results[index]?.status === "rejected");
          if (!failedGuestFavorites.length) sessionStorage.setItem(syncMarker, "yes");
        }
        const saved = await customersApi.getFavorites(customerToken);
        if (!cancelled) {
          const savedIds = new Set(saved.map((product) => product.id));
          const merged = [...saved, ...failedGuestFavorites.filter((product) => !savedIds.has(product.id))];
          setFavorites(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch { /* Keep local favorites available if temporarily offline. */ }
      finally { if (!cancelled) setIsSyncing(false); }
    })();
    return () => { cancelled = true; };
  }, [customerToken, isCustomerLoading]);

  const toggleFavorite = useCallback((product: Product) => {
    const wasSaved = favorites.some((item) => item.id === product.id);
    const next = wasSaved ? favorites.filter((item) => item.id !== product.id) : [product, ...favorites];
    setFavorites(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (customerToken) {
      const request = wasSaved ? customersApi.removeFavorite(customerToken, product.id) : customersApi.addFavorite(customerToken, product.id);
      void request.catch(() => {
        setFavorites((current) => {
          const restored = wasSaved ? [product, ...current.filter((item) => item.id !== product.id)] : current.filter((item) => item.id !== product.id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
          return restored;
        });
      });
    }
  }, [customerToken, favorites]);

  return <FavoritesContext.Provider value={{ favorites, isFavorite: (id) => favorites.some((item) => item.id === id), toggleFavorite, isSyncing }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within FavoritesProvider");
  return context;
}
