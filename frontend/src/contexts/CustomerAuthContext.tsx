import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { readApiResponse } from "../api/readResponse";

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  imageUrl?: string | null;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  customerToken: string | null;
  isCustomerLoading: boolean;
  customerLogin: (email: string, password: string) => Promise<void>;
  customerSignup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  customerLogout: () => void;
  syncCustomer: (updates: Partial<CustomerUser>) => void;
  customerError: string | null;
  clearCustomerError: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const TOKEN_KEY = "bd_customer_token";
const USER_KEY  = "bd_customer_user";

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const t = sessionStorage.getItem(TOKEN_KEY);
      const u = sessionStorage.getItem(USER_KEY);
      if (t && u) {
        const parsed = JSON.parse(u) as CustomerUser;
        if (!parsed || typeof parsed.id !== "string" || typeof parsed.name !== "string") throw new Error("Invalid saved session");
        setCustomerToken(t); setCustomer(parsed);
      }
    } catch { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); }
    setIsCustomerLoading(false);
  }, []);

  const persist = (token: string, user: CustomerUser) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    setCustomerToken(token);
    setCustomer(user);
  };

  const customerLogin = async (email: string, password: string) => {
    setCustomerError(null);
    const res = await fetch("/api/customers/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    let data: { token: string; customer: CustomerUser };
    try { data = await readApiResponse<{ token: string; customer: CustomerUser }>(res, "/customers/login"); }
    catch (error) { const e = error as Error; setCustomerError(e.message); throw e; }
    persist(data.token, data.customer);
  };

  const customerSignup = async (name: string, email: string, phone: string, password: string) => {
    setCustomerError(null);
    const res = await fetch("/api/customers/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    let data: { token: string; customer: CustomerUser };
    try { data = await readApiResponse<{ token: string; customer: CustomerUser }>(res, "/customers/signup"); }
    catch (error) { const e = error as Error; setCustomerError(e.message); throw e; }
    persist(data.token, data.customer);
  };

  const customerLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setCustomerToken(null);
    setCustomer(null);
  };

  const syncCustomer = (updates: Partial<CustomerUser>) => {
    setCustomer(current => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <CustomerAuthContext.Provider value={{
      customer, customerToken, isCustomerLoading,
      customerLogin, customerSignup, customerLogout, syncCustomer,
      customerError, clearCustomerError: () => setCustomerError(null),
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
