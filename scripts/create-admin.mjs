#!/usr/bin/env node
/**
 * Create (or promote) the first administrator account.
 *
 *   npm run create-admin -- --username admin --password 'StrongPass!23' --name 'Head Office'
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (or in a local .env.local file).
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Minimal .env.local loader (avoids a dotenv dependency).
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'infinityexports.local';

if (!url || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const username = (arg('username') || 'admin').toLowerCase();
const password = arg('password');
const fullName = arg('name') || 'Administrator';

if (!password || password.length < 8) {
  console.error('❌ Provide --password of at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `${username}@${domain}`;

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username, full_name: fullName, role: 'admin' },
});

if (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

// The DB trigger creates the profile; make sure the role is admin.
await supabase.from('profiles').update({ role: 'admin', is_active: true }).eq('id', data.user.id);

console.log(`✅ Admin account created:`);
console.log(`   username: ${username}`);
console.log(`   login at: /login   (use the username, not the email)`);
