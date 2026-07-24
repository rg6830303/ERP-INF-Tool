#!/usr/bin/env node
/**
 * Lists all existing accounts (username, role, active, created, last sign-in).
 * Prints NO passwords or secrets — safe to run in CI logs. Used to confirm the
 * full set of accounts before generating/resetting credentials.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('❌ Missing Supabase URL or service role key.');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: profiles, error } = await db
  .from('profiles')
  .select('id, username, role, is_active, created_at')
  .order('created_at', { ascending: true });

if (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

const lastSignIn = new Map();
try {
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data.users) lastSignIn.set(u.id, u.last_sign_in_at ?? null);
} catch {
  /* non-fatal */
}

console.log('\n=== Existing accounts (usernames only — no passwords) ===');
console.log('username         role       active  last_sign_in');
console.log('---------------------------------------------------------------');
for (const p of profiles ?? []) {
  console.log(
    `${String(p.username).padEnd(16)} ${String(p.role).padEnd(10)} ${String(p.is_active).padEnd(7)} ${lastSignIn.get(p.id) ?? 'never'}`,
  );
}
console.log(`---------------------------------------------------------------`);
console.log(`Total accounts: ${profiles?.length ?? 0}\n`);
