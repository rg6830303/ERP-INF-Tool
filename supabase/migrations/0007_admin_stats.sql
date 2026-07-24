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
