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
