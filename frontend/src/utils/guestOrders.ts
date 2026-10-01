const GUEST_ACTIVE_ORDERS_KEY = "bd_guest_active_orders";

export function getGuestOrderLookupTokens(): string[] {
  try {
    localStorage.removeItem(GUEST_ACTIVE_ORDERS_KEY);
    const raw = sessionStorage.getItem(GUEST_ACTIVE_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === "string") : [];
  } catch {
    return [];
  }
}

export function rememberGuestOrderLookupToken(lookupToken: string): void {
  const next = Array.from(new Set([...getGuestOrderLookupTokens(), lookupToken]));
  sessionStorage.setItem(GUEST_ACTIVE_ORDERS_KEY, JSON.stringify(next));
}

export function forgetGuestOrderLookupToken(lookupToken: string): void {
  const next = getGuestOrderLookupTokens().filter((token) => token !== lookupToken);
  sessionStorage.setItem(GUEST_ACTIVE_ORDERS_KEY, JSON.stringify(next));
}
