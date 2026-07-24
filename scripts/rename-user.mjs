#!/usr/bin/env node
/**
 * Renames existing accounts (username + login email + full name) WITHOUT
 * changing their password or their user id. Reads a JSON spec from --renames,
 * a file, or the RENAME_JSON env var:
 *
 *   [{ "from": "rakesh", "to": "krishna", "full_name": "Krishna" }]
 *
 *   node scripts/rename-user.mjs --renames '[{"from":"rakesh","to":"krishna","full_name":"Krishna"}]'
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Prints usernames only — never passwords.
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
function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'infinityexports.local';
if (!url || !key) {
  console.error('❌ Missing Supabase URL or service role key.');
  process.exit(1);
}

const raw =
  arg('renames') ||
  process.env.RENAME_JSON ||
  (existsSync('scripts/renames.json') ? readFileSync('scripts/renames.json', 'utf8') : null);
if (!raw) {
  console.log('No renames provided — nothing to do.');
  process.exit(0);
}
const specs = JSON.parse(raw);

const db = createClient(url, key, { auth: { persistSession: false } });
const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
const byEmail = new Map(list.users.map((u) => [(u.email || '').toLowerCase(), u]));

for (const s of specs) {
  const from = String(s.from).toLowerCase().trim();
  const to = String(s.to).toLowerCase().trim();
  const fromEmail = `${from}@${domain}`;
  const toEmail = `${to}@${domain}`;
  const full_name = s.full_name ?? null;

  const user = byEmail.get(fromEmail.toLowerCase());
  if (!user) {
    console.warn(`⚠️  ${from}: not found — skipped.`);
    continue;
  }
  if (byEmail.has(toEmail.toLowerCase())) {
    console.warn(`⚠️  ${to}: already exists — skipped ${from}→${to}.`);
    continue;
  }

  // Update auth email + metadata (password untouched).
  const { error: authErr } = await db.auth.admin.updateUserById(user.id, {
    email: toEmail,
    email_confirm: true,
    user_metadata: { ...(user.user_metadata || {}), username: to, full_name },
  });
  if (authErr) {
    console.error(`❌ ${from}→${to}: ${authErr.message}`);
    continue;
  }

  // Update the profile row.
  const patch = { username: to };
  if (full_name !== null) patch.full_name = full_name;
  const { error: pErr } = await db.from('profiles').update(patch).eq('id', user.id);
  if (pErr) console.warn(`⚠️  ${to}: profile update — ${pErr.message}`);

  console.log(`✅ Renamed @${from} → @${to} (password unchanged).`);
}
