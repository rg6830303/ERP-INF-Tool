# Supabase Setup — Infinity Exports ERP

This folder contains the complete PostgreSQL schema, security policies, audit
triggers and optional seed data for the ERP.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL**, **anon key** and **service_role key** from
   _Project Settings → API_ into your `.env.local` / Vercel env vars
   (see `.env.example`).

## 2. Run the migrations (in order)

Open _SQL Editor_ in the Supabase dashboard and run each file top to bottom:

| Order | File                               | Purpose                                       |
| ----- | ---------------------------------- | --------------------------------------------- |
| 1     | `migrations/0001_schema.sql`       | Tables, enums, indexes, totals triggers       |
| 2     | `migrations/0002_auth_profiles.sql`| Profile auto-provisioning + auth helpers      |
| 3     | `migrations/0003_activity_audit.sql`| Audit trail triggers on every business table |
| 4     | `migrations/0004_rls.sql`          | Row Level Security (default-deny) + policies  |
| 5     | `seed.sql` _(optional)_            | Sample buyers / suppliers / items             |

> If you use the Supabase CLI: `supabase db push` after placing these under
> `supabase/migrations` (they already are).

## 3. Auth configuration

In _Authentication → Providers → Email_:

- **Enable Email provider** (used under the hood — users only ever type a
  username; the app maps it to `username@AUTH_EMAIL_DOMAIN`).
- **Disable "Confirm email"** — accounts are created pre-confirmed by the
  admin API, and there is no public sign-up.
- Turn **off** "Enable sign ups" (accounts are created only by admins).

In _Authentication → Sessions_ (optional hardening):

- The app enforces a **hard 6-hour** logout for everyone regardless of these
  values. You may additionally shorten the **JWT expiry** and keep refresh
  token rotation **on** for defence in depth. Multiple concurrent sessions per
  user across devices are allowed (do **not** enable single-session).

## 4. Create the first admin

```bash
npm run create-admin -- --username admin --password 'StrongPass!23' --name 'Head Office'
```

(Needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the
environment.) After that, log in at `/login` and create the rest of your
employees from the **Admin → Users** screen.

## Schema at a glance

```
profiles ─ employee / admin accounts (role, is_active)
buyers ── suppliers ── items                       (masters)
sales ─< sale_items                                (export sales)
purchases ─< purchase_items                        (purchases)
stock_movements ─▶ inventory_status (view)         (inventory)
account_entries                                    (receipts / payments)
incentives                                         (RODTEP / drawback / …)
activity_logs ─ append-only audit of every write & login
```

All business tables are protected by RLS: only **active** accounts can read or
write, only **admins** can delete, and every change is written to
`activity_logs` automatically.
