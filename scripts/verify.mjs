#!/usr/bin/env node
/**
 * Verifies the live database: inserts a sample export sale (header + line item)
 * and confirms the Buyer-wise, Date-wise and Item-wise search filters all
 * return it — the exact query shapes the user portal uses. Also checks that the
 * header total is recalculated by the DB trigger.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Safe & idempotent: it re-creates a single record tagged VERIFY-0001.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const today = new Date().toISOString().slice(0, 10);
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures++;
};

async function main() {
  // 1) Masters (idempotent upserts)
  await db.from('buyers').upsert(
    { buyer_code: 'VF-BUYER', name: 'Verification Buyer Ltd', country: 'United States', currency: 'USD' },
    { onConflict: 'buyer_code' },
  );
  await db.from('items').upsert(
    { item_code: 'VF-ITEM', name: 'Verification Widget', hs_code: '9999.99', unit: 'PCS', default_unit_price: 5 },
    { onConflict: 'item_code' },
  );
  const { data: buyer } = await db.from('buyers').select('id').eq('buyer_code', 'VF-BUYER').single();
  const { data: item } = await db.from('items').select('id').eq('item_code', 'VF-ITEM').single();
  check('Masters present (buyer + item)', !!buyer?.id && !!item?.id);

  // 2) Insert a sale header + line item (fresh each run)
  await db.from('sales').delete().eq('invoice_no', 'VERIFY-0001');
  const { data: sale, error: sErr } = await db
    .from('sales')
    .insert({
      invoice_no: 'VERIFY-0001',
      buyer_id: buyer.id,
      sale_date: today,
      currency: 'USD',
      status: 'confirmed',
      destination_country: 'United States',
      incoterm: 'FOB',
    })
    .select('id')
    .single();
  check('Sale header inserted', !sErr && !!sale?.id, sErr?.message);

  const { error: liErr } = await db.from('sale_items').insert({
    sale_id: sale.id,
    item_id: item.id,
    description: 'Verification Widget',
    hs_code: '9999.99',
    quantity: 10,
    unit: 'PCS',
    unit_price: 5,
    line_no: 1,
  });
  check('Sale line item inserted', !liErr, liErr?.message);

  // 3) Header total recalculated by trigger (10 × 5 = 50)
  const { data: saleAfter } = await db.from('sales').select('total_amount').eq('id', sale.id).single();
  check('Header total auto-calculated = 50', Number(saleAfter?.total_amount) === 50, `got ${saleAfter?.total_amount}`);

  // 4) SEARCH FILTERS — exactly as the user portal issues them
  // 4a) Buyer-wise
  const { data: byBuyer } = await db.from('sales').select('id, invoice_no').eq('buyer_id', buyer.id);
  check('Filter · Buyer-wise', (byBuyer ?? []).some((r) => r.invoice_no === 'VERIFY-0001'), `${byBuyer?.length} rows`);

  // 4b) Date-wise
  const { data: byDate } = await db
    .from('sales')
    .select('id, invoice_no')
    .gte('sale_date', today)
    .lte('sale_date', today);
  check('Filter · Date-wise', (byDate ?? []).some((r) => r.invoice_no === 'VERIFY-0001'), `${byDate?.length} rows`);

  // 4c) Item-wise (embedded inner join on line items)
  const { data: byItem, error: iErr } = await db
    .from('sales')
    .select('id, invoice_no, sale_items!inner(item_id)')
    .eq('sale_items.item_id', item.id);
  check('Filter · Item-wise', !iErr && (byItem ?? []).some((r) => r.invoice_no === 'VERIFY-0001'), iErr?.message ?? `${byItem?.length} rows`);

  // 5) Dashboard RPC responds
  const { data: dash, error: dErr } = await db.rpc('erp_dashboard');
  check('Dashboard RPC', !dErr && !!dash, dErr?.message);

  console.log('\n----------------------------------------');
  if (failures === 0) {
    console.log('🎉 ALL CHECKS PASSED — data entry + search filters verified.');
  } else {
    console.log(`⚠️  ${failures} check(s) failed.`);
  }
  console.log('----------------------------------------');
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('❌ Verification crashed:', e.message);
  process.exit(1);
});
