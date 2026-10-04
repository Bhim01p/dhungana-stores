const adminClient = {
  get: <T>(path: string, token: string) => request<T>(path, token),
  post: <T>(path: string, body: unknown, token: string) => request<T>(path, token, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, token: string) => request<T>(path, token, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, token: string) => request<T>(path, token, { method: "DELETE" }),
};

import { readApiResponse } from "./readResponse";

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options?.headers },
    ...options
  });
  return readApiResponse<T>(res, path);
}

export { adminClient };
