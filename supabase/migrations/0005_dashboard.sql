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
