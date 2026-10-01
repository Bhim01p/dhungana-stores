declare const process: { env: Record<string, string | undefined> };

type ProxyRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

type ProxyResponse = {
  status(code: number): ProxyResponse;
  setHeader(name: string, value: string): void;
  send(body: string): void;
};

const FORWARDED_REQUEST_HEADERS = ['accept', 'authorization', 'content-type'] as const;
const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'cache-control',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security',
  'ratelimit-limit',
  'ratelimit-remaining',
  'retry-after',
] as const;

/** Same-origin API proxy so the browser never needs the backend URL or cross-origin access. */
export default async function handler(req: ProxyRequest, res: ProxyResponse): Promise<void> {
  const configuredBackend = process.env.BACKEND_URL?.trim();
  if (!configuredBackend) {
    res.status(503).send('The API backend is not configured. Set BACKEND_URL in the frontend Vercel project.');
    return;
  }

  let backend: URL;
  try {
    backend = new URL(configuredBackend);
  } catch {
    res.status(500).send('BACKEND_URL must be a valid HTTPS URL.');
    return;
  }
  if (backend.protocol !== 'https:' || backend.username || backend.password) {
    res.status(500).send('BACKEND_URL must be an HTTPS URL without embedded credentials.');
    return;
  }

  const capturedPath = req.query?.apiPath;
  const pathSegments = Array.isArray(capturedPath)
    ? capturedPath
    : typeof capturedPath === 'string'
      ? capturedPath.split('/')
      : [];
  if (pathSegments.length === 0) {
    res.status(400).send('An API path is required.');
    return;
  }

  const incoming = new URL(req.url || '/api', 'https://frontend.invalid');
  incoming.searchParams.delete('apiPath');
  const targetPath = `/api/${pathSegments.filter(Boolean).map((segment) => encodeURIComponent(segment)).join('/')}`;
  const target = new URL(`${targetPath}${incoming.search}`, backend);
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers[name];
    if (typeof value === 'string') headers.set(name, value);
  }

  let body: string | undefined;
  if (req.method && !['GET', 'HEAD'].includes(req.method.toUpperCase()) && req.body !== undefined) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.status(upstream.status).send(await upstream.text());
  } catch {
    res.status(502).send('Could not reach the API backend. Check BACKEND_URL and the backend deployment.');
  }
}
