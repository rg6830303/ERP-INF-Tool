-- ============================================================================
-- Infinity Exports ERP — CONSOLIDATED SETUP
-- Paste this ENTIRE file into the Supabase SQL Editor and run once.
-- Concatenation of migrations 0001–0008 (idempotent, safe to re-run).
-- After running this, provision logins with: node scripts/bootstrap.mjs
-- ============================================================================

-- >>> 0001_schema.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0001 Schema
-- Core tables for an Import / Export business management tool.
-- Run order: 0001 → 0002 → 0003 → 0004. See supabase/README.md.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";         -- case-insensitive usernames

-- Enumerated types -----------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'employee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sale_status as enum ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.purchase_status as enum ('draft', 'ordered', 'received', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.movement_type as enum ('in', 'out', 'adjustment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.entry_type as enum ('receipt', 'payment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.party_type as enum ('buyer', 'supplier', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.incentive_status as enum ('pending', 'filed', 'approved', 'received', 'rejected');
exception when duplicate_object then null; end $$;

-- Generic updated_at maintenance --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ===========================================================================
-- PROFILES  (employee & admin accounts, 1:1 with auth.users)
-- ===========================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    citext unique not null,
  full_name   text,
  role        public.user_role not null default 'employee',
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_active on public.profiles(is_active);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- MASTERS
-- ===========================================================================

-- Buyers (foreign customers / importers) ------------------------------------
create table if not exists public.buyers (
  id             uuid primary key default gen_random_uuid(),
  buyer_code     text unique not null,
  name           text not null,
  contact_person text,
  email          text,
  phone          text,
  country        text,
  address        text,
  currency       text not null default 'USD',
  tax_id         text,
  notes          text,
  is_active      boolean not null default true,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_buyers_name on public.buyers using gin (to_tsvector('simple', coalesce(name,'')));
create index if not exists idx_buyers_country on public.buyers(country);

drop trigger if exists trg_buyers_updated on public.buyers;
create trigger trg_buyers_updated before update on public.buyers
  for each row execute function public.set_updated_at();

-- Suppliers (vendors) -------------------------------------------------------
create table if not exists public.suppliers (
  id             uuid primary key default gen_random_uuid(),
  supplier_code  text unique not null,
  name           text not null,
  contact_person text,
  email          text,
  phone          text,
  country        text,
  address        text,
  tax_id         text,
  notes          text,
  is_active      boolean not null default true,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_suppliers_name on public.suppliers using gin (to_tsvector('simple', coalesce(name,'')));

drop trigger if exists trg_suppliers_updated on public.suppliers;
create trigger trg_suppliers_updated before update on public.suppliers
  for each row execute function public.set_updated_at();

-- Items (products) ----------------------------------------------------------
create table if not exists public.items (
  id                 uuid primary key default gen_random_uuid(),
  item_code          text unique not null,
  name               text not null,
  description        text,
  hs_code            text,
  unit               text not null default 'PCS',
  category           text,
  default_unit_price numeric(14,2) not null default 0,
  currency           text not null default 'USD',
  reorder_level      numeric(14,2) not null default 0,
  is_active          boolean not null default true,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_items_name on public.items using gin (to_tsvector('simple', coalesce(name,'')));
create index if not exists idx_items_hs on public.items(hs_code);
create index if not exists idx_items_category on public.items(category);

drop trigger if exists trg_items_updated on public.items;
create trigger trg_items_updated before update on public.items
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- SALES  (export sales)
-- ===========================================================================
create table if not exists public.sales (
  id                  uuid primary key default gen_random_uuid(),
  invoice_no          text unique not null,
  buyer_id            uuid not null references public.buyers(id) on delete restrict,
  sale_date           date not null default current_date,
  currency            text not null default 'USD',
  exchange_rate       numeric(14,4) not null default 1,
  incoterm            text,
  port_of_loading     text,
  port_of_discharge   text,
  destination_country text,
  shipping_bill_no    text,
  shipping_bill_date  date,
  bl_awb_no           text,
  container_no        text,
  vessel_name         text,
  total_amount        numeric(16,2) not null default 0,
  status              public.sale_status not null default 'draft',
  remarks             text,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_sales_buyer on public.sales(buyer_id);
create index if not exists idx_sales_date on public.sales(sale_date);
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_invoice on public.sales(invoice_no);

drop trigger if exists trg_sales_updated on public.sales;
create trigger trg_sales_updated before update on public.sales
  for each row execute function public.set_updated_at();

create table if not exists public.sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales(id) on delete cascade,
  item_id     uuid references public.items(id) on delete set null,
  description text,
  hs_code     text,
  quantity    numeric(16,3) not null default 0,
  unit        text not null default 'PCS',
  unit_price  numeric(14,2) not null default 0,
  amount      numeric(16,2) generated always as (round(quantity * unit_price, 2)) stored,
  line_no     int not null default 1
);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_item on public.sale_items(item_id);

-- ===========================================================================
-- PURCHASE
-- ===========================================================================
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  bill_no       text unique not null,
  supplier_id   uuid not null references public.suppliers(id) on delete restrict,
  purchase_date date not null default current_date,
  currency      text not null default 'USD',
  exchange_rate numeric(14,4) not null default 1,
  total_amount  numeric(16,2) not null default 0,
  status        public.purchase_status not null default 'ordered',
  remarks       text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_purchases_supplier on public.purchases(supplier_id);
create index if not exists idx_purchases_date on public.purchases(purchase_date);
create index if not exists idx_purchases_status on public.purchases(status);

drop trigger if exists trg_purchases_updated on public.purchases;
create trigger trg_purchases_updated before update on public.purchases
  for each row execute function public.set_updated_at();

create table if not exists public.purchase_items (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  item_id     uuid references public.items(id) on delete set null,
  description text,
  quantity    numeric(16,3) not null default 0,
  unit        text not null default 'PCS',
  unit_price  numeric(14,2) not null default 0,
  amount      numeric(16,2) generated always as (round(quantity * unit_price, 2)) stored,
  line_no     int not null default 1
);
create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);
create index if not exists idx_purchase_items_item on public.purchase_items(item_id);

-- ===========================================================================
-- INVENTORY  (stock movement ledger + current-stock view)
-- ===========================================================================
create table if not exists public.stock_movements (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null references public.items(id) on delete cascade,
  movement_date  date not null default current_date,
  movement_type  public.movement_type not null,
  quantity       numeric(16,3) not null,
  reference_type text,
  reference_no   text,
  notes          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_stock_item on public.stock_movements(item_id);
create index if not exists idx_stock_date on public.stock_movements(movement_date);

-- Signed quantity: 'in' and positive 'adjustment' add, 'out' subtracts.
create or replace view public.inventory_status as
select
  i.id            as item_id,
  i.item_code,
  i.name          as item_name,
  i.unit,
  i.category,
  i.hs_code,
  i.reorder_level,
  coalesce(sum(
    case
      when m.movement_type = 'out' then -m.quantity
      else m.quantity
    end
  ), 0) as on_hand
from public.items i
left join public.stock_movements m on m.item_id = i.id
group by i.id, i.item_code, i.name, i.unit, i.category, i.hs_code, i.reorder_level;

-- ===========================================================================
-- ACCOUNTS  (receipts & payments ledger)
-- ===========================================================================
create table if not exists public.account_entries (
  id             uuid primary key default gen_random_uuid(),
  entry_date     date not null default current_date,
  entry_type     public.entry_type not null,
  party_type     public.party_type not null default 'other',
  buyer_id       uuid references public.buyers(id) on delete set null,
  supplier_id    uuid references public.suppliers(id) on delete set null,
  party_name     text,
  amount         numeric(16,2) not null,
  currency       text not null default 'USD',
  payment_mode   text,
  reference_no   text,
  against_invoice text,
  notes          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_account_entries_date on public.account_entries(entry_date);
create index if not exists idx_account_entries_type on public.account_entries(entry_type);
create index if not exists idx_account_entries_buyer on public.account_entries(buyer_id);

drop trigger if exists trg_account_entries_updated on public.account_entries;
create trigger trg_account_entries_updated before update on public.account_entries
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- INCENTIVE  (export incentives — RODTEP / Duty Drawback / EPCG / etc.)
-- ===========================================================================
create table if not exists public.incentives (
  id               uuid primary key default gen_random_uuid(),
  sale_id          uuid references public.sales(id) on delete set null,
  buyer_id         uuid references public.buyers(id) on delete set null,
  shipping_bill_no text,
  scheme           text not null default 'RODTEP',
  claim_date       date not null default current_date,
  incentive_rate   numeric(8,4) not null default 0,
  incentive_amount numeric(16,2) not null default 0,
  currency         text not null default 'INR',
  status           public.incentive_status not null default 'pending',
  received_date    date,
  received_amount  numeric(16,2),
  notes            text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_incentives_status on public.incentives(status);
create index if not exists idx_incentives_scheme on public.incentives(scheme);
create index if not exists idx_incentives_date on public.incentives(claim_date);

drop trigger if exists trg_incentives_updated on public.incentives;
create trigger trg_incentives_updated before update on public.incentives
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- ACTIVITY LOGS  (audit trail — admin visibility into all activity)
-- ===========================================================================
create table if not exists public.activity_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid,
  username    text,
  action      text not null,
  table_name  text,
  record_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_activity_user on public.activity_logs(user_id);
create index if not exists idx_activity_action on public.activity_logs(action);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);

-- ===========================================================================
-- HEADER TOTAL RECALCULATION (keeps sales/purchases totals in sync with lines)
-- ===========================================================================
create or replace function public.recalc_sale_total()
returns trigger
language plpgsql
as $$
declare
  v_sale_id uuid := coalesce(new.sale_id, old.sale_id);
begin
  update public.sales s
    set total_amount = coalesce((
      select sum(amount) from public.sale_items where sale_id = v_sale_id
    ), 0)
  where s.id = v_sale_id;
  return null;
end;
$$;

drop trigger if exists trg_sale_items_total on public.sale_items;
create trigger trg_sale_items_total
  after insert or update or delete on public.sale_items
  for each row execute function public.recalc_sale_total();

create or replace function public.recalc_purchase_total()
returns trigger
language plpgsql
as $$
declare
  v_purchase_id uuid := coalesce(new.purchase_id, old.purchase_id);
begin
  update public.purchases p
    set total_amount = coalesce((
      select sum(amount) from public.purchase_items where purchase_id = v_purchase_id
    ), 0)
  where p.id = v_purchase_id;
  return null;
end;
$$;

drop trigger if exists trg_purchase_items_total on public.purchase_items;
create trigger trg_purchase_items_total
  after insert or update or delete on public.purchase_items
  for each row execute function public.recalc_purchase_total();

-- >>> 0002_auth_profiles.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0002 Auth helpers & profile provisioning
-- ============================================================================

-- Auto-provision a profile whenever a Supabase Auth user is created.
-- Username / full_name / role are read from user metadata supplied by the
-- admin "create user" API. Falls back to the local-part of the email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_role     public.user_role;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );

  begin
    v_role := (coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'employee'))::public.user_role;
  exception when others then
    v_role := 'employee';
  end;

  insert into public.profiles (id, username, full_name, role, is_active, created_by)
  values (
    new.id,
    v_username,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    v_role,
    true,
    nullif(new.raw_user_meta_data->>'created_by', '')::uuid
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Security-definer helpers used by RLS policies. They read profiles WITHOUT
-- triggering RLS recursion (SECURITY DEFINER + explicit search_path).
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- Any active account (admin or employee).
create or replace function public.is_active_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_active_account() from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_account() to authenticated;

-- >>> 0003_activity_audit.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0003 Activity audit triggers
-- Every write to a business table is recorded in activity_logs so admins can
-- monitor exactly who did what and when.
-- ============================================================================

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_record   jsonb;
  v_id       text;
begin
  select username into v_username from public.profiles where id = auth.uid();

  if (tg_op = 'DELETE') then
    v_record := to_jsonb(old);
    v_id := coalesce(v_record->>'id', '');
  else
    v_record := to_jsonb(new);
    v_id := coalesce(v_record->>'id', '');
  end if;

  insert into public.activity_logs (user_id, username, action, table_name, record_id, details)
  values (
    auth.uid(),
    coalesce(v_username, 'system'),
    tg_op,
    tg_table_name,
    v_id,
    jsonb_build_object(
      'op', tg_op,
      'summary', case
        when tg_table_name = 'sales'          then coalesce(v_record->>'invoice_no', v_id)
        when tg_table_name = 'purchases'       then coalesce(v_record->>'bill_no', v_id)
        when tg_table_name = 'buyers'          then coalesce(v_record->>'name', v_id)
        when tg_table_name = 'suppliers'       then coalesce(v_record->>'name', v_id)
        when tg_table_name = 'items'           then coalesce(v_record->>'name', v_id)
        when tg_table_name = 'account_entries' then coalesce(v_record->>'reference_no', v_id)
        when tg_table_name = 'incentives'      then coalesce(v_record->>'shipping_bill_no', v_id)
        else v_id
      end
    )
  );

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

-- Attach audit trigger to all business tables.
do $$
declare
  t text;
  tables text[] := array[
    'buyers','suppliers','items',
    'sales','sale_items','purchases','purchase_items',
    'stock_movements','account_entries','incentives'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$I;', t);
    execute format(
      'create trigger trg_audit_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.log_activity();', t
    );
  end loop;
end $$;

-- >>> 0004_rls.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0004 Row Level Security
-- Default-deny on every table. Access is granted only through the policies
-- below, evaluated against the caller's profile (active? admin?).
-- ============================================================================

-- Table privileges: RLS still governs *which rows*. anon gets nothing.
grant usage on schema public to authenticated;

alter default privileges in schema public revoke all on tables from anon;

do $$
declare t text;
  tbls text[] := array[
    'profiles','buyers','suppliers','items',
    'sales','sale_items','purchases','purchase_items',
    'stock_movements','account_entries','incentives','activity_logs'
  ];
begin
  foreach t in array tbls loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end $$;

-- View: honour RLS of the caller, then expose to authenticated users.
alter view public.inventory_status set (security_invoker = on);
grant select on public.inventory_status to authenticated;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- BUSINESS TABLES — active accounts read/write; only admins delete.
-- ---------------------------------------------------------------------------
do $$
declare t text;
  tbls text[] := array[
    'buyers','suppliers','items',
    'sales','sale_items','purchases','purchase_items',
    'stock_movements','account_entries','incentives'
  ];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists %1$s_select on public.%1$I;', t);
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated
         using (public.is_active_account());', t);

    execute format('drop policy if exists %1$s_insert on public.%1$I;', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated
         with check (public.is_active_account());', t);

    execute format('drop policy if exists %1$s_update on public.%1$I;', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated
         using (public.is_active_account()) with check (public.is_active_account());', t);

    execute format('drop policy if exists %1$s_delete on public.%1$I;', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated
         using (public.is_active_account());', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- ACTIVITY LOGS — admins read; nobody updates/deletes; inserts come only
-- from SECURITY DEFINER triggers/RPCs (which bypass RLS).
-- ---------------------------------------------------------------------------
drop policy if exists activity_admin_select on public.activity_logs;
create policy activity_admin_select on public.activity_logs
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPC: record a LOGIN / LOGOUT event for the current user (SECURITY DEFINER
-- so it can insert into the append-only audit table).
-- ---------------------------------------------------------------------------
create or replace function public.log_auth_event(p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_username text;
begin
  if auth.uid() is null then
    return;
  end if;
  if p_action not in ('LOGIN','LOGOUT') then
    raise exception 'invalid auth action';
  end if;
  select username into v_username from public.profiles where id = auth.uid();
  insert into public.activity_logs (user_id, username, action, table_name, details)
  values (auth.uid(), coalesce(v_username,'unknown'), p_action, 'auth',
          jsonb_build_object('at', now()));
end;
$$;

revoke all on function public.log_auth_event(text) from public;
grant execute on function public.log_auth_event(text) to authenticated;

-- >>> 0005_dashboard.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0005 Dashboard aggregate function
-- SECURITY INVOKER: runs as the caller so RLS still applies (only active
-- accounts get data). Returns a single JSON object of headline metrics.
-- ============================================================================

create or replace function public.erp_dashboard()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'sales_count',            (select count(*) from public.sales),
    'sales_total',            (select coalesce(sum(total_amount), 0) from public.sales where status <> 'cancelled'),
    'sales_total_month',      (select coalesce(sum(total_amount), 0) from public.sales
                                where status <> 'cancelled'
                                  and sale_date >= date_trunc('month', current_date)),
    'purchase_count',         (select count(*) from public.purchases),
    'purchase_total',         (select coalesce(sum(total_amount), 0) from public.purchases where status <> 'cancelled'),
    'buyers_count',           (select count(*) from public.buyers where is_active),
    'suppliers_count',        (select count(*) from public.suppliers where is_active),
    'items_count',            (select count(*) from public.items where is_active),
    'pending_incentive_amt',  (select coalesce(sum(incentive_amount), 0) from public.incentives
                                where status in ('pending','filed','approved')),
    'low_stock_count',        (select count(*) from public.inventory_status
                                where on_hand <= reorder_level)
  );
$$;

revoke all on function public.erp_dashboard() from public;
grant execute on function public.erp_dashboard() to authenticated;

-- >>> 0006_admin_sql.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0006 Admin read-only SQL console
-- Lets admins run ad-hoc SELECT queries from the Admin → Database screen.
-- Hard-gated to admins INSIDE the function (so it is safe even if called
-- directly with the anon key) and restricted to read-only statements.
-- ============================================================================

create or replace function public.admin_execute_sql(query text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text;
  result json;
begin
  -- Authorisation: only active admins, checked against the CALLER's identity.
  if not public.is_admin() then
    raise exception 'forbidden: admin access required';
  end if;

  clean := btrim(query);
  -- Drop a single trailing semicolon, then forbid any statement separators.
  clean := regexp_replace(clean, ';\s*$', '');
  if position(';' in clean) > 0 then
    raise exception 'only a single statement is allowed';
  end if;

  -- Read-only guard: must begin with SELECT or WITH.
  if lower(clean) !~ '^(select|with)\s' then
    raise exception 'only SELECT / WITH (read-only) queries are permitted';
  end if;

  -- Block obvious write keywords defensively.
  if lower(clean) ~ '\y(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy)\y' then
    raise exception 'write / DDL keywords are not permitted';
  end if;

  -- Cap runtime and rows.
  set local statement_timeout = '8s';
  execute format(
    'select coalesce(json_agg(t), ''[]''::json) from (select * from (%s) q limit 500) t',
    clean
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_execute_sql(text) from public;
grant execute on function public.admin_execute_sql(text) to authenticated;

-- >>> 0007_admin_stats.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0007 Admin database statistics
-- Real database size (bytes) + total record count, for the admin dashboard's
-- "storage remaining" card. Admin-gated inside the function.
-- ============================================================================

create or replace function public.admin_db_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  db_bytes bigint;
  result   json;
begin
  if not public.is_admin() then
    raise exception 'forbidden: admin access required';
  end if;

  select pg_database_size(current_database()) into db_bytes;

  select json_build_object(
    'database_bytes', db_bytes,
    'total_records', (
      (select count(*) from public.sales) +
      (select count(*) from public.sale_items) +
      (select count(*) from public.purchases) +
      (select count(*) from public.purchase_items) +
      (select count(*) from public.buyers) +
      (select count(*) from public.suppliers) +
      (select count(*) from public.items) +
      (select count(*) from public.stock_movements) +
      (select count(*) from public.account_entries) +
      (select count(*) from public.incentives)
    ),
    'account_count', (select count(*) from public.profiles)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_db_stats() from public;
grant execute on function public.admin_db_stats() to authenticated;

-- >>> 0008_delete_policies.sql ------------------------------------------------------------
-- ============================================================================
-- Infinity Exports ERP — 0008 Allow active accounts to delete business records
-- Both employees and admins may add / edit / remove operational data.
-- (Profiles & activity_logs are unaffected — still admin-only / append-only.)
-- ============================================================================

do $$
declare t text;
  tbls text[] := array[
    'buyers','suppliers','items',
    'sales','sale_items','purchases','purchase_items',
    'stock_movements','account_entries','incentives'
  ];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists %1$s_delete on public.%1$I;', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated
         using (public.is_active_account());', t);
  end loop;
end $$;

