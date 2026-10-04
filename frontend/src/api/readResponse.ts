export async function readApiResponse<T>(response: Response, path: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let body: unknown = undefined;
  if (text.trim()) {
    if (contentType.includes("application/json") || /^[\[{]/.test(text.trim())) {
      try { body = JSON.parse(text); }
      catch { throw new Error(`The server returned invalid JSON for ${path} (HTTP ${response.status}).`); }
    } else {
      throw new Error(`The server returned a non-JSON response for ${path} (HTTP ${response.status}): ${text.trim().slice(0, 180)}`);
    }
  }
  if (!response.ok) {
    const message = (body as { error?: string } | undefined)?.error;
    throw new Error(message || `Request to ${path} failed (HTTP ${response.status})${text.trim() ? `: ${text.trim().slice(0, 180)}` : " with an empty response"}.`);
  }
  return text.trim() ? body as T : undefined as T;
}
