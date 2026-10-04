# Deployment readiness setup

This project runs as two Vercel projects: the frontend from `frontend/` and the API from `backend/`. Production data stays in Neon. Local database migrations only affect the database in `backend/.env`.

## Image uploads

The app now supports signed image uploads for product photos, category photos, payment QR photos, and customer profile photos. The Cloudinary API secret stays on the API server; the browser receives only a short-lived upload signature.

1. Create or choose a Cloudinary account and copy its cloud name, API key, and API secret.
2. Add these variables to the **backend Vercel project** for Production and Preview, and to `backend/.env` for local development:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Redeploy the backend after saving the variables. Product, category, and payment QR editors have upload controls; customers can upload their photo on My Profile.

Uploads accept JPG, PNG, WebP, and AVIF up to 5 MB. The admin product screen also has a “Missing photo” filter for products with no saved image URL. Existing broken external image URLs still need replacing with the upload control.

## Customer profile photo database change

The local branch contains multiple new migrations, from customer profile photos through support-message replies. Several are untracked in Git, and the production Neon migration state has not been verified. Do not assume that a local database migration has reached Neon just because the app works locally.

Before a production release:

1. Review and commit the intended `backend/prisma/migrations/` folders with their matching schema and backend code.
2. Check migration status against the intended Neon branch using `npx prisma migrate status` from `backend/` with that branch's `DATABASE_URL`.
3. Review the pending SQL and take a database backup before applying production changes.
4. Apply migrations to the intended database before deploying backend code that depends on them.

For a local database, apply migrations only when `backend/.env` points to the local database:

```powershell
cd backend
npx prisma migrate deploy
```

For production, use an explicitly selected Neon production connection string and verify its host and database first. Never run a production migration command with an uncertain or copied connection string.

## Production rate limiting

The API currently stores rate-limit counters in process memory. This offers some protection within one running process but does not share counters across Vercel function instances and can reset when an instance is replaced. Before treating limits on login, recovery, contact, or order routes as production-grade abuse protection, move the counters to a shared store such as a managed Redis-compatible service and configure it in Vercel. No shared rate-limit provider is configured yet.

## Code checks and database tests

GitHub Actions builds the frontend and backend on pushes and pull requests. The database tests are intentionally not part of CI because they create and delete records. Run them only against a dedicated disposable database as described in `backend/TESTING.md`. The frontend `lint` script currently refers to ESLint, which is not listed in the frontend dependencies; linting is therefore not a verified CI check yet.

## Separate staff host

The frontend already routes the public shop and staff portal based on the browser host. To give staff a separate address, first connect a domain you own to the frontend Vercel project and add both the storefront host and a `staff.` subdomain in Vercel.

Then set:

- Frontend Vercel project: `VITE_STAFF_URL=https://staff.<your-domain>`
- Frontend Vercel project: `VITE_SITE_URL=https://<your-domain>`
- Backend Vercel project: `STAFF_URL=https://staff.<your-domain>`
- Backend Vercel project: `FRONTEND_URL=https://<your-domain>`

Set the frontend variables for Production and Preview, then redeploy the frontend. The API origins must match the actual HTTPS domains exactly. Until the staff domain is connected and these variables are set, the separate-host behavior is not active.

## Search visibility

The frontend build generates `sitemap.xml` using `VITE_SITE_URL` and fetches active product and category slugs from the API when it can reach it. `robots.txt` excludes staff, account, and checkout routes. Once the final domain is connected, verify that `https://<your-domain>/sitemap.xml` opens, add the domain property in Google Search Console, verify ownership using Google's DNS TXT record, then submit the sitemap URL there. Google account verification requires the site owner.

## Production branch

Vercel production is configured to follow `main`, while the current working branch is `admin-dashboard`. The latest code must be merged/pushed to `main` or the Vercel production branch must be changed before future commits deploy automatically. A manually promoted deployment does not change the Git branch Vercel watches.

## Before launch testing

- Upload one product image, one category image, and one customer profile photo in the deployed app.
- Check every product photo, including the admin “Missing photo” list and any remaining external links.
- Verify staff sign-in code and customer/staff password recovery email delivery on the deployed domains.
- Test storefront, staff screens, checkout, and the printed receipt at phone width.
- Check the sitemap/robots files and confirm the production frontend and API use the same Neon database.
