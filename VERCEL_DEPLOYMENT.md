# Deploying Bishnu and Dhungana Stores on Vercel

The app uses two Vercel projects connected to the same Git repository. The frontend project includes a small API proxy so the browser can continue calling `/api` on the shop's own domain. The backend project runs the Express API. PostgreSQL stores customer accounts, products, categories, and orders.

## 1. Create a PostgreSQL database

Create a PostgreSQL database through Vercel Marketplace. Neon is one provider option. Keep the database credentials private. If the provider offers pooled and direct connection URLs, use the pooled URL for the running API and the direct URL for Prisma migrations.

## 2. Deploy the backend

Create a Vercel project from the repository and select `backend` for **Root Directory**. Vercel recognizes the Express entry point at `src/server.ts`; the build script generates Prisma Client and compiles the backend.

Add these settings to the backend Vercel project's **Production** environment:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The production PostgreSQL runtime URL; use the provider's pooled URL when available |
| `JWT_SECRET` | A unique random secret with at least 32 characters |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | The frontend's HTTPS origin, with no trailing slash |
| `STAFF_URL` | Dedicated staff portal origin, for example `https://staff.yourdomain.com` |
| `OWNER_ADMIN_EMAIL` | Owner's sign-in-code and recovery address; defaults to `nishandhungana939@gmail.com` |
| `SMTP_HOST` | SMTP hostname from your email provider |
| `SMTP_PORT` | SMTP port from your email provider, commonly `587` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password or app password |
| `SMTP_FROM` | A sender address allowed by your email provider |
| `TRUST_PROXY_HOPS` | `1` |

Vercel supplies `PORT`. The application has a local fallback for development.

## 3. Create the tables and first owner account

Run these one-time setup steps from PowerShell after the database exists. Use the provider's direct database URL for the migration. The secure prompt keeps the URL out of the command history; it is held only in the current PowerShell process.

```powershell
Set-Location backend
$dbUrl = Read-Host "Paste the direct PostgreSQL connection URL" -AsSecureString
$env:DATABASE_URL = [System.Net.NetworkCredential]::new("", $dbUrl).Password
npx prisma migrate deploy

$env:ADMIN_USERNAME = Read-Host "Choose the owner login name"
$securePassword = Read-Host "Choose an admin password (12+ characters)" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm run admin:setup

Remove-Item Env:ADMIN_USERNAME, Env:ADMIN_PASSWORD, Env:DATABASE_URL
```

`admin:setup` creates or resets the owner with the `ADMIN` role and uses `OWNER_ADMIN_EMAIL` for sign-in codes and recovery. Set `DISABLE_EXISTING_STAFF=true` in the PowerShell session before `npm run admin:setup` to disable existing staff and any other admin accounts; their records are preserved. The script never creates a default password or public admin registration. The seed command loads `backend/.env` when run locally, while temporary PowerShell variables take precedence.

Do not run `prisma migrate dev` or the sample product seed against the production database. Review sample product data before deciding whether to add it to a live store.

## 4. Deploy the frontend

Create a second Vercel project from the same repository and select `frontend` for **Root Directory**. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.

Add `BACKEND_URL` and `VITE_STAFF_URL` to the frontend project's **Production** environment. `BACKEND_URL` is the deployed backend project's HTTPS origin, for example `https://your-store-api.vercel.app`; do not add `/api` at the end. `VITE_STAFF_URL` is the staff hostname, for example `https://staff.yourdomain.com`. The function in `frontend/api/[...apiPath].ts` sends `/api/*` requests to that backend. `frontend/vercel.json` routes API requests to the proxy, supplies the frontend route fallback, and adds security headers.

To make `https://staff.yourdomain.com` work, you need to own `yourdomain.com`. In the same Vercel frontend project, add both the shop's domain (such as `yourdomain.com`) and the staff hostname (`staff.yourdomain.com`). Vercel will show the DNS records to enter with the domain provider. Once DNS is verified and the variables above are set, rebuild the frontend. Opening the staff hostname goes directly to staff sign-in; admin paths opened on the shop hostname forward to the staff hostname. The staff hostname is a separate entry point, while login and backend role checks continue to protect the actual admin features.

Set the backend's `FRONTEND_URL` to the shop origin and `STAFF_URL` to the staff origin, then redeploy it. Customer password reset links go to the shop; staff/admin reset links go to the staff hostname. The backend allows both origins. Keep preview environments isolated from the production database unless you intentionally want preview orders and changes to affect the live store.

## How admin access works

- Customers use the customer login on the shop site. The admin login is separate, and there is no public admin signup.
- The owner and staff open `/staff-login` or the staff hostname (for example, `https://staff.yourdomain.com`) and sign in there with their individual accounts. Password sign-in is followed by a one-time email code; the owner code goes to `OWNER_ADMIN_EMAIL`, while staff codes go to each account's recovery email.
- The owner uses **Staff Access** to create a separate account for each staff member and can disable accounts when access is no longer needed.
- Staff use the same admin login page but have narrower permissions. They can view and update order fulfillment. Owner-only actions such as managing products, categories, payment methods, and staff accounts require the `ADMIN` role.
- Backend API authorization enforces the role checks; hiding admin pages from customers is not the only access control.
- Configure SMTP before launch so owner/staff sign-in codes and customer/admin password recovery emails can be delivered. The owner email is configured with `OWNER_ADMIN_EMAIL`; staff use the recovery email entered when their account is created.

The current rate limiter keeps counters in API process memory. On Vercel, multiple function instances can have separate counters, so this is best-effort protection rather than a shared/global abuse limit. Add a shared rate-limit store before relying on it as a strong defense against automated login attempts. Set up database backups and verify that a backup can be restored before accepting real orders.
