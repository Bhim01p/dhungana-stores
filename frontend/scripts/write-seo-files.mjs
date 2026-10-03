import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const configuredUrl = process.env.VITE_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "dhungana-stores.vercel.app";
const origin = new URL(configuredUrl.includes("://") ? configuredUrl : `https://${configuredUrl}`).origin;
const routes = ["/", "/products", "/categories"];
const urls = routes.map((route) => `  <url><loc>${origin}${route}</loc></url>`).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
await writeFile(resolve("dist", "sitemap.xml"), xml, "utf8");
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /staff-login\nDisallow: /checkout\nDisallow: /orders\nDisallow: /profile\nDisallow: /reset-password\n\nSitemap: ${origin}/sitemap.xml\n`;
await writeFile(resolve("dist", "robots.txt"), robots, "utf8");
