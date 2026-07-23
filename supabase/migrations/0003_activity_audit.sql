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
