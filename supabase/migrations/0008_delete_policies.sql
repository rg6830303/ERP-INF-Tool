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
