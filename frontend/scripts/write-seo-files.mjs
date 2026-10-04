import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnv } from "vite";

const buildEnv = { ...loadEnv(process.env.NODE_ENV || "production", process.cwd(), ""), ...process.env };
const configuredUrl = buildEnv.VITE_SITE_URL || buildEnv.VERCEL_PROJECT_PRODUCTION_URL || "dhungana-stores.vercel.app";
const origin = new URL(configuredUrl.includes("://") ? configuredUrl : `https://${configuredUrl}`).origin;
const apiOrigin = (buildEnv.SITEMAP_API_URL || "https://dhungana-stores-api.vercel.app").replace(/\/$/, "");
const routes = new Set(["/", "/products"]);
const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

async function collectSlugs(endpoint, makeRoute) {
  const slugs = [];
  try {
    let page = 1;
    let totalPages = 1;
    do {
      const response = await fetch(`${apiOrigin}${endpoint}?page=${page}&limit=100`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) break;
      const payload = await response.json();
      const items = Array.isArray(payload?.data) ? payload.data : [];
      slugs.push(...items.filter((item) => typeof item.slug === "string").map((item) => makeRoute(item.slug)));
      totalPages = Math.max(1, Number(payload?.meta?.totalPages) || 1);
      page += 1;
    } while (page <= totalPages && page <= 100);
  } catch (error) {
    console.warn(`Could not fetch ${endpoint} for the sitemap; static routes will still be written.`);
  }
  return slugs;
}

const [productRoutes, categoryRoutes] = await Promise.all([
  collectSlugs("/api/products", (slug) => `/products/${encodeURIComponent(slug)}`),
  collectSlugs("/api/categories", (slug) => `/products?category=${encodeURIComponent(slug)}`),
]);
for (const route of [...productRoutes, ...categoryRoutes]) routes.add(route);
const urls = [...routes].map((route) => `  <url><loc>${xmlEscape(origin + route)}</loc></url>`).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
await writeFile(resolve("dist", "sitemap.xml"), xml, "utf8");
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /staff\nDisallow: /staff-login\nDisallow: /staff-recovery\nDisallow: /checkout\nDisallow: /orders\nDisallow: /profile\nDisallow: /forgot-password\nDisallow: /reset-password\n\nSitemap: ${origin}/sitemap.xml\n`;
await writeFile(resolve("dist", "robots.txt"), robots, "utf8");
