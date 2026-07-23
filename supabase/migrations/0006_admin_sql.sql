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
