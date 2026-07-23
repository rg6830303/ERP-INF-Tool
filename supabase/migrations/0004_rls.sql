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
         using (public.is_admin());', t);
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
