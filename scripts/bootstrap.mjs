#!/usr/bin/env node
/**
 * Provision the ERP's login accounts in Supabase Auth (admin + employees) and
 * guarantee each has a matching `profiles` row with the right role.
 *
 * Run this from anywhere that CAN reach your Supabase project (your laptop or
 * CI) AFTER you have applied supabase/setup.sql:
 *
 *   node scripts/bootstrap.mjs                 # uses scripts/users.json if present,
 *                                              # else creates sensible defaults
 *   node scripts/bootstrap.mjs --users path.json
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from the
 * environment or a local .env.local). Idempotent: re-running updates roles and
 * only resets a password when one is explicitly provided for that user.
 */
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
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

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function strongPassword() {
  // 16 chars, url-safe + a symbol, guaranteed mixed.
  const base = randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  return `Ie${base}!9`.slice(0, 18);
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'infinityexports.local';

if (!url || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// Default accounts if no users.json is supplied.
const DEFAULTS = [
  { username: 'admin', role: 'admin', full_name: 'Head Office (Admin)' },
  { username: 'krishna', role: 'employee', full_name: 'Krishna' },
  { username: 'priya', role: 'employee', full_name: 'Priya Nair' },
];

// Priority: --users flag → scripts/users.json → ERP_USERS_JSON env (used by CI
// so passwords stay in a secret, never in the repo or logs) → built-in defaults.
const usersFile = arg('users') || (existsSync('scripts/users.json') ? 'scripts/users.json' : null);
let specs;
if (usersFile) {
  specs = JSON.parse(readFileSync(usersFile, 'utf8'));
} else if (process.env.ERP_USERS_JSON) {
  specs = JSON.parse(process.env.ERP_USERS_JSON);
} else {
  specs = DEFAULTS;
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Build a map of existing auth users by email (one page up to 1000).
const existing = new Map();
{
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error(`❌ Could not list users: ${error.message}`);
    process.exit(1);
  }
  for (const u of data.users) existing.set((u.email || '').toLowerCase(), u);
}

const results = [];

for (const spec of specs) {
  const username = String(spec.username).toLowerCase().trim();
  const email = `${username}@${domain}`;
  const role = spec.role === 'admin' ? 'admin' : 'employee';
  const full_name = spec.full_name || null;
  let password = spec.password || null;
  let userId;
  let action;

  const found = existing.get(email.toLowerCase());
  if (found) {
    userId = found.id;
    action = 'existing';
    if (password) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) console.warn(`⚠️  ${username}: password not updated — ${error.message}`);
      else action = 'password reset';
    }
    // keep metadata role in sync
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { username, full_name, role },
    });
  } else {
    if (!password) password = strongPassword();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name, role },
    });
    if (error) {
      console.error(`❌ ${username}: ${error.message}`);
      continue;
    }
    userId = data.user.id;
    action = 'created';
  }

  // Guarantee a profiles row with the correct role (covers users created
  // before the trigger existed). Upsert via the service role.
  const { error: pErr } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, username, full_name, role, is_active: true },
      { onConflict: 'id' },
    );
  if (pErr) console.warn(`⚠️  ${username}: profile upsert — ${pErr.message}`);

  results.push({ username, role, action, password: spec.password ? '(kept/you set)' : password });
}

console.log('\n========================================================');
console.log('  Infinity Exports ERP — accounts provisioned');
console.log('  Log in at /login using the USERNAME (not the email).');
console.log('========================================================');
for (const r of results) {
  console.log(
    `  @${r.username.padEnd(12)} ${r.role.padEnd(9)} ${r.action.padEnd(14)} ` +
      (r.password ? `password: ${r.password}` : ''),
  );
}
console.log('========================================================');
console.log('⚠️  Store these passwords securely and change them after first login.\n');
