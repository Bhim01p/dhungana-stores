# Bishnu and Dhungana Stores



A full-stack grocery store web application.

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Node.js + Express + TypeScript      |
| ORM      | Prisma                              |
| Database | PostgreSQL                          |
| Frontend | React + TypeScript + Tailwind CSS *(Build 3+)* |

---

## Database

```
Database : bishnu_dhungana_stores
Host     : localhost
Port     : 5432
User     : postgres
```

---

## Environment Setup

1. Copy the example env file:

```bash
cp backend/.env.example backend/.env
```

2. Open `backend/.env` and fill in your PostgreSQL password:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/bishnu_dhungana_stores"
```

---

## Installation

```bash
cd backend
npm install
```

---

## Prisma

Generate the Prisma Client:

```bash
cd backend
npx prisma generate
```

Run database migrations:

```bash
cd backend
npx prisma migrate dev --name init
```

> **Note:** Make sure `backend/.env` has a valid `DATABASE_URL` before running migrations.

Inspect the database with Prisma Studio:

```bash
cd backend
npx prisma studio
```

## Admin and staff access

There is no public admin sign-up page. Create or reset the first ADMIN account from the backend folder with a one-time setup command. In PowerShell:

```powershell
$env:ADMIN_USERNAME = "admin"
$env:OWNER_ADMIN_EMAIL = "owner@example.com"
$securePassword = Read-Host "Choose an admin password (12+ characters)" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm run admin:setup
$env:ADMIN_USERNAME = $null
$env:OWNER_ADMIN_EMAIL = $null
$env:ADMIN_PASSWORD = $null
```

The command creates the ADMIN account if it does not exist, or resets the password and saves its recovery email if that ADMIN username already exists. It does not print the password. Keep the password private and clear the temporary environment values after setup. Do not put real passwords in source files or commit them.

The owner and staff sign in at `/staff-login` (or on the configured staff domain). After signing in, the main admin can open **Staff Access** to create staff accounts, choose the areas each person can use, change staff passwords, or disable access. Staff permissions are checked by the API as well as the interface. Staff cannot change or recover their own password; ask the main admin to set a new one. The main admin can change their password under **My Account** or request recovery from the staff login page. Disabling an account ends its API access, including for an existing login token.

Customers can request a password reset from `/forgot-password`. Main-admin recovery is available from the staff login page and sends a code/link to `OWNER_ADMIN_EMAIL` (defaults to `nishandhungana939@gmail.com`). Staff passwords are reset by the main admin in **Staff Access**. Owner and staff sign-ins also require a one-time email code, sent to the owner's recovery email or the staff member's recovery email. Reset links expire after 30 minutes and can only be used once. Configure `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `backend/.env` using credentials from an email-sending service. Until SMTP is configured, codes and password reset links cannot be delivered.

Apply checked-in migrations from `backend` with `npx prisma migrate dev` for a local database. Production deployments should apply them with `npx prisma migrate deploy`.

Database model tests create and delete records. They require a separate `TEST_DATABASE_URL` and reject the same URL as `DATABASE_URL`. By default, only a loopback test database is allowed; using a dedicated remote test database requires explicitly setting `ALLOW_REMOTE_TEST_DATABASE=true`. Never point tests at the production database. See [backend/TESTING.md](backend/TESTING.md).

## Production deployment

For the Vercel setup, production environment variables, database migration steps, and first-admin account setup, follow [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md). Guest orders use a long random lookup credential held in the current browser session. Keep it private; registering with a matching phone number does not claim old guest orders.

---

## Development

Start the backend in development mode:

```bash
cd backend
npm run dev
```

The backend will start on [http://localhost:5000](http://localhost:5000).

---

## Health Check

Once the server is running, verify it is healthy:

```
GET http://localhost:5000/api/health
GET http://localhost:5000/api/health/db
```

---

## Testing

Run backend tests:

```bash
cd backend
npm test
```

---

## Project Structure

```
bishnuanddhungana-stores/
├── backend/
│   ├── src/
│   │   ├── config/         # Prisma client, env config
│   │   ├── controllers/    # Route handler logic
│   │   ├── middleware/      # Error handling, validation
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Shared utilities
│   │   └── server.ts       # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/               # React app (Build 3+)
├── .gitignore
└── README.md
```

---

## Frontend (React + Vite + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on [http://localhost:3000](http://localhost:3000) and proxies all `/api` requests to the backend on port 5000.

---

## Seed Data

After running migrations, populate a development database with sample kirana products:

```bash
cd backend
npm run seed
```

Products included: Basmati Chamal, Chiura, Maida, Musuro Dal, Chana Dal, Sunflower Oil, Mustard Oil, Ghee, Chini, Nun, Wai Wai Noodles, Mayos Biscuit, Kurkure, Besar, Dhania Powder, Fresh Milk, Farm Eggs, Ilam Tea, Nescafe, and more.

---

## API Endpoints (Build 2)

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:idOrSlug` | Get category by id or slug |
| POST | `/api/categories` | Create a category (ADMIN login required) |
| PATCH | `/api/categories/:id` | Update a category (ADMIN login required) |
| DELETE | `/api/categories/:id` | Delete a category (ADMIN login required) |

Query params: `?active=true|false` `?page=1` `?limit=50`

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:idOrSlug` | Get product by id or slug |
| POST | `/api/products` | Create a product (ADMIN login required) |
| PATCH | `/api/products/:id` | Update a product (ADMIN login required) |
| DELETE | `/api/products/:id` | Deactivate a product (ADMIN login required) |

Query params: `?active=true` `?featured=true` `?category=<slug>` `?categoryId=<id>` `?search=<term>` `?page=1` `?limit=20`

---

## Build Roadmap

| Build | Scope |
|-------|-------|
| **Build 1** | Project foundation, database schema, health check ✅ |
| **Build 2** | Category + Product APIs, seed data, React frontend scaffold ✅ |
| Build 3 | Full product browsing UI, category filtering |
| Build 4 | Guest checkout, order flow |
