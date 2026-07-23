# Infinity Exports — Import / Export ERP

A secure, in-house ERP for an import/export company: enter, search and manage
**Sales, Purchase, Inventory, Accounts and Incentives**, with a dedicated
**user portal** for employees and an **admin portal** with direct database
access and master control over every account and activity.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS** on
**Supabase (PostgreSQL + Auth)**, and ready for one-click **Vercel** deploys.

---

## ✨ Features

### User portal (employees)
- **Fast data entry** for every module via clean slide-over forms.
- **Powerful search & filters** — Sales/Purchase are filterable **Buyer/Supplier
  wise, Date wise and Item wise** (exactly as specified), plus status and free
  text. Results render in tidy, sortable tables with drill-in detail.
- **Modules**: Sales, Purchase, Inventory (live stock + movements), Accounts
  (receipts/payments), Incentives (RODTEP / Duty Drawback / EPCG …), and
  Masters (Buyers, Suppliers, Items).
- **Dashboard** with headline metrics and quick actions.

### Admin portal (administrators)
- **Master control of accounts**: create employees/admins, reset passwords,
  enable/disable, set roles, delete — all from the UI.
- **Activity log**: complete, filterable audit trail of every login and data
  change.
- **Direct database access**: browse any table/view and run a **read-only SQL
  console** (admin-gated in the database itself).

### Security (end-to-end)
- **Row Level Security** on every table (default-deny). Active accounts read/
  write business data; only admins delete; only admins see accounts & audit.
- **Server-side guards** on every page and admin API, plus security headers
  (HSTS, X-Frame-Options DENY, nosniff, etc.).
- **Service-role key never reaches the browser** — used only inside admin-gated
  server routes.
- **Hard 6-hour auto sign-out** for users *and* admins, enforced by middleware,
  an httpOnly session cookie **and** an in-tab countdown.
- **Unlimited multi-device sessions** per user (no sign-in count limits).
- **Username + password** login only (usernames are mapped to Supabase Auth
  under the hood). Sign-ups are disabled; only admins provision accounts.

---

## 🚀 Setup

### 1. Supabase
Follow **[`supabase/README.md`](supabase/README.md)** — run the six migrations
in order, (optionally) the seed, and configure the Email auth provider with
sign-ups disabled.

### 2. Environment
Copy `.env.example` → `.env.local` and fill in your Supabase URL, anon key and
service-role key.

### 3. Install & run
```bash
npm install
npm run dev
```

### 4. Create the first admin
```bash
npm run create-admin -- --username admin --password 'StrongPass!23' --name 'Head Office'
```
Then open `http://localhost:3000/login` and sign in with the **username**.

---

## ▲ Deploy to Vercel
1. Push this repo (production branch: **`main`**).
2. Import the project in Vercel (framework auto-detected as Next.js).
3. Add the env vars from `.env.example` under **Settings → Environment
   Variables** (mark `SUPABASE_SERVICE_ROLE_KEY` for the Production/Preview
   environments only — it is server-side).
4. Deploy. `vercel.json` pins **`main`** as the production branch.

> Optionally shorten the Supabase JWT expiry for extra hardening; the app’s hard
> 6-hour window is enforced independently regardless of that value.

---

## 🗂 Project structure
```
supabase/migrations   SQL schema, RLS, audit, dashboard & admin SQL functions
src/app/login         Username/password login (+ 6h session cookie)
src/app/(app)         Authenticated shell — dashboard & all modules
src/app/(app)/admin   Admin portal (users, activity, database)
src/app/api/admin     Admin-gated service-role routes (user management)
src/components         UI primitives, config-driven CRUD & document engines
src/lib                Supabase clients, auth guards, formatting, constants
middleware.ts          Auth gating + 6-hour session enforcement
```

## 🧱 Data model
`profiles` · `buyers` · `suppliers` · `items` · `sales`/`sale_items` ·
`purchases`/`purchase_items` · `stock_movements` (+ `inventory_status` view) ·
`account_entries` · `incentives` · `activity_logs`.
