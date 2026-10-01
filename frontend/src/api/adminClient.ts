const adminClient = {
  get: <T>(path: string, token: string) => request<T>(path, token),
  post: <T>(path: string, body: unknown, token: string) => request<T>(path, token, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, token: string) => request<T>(path, token, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, token: string) => request<T>(path, token, { method: "DELETE" }),
};

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options?.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? "An unexpected error occurred.";
    throw new Error(message);
  }
  return data as T;
}

export { adminClient };