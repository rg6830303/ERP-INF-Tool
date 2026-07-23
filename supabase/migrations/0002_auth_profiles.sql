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
